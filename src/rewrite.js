const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const prettier = require('prettier');
const { collapseJsxText, normalizeTemplateLiteral, normalizeBinaryExpression, getPlaceholderName, normalizeStringLiteral } = require('./normalize');

function parseFile(code, filename) {
  return parser.parse(code, {
    sourceType: 'module',
    sourceFilename: filename,
    allowReturnOutsideFunction: true,
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      'decorators-legacy',
      'dynamicImport',
      'exportDefaultFrom',
      'exportNamespaceFrom',
      'nullishCoalescingOperator',
      'optionalChaining',
      'objectRestSpread',
      'topLevelAwait',
    ],
  });
}

function getJsxNameName(nameNode) {
  if (t.isJSXIdentifier(nameNode)) return nameNode.name;
  if (t.isJSXMemberExpression(nameNode)) {
    let cur = nameNode;
    while (t.isJSXMemberExpression(cur)) cur = cur.property;
    return t.isJSXIdentifier(cur) ? cur.name : null;
  }
  return null;
}

function isFindTextCall(node) {
  return t.isCallExpression(node) && t.isIdentifier(node.callee) && node.callee.name === 'findText';
}

function makeFindTextCallFromTemplateString(text, kwargsEntries) {
  const args = [t.stringLiteral(text)];
  if (kwargsEntries && kwargsEntries.length) {
    const props = kwargsEntries.map(([key, expr]) => t.objectProperty(t.identifier(key), expr));
    args.push(t.objectExpression(props));
  }
  return t.callExpression(t.identifier('findText'), args);
}

function fromTemplateLiteral(node, source) {
  const { text, placeholders, sourceExprs } = normalizeTemplateLiteral(node, source);
  const entries = placeholders.map((ph, idx) => [ph, node.expressions[idx]]);
  return { text, entries };
}

function flattenBinaryToTextAndEntries(node, source) {
  const placeholders = [];
  const sourceExprs = {};
  const { text, placeholders: phs, sourceExprs: se } = normalizeBinaryExpression(node, source);
  phs.forEach((p) => placeholders.push(p));
  Object.assign(sourceExprs, se);
  // Build entries by re-walking to recover original expr nodes for placeholders in the same order
  const entries = [];
  let idx = 0;
  function walk(n) {
    if (t.isBinaryExpression(n) && n.operator === '+') {
      walk(n.left);
      walk(n.right);
      return;
    }
    if (t.isStringLiteral(n)) return;
    if (t.isTemplateLiteral(n)) {
      n.expressions.forEach((e) => {
        const name = getPlaceholderName(e, idx++, source);
        entries.push([name, e]);
      });
      return;
    }
    const name = getPlaceholderName(n, idx++, source);
    entries.push([name, n]);
  }
  walk(node);
  return { text, entries };
}

function tryStrictNormalize(expr, pathCtx, source) {
  if (t.isTemplateLiteral(expr)) {
    return fromTemplateLiteral(expr, source);
  }
  if (t.isBinaryExpression(expr) && expr.operator === '+') {
    return flattenBinaryToTextAndEntries(expr, source);
  }
  if (t.isStringLiteral(expr)) {
    return { text: normalizeStringLiteral(expr), entries: [] };
  }
  // Try to resolve identifiers bound to simple string templates/concats
  if (t.isIdentifier(expr)) {
    const binding = pathCtx.scope.getBinding(expr.name);
    if (binding && t.isVariableDeclarator(binding.path.node)) {
      const init = binding.path.node.init;
      if (t.isTemplateLiteral(init)) return fromTemplateLiteral(init, source);
      if (t.isBinaryExpression(init) && init.operator === '+') return flattenBinaryToTextAndEntries(init, source);
      if (t.isStringLiteral(init)) return { text: normalizeStringLiteral(init), entries: [] };
    }
  }
  // Resolve MemberExpression chains into local object literals
  if (t.isMemberExpression(expr) || t.isOptionalMemberExpression(expr)) {
    const res = resolveMemberExpressionStrict(expr, pathCtx, source);
    if (res) return res;
  }

  // Simple local function calls with single return of string/template/concat
  if (t.isCallExpression(expr)) {
    const res = resolveCallExpressionStrict(expr, pathCtx, source);
    if (res) return res;
  }
  // Otherwise fallback to loose
  return null;
}

function resolveMemberExpressionStrict(mem, pathCtx, source) {
  // Handle non-computed chains like copy.empty.title to local object literal
  const chain = [];
  let cur = mem;
  while (t.isMemberExpression(cur) || t.isOptionalMemberExpression(cur)) {
    if (cur.computed) return null;
    const prop = cur.property;
    if (!t.isIdentifier(prop)) return null;
    chain.unshift(prop.name);
    if (t.isIdentifier(cur.object)) {
      const binding = pathCtx.scope.getBinding(cur.object.name);
      if (!binding || !t.isVariableDeclarator(binding.path.node)) return null;
      const init = binding.path.node.init;
      if (!t.isObjectExpression(init)) return null;
      let obj = init;
      for (const key of chain) {
        const propNode = obj.properties.find(p => t.isObjectProperty(p) && ((t.isIdentifier(p.key) && p.key.name === key) || (t.isStringLiteral(p.key) && p.key.value === key)));
        if (!propNode) return null;
        const val = propNode.value;
        if (t.isObjectExpression(val)) { obj = val; continue; }
        if (t.isStringLiteral(val)) return { text: normalizeStringLiteral(val), entries: [] };
        if (t.isTemplateLiteral(val)) return fromTemplateLiteral(val, source);
        if (t.isBinaryExpression(val) && val.operator === '+') return flattenBinaryToTextAndEntries(val, source);
        return null;
      }
      return null;
    }
    cur = cur.object;
  }
  return null;
}

function analyzeFunctionReturnStrict(funcNode, pathCtx, source) {
  // Accept FunctionDeclaration, FunctionExpression, ArrowFunctionExpression
  // Only support simple, non-branching returns:
  // - ArrowFunctionExpression with expression body
  // - BlockStatement with a single ReturnStatement and no other statements
  if (t.isArrowFunctionExpression(funcNode) && !t.isBlockStatement(funcNode.body)) {
    const retExpr = funcNode.body;
    const strict = tryStrictNormalize(retExpr, pathCtx, source);
    return strict || null;
  }
  if (t.isBlockStatement(funcNode.body)) {
    const stmts = funcNode.body.body.filter((s) => !t.isEmptyStatement(s));
    if (stmts.length === 1 && t.isReturnStatement(stmts[0])) {
      const retExpr = stmts[0].argument;
      const strict = tryStrictNormalize(retExpr, pathCtx, source);
      return strict || null;
    }
  }
  return null;
}

function resolveCallExpressionStrict(call, pathCtx, source) {
  // Only simple callee identifier
  if (!t.isIdentifier(call.callee)) return null;
  const binding = pathCtx.scope.getBinding(call.callee.name);
  if (!binding) return null;
  const node = binding.path.node;
  let funcNode = null;
  if (t.isFunctionDeclaration(node)) funcNode = node;
  if (t.isVariableDeclarator(node) && (t.isFunctionExpression(node.init) || t.isArrowFunctionExpression(node.init))) funcNode = node.init;
  if (!funcNode) return null;

  const analyzed = analyzeFunctionReturnStrict(funcNode, pathCtx, source);
  if (!analyzed) return null;
  // Build kwargs entries aligning param names to call arguments
  const entries = [];
  const params = funcNode.params || [];
  const argMap = {};
  params.forEach((p, i) => { if (t.isIdentifier(p) && call.arguments[i]) argMap[p.name] = call.arguments[i]; });
  analyzed.entries.forEach(([key, expr]) => {
    // If key exists in argMap, replace expr with call arg
    if (argMap[key]) entries.push([key, argMap[key]]);
    else entries.push([key, expr]);
  });
  return { text: analyzed.text, entries };
}

function wrapJsxTextNode(value) {
  const norm = collapseJsxText(value);
  if (!norm) return null;
  const call = makeFindTextCallFromTemplateString(norm, null);
  return t.jsxExpressionContainer(call);
}

function toFindTextExpr(expr, pathCtx, source, mode) {
  if (isFindTextCall(expr)) return expr; // idempotent
  if (mode === 'strict') {
    const strict = tryStrictNormalize(expr, pathCtx, source);
    if (strict && strict.text != null) {
      return makeFindTextCallFromTemplateString(strict.text, strict.entries);
    }
  }
  // Loose fallback
  return t.callExpression(t.identifier('findText'), [expr]);
}

function wrapJsxExpression(expr, pathCtx, source, mode) {
  // Handle conditionals and logicals by wrapping branches
  if (t.isConditionalExpression(expr)) {
    const cons = toFindTextExpr(expr.consequent, pathCtx, source, mode);
    const alt = toFindTextExpr(expr.alternate, pathCtx, source, mode);
    return t.jsxExpressionContainer(t.conditionalExpression(expr.test, cons, alt));
  }
  if (t.isLogicalExpression(expr)) {
    if (expr.operator === '&&') {
      // Keep the test (left) intact; wrap the right string branch
      const right = toFindTextExpr(expr.right, pathCtx, source, mode);
      return t.jsxExpressionContainer(t.logicalExpression('&&', expr.left, right));
    }
    // For '||', wrap both sides
    const leftW = toFindTextExpr(expr.left, pathCtx, source, mode);
    const rightW = toFindTextExpr(expr.right, pathCtx, source, mode);
    return t.jsxExpressionContainer(t.logicalExpression(expr.operator, leftW, rightW));
  }
  return t.jsxExpressionContainer(toFindTextExpr(expr, pathCtx, source, mode));
}

async function rewriteFile(absPath, code, config) {
  const ast = parseFile(code, absPath);
  let changed = false;
  let nodesRewritten = 0;

  traverse(ast, {
    JSXElement(path) {
      const opening = path.node.openingElement;
      const elemName = getJsxNameName(opening.name);
      const thirdParty = config.thirdParty || {};

      // Rewrite attributes that surface text
      for (const attr of opening.attributes) {
        if (!t.isJSXAttribute(attr)) continue;
        if (!t.isJSXIdentifier(attr.name)) continue;
        if (attr.name.name === 'dangerouslySetInnerHTML') continue; // leave as-authored
        const attrName = attr.name.name;
        const allowedByName = config.allowAttrs.includes(attrName);
        const allowedByThirdParty = elemName && thirdParty[elemName] && Array.isArray(thirdParty[elemName]) && thirdParty[elemName].includes(attrName);
        if (!allowedByName && !allowedByThirdParty) continue;

        if (attr.value == null) continue;

        if (t.isStringLiteral(attr.value)) {
          // placeholder-free literal -> findText("...")
          const call = makeFindTextCallFromTemplateString(attr.value.value, null);
          attr.value = t.jsxExpressionContainer(call);
          changed = true; nodesRewritten++;
        } else if (t.isJSXExpressionContainer(attr.value)) {
          const inner = attr.value.expression;
          if (isFindTextCall(inner)) continue;
          // Try strict, else loose
          const strict = config.mode === 'strict' ? tryStrictNormalize(inner, path, code) : null;
          if (strict && strict.text) {
            const call = makeFindTextCallFromTemplateString(strict.text, strict.entries);
            attr.value = t.jsxExpressionContainer(call);
            changed = true; nodesRewritten++;
          } else {
            const call = t.callExpression(t.identifier('findText'), [inner]);
            attr.value = t.jsxExpressionContainer(call);
            changed = true; nodesRewritten++;
          }
        }
      }

      // HTML collapsing (opt-in): replace mixed text + inline children with a single HTML template
      if (config.htmlCollapse && config.htmlCollapse.apply) {
        const whitelist = (config.htmlCollapse.inlineWhitelist || []).map((s) => s.toLowerCase());

        function isInlineAllowed(el) {
          const name = getJsxNameName(el.openingElement.name);
          if (!name) return false;
          if (name[0] !== name[0].toLowerCase()) return false; // custom components not allowed
          return whitelist.includes(name.toLowerCase());
        }

        function hasUnsafeAttrs(el) {
          for (const a of el.openingElement.attributes) {
            if (t.isJSXSpreadAttribute(a)) return true;
            if (t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && /^on[A-Z]/.test(a.name.name)) return true;
          }
          return false;
        }

        function styleObjectToCss(objExpr) {
          // Convert simple style object literal to inline CSS string
          const segs = [];
          for (const prop of objExpr.properties) {
            if (!t.isObjectProperty(prop)) return null;
            let key = '';
            if (t.isIdentifier(prop.key)) key = prop.key.name; else if (t.isStringLiteral(prop.key)) key = prop.key.value; else return null;
            // camelCase to kebab-case
            key = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
            const v = prop.value;
            if (t.isStringLiteral(v)) segs.push(`${key}: ${v.value}`);
            else if (t.isNumericLiteral(v)) segs.push(`${key}: ${v.value}`);
            else return null;
          }
          return segs.join('; ');
        }

        function buildInlineFragment(el) {
          // Returns TemplateLiteral for the inline fragment and a derived placeholder name (if any)
          const tag = getJsxNameName(el.openingElement.name).toLowerCase();
          if (hasUnsafeAttrs(el)) return null;

          const strParts = [`<${tag}`];
          const exprs = [];
          let namingExpr = null; // prefer first content expression for placeholder naming

          // Serialize attributes
          for (const a of el.openingElement.attributes) {
            if (!t.isJSXAttribute(a) || !t.isJSXIdentifier(a.name)) continue;
            const name = a.name.name;
            if (a.value == null) {
              strParts[strParts.length - 1] += ` ${name}`;
              continue;
            }
            if (t.isStringLiteral(a.value)) {
              const esc = a.value.value.replace(/"/g, '&quot;');
              strParts[strParts.length - 1] += ` ${name}="${esc}"`;
              continue;
            }
            if (t.isJSXExpressionContainer(a.value)) {
              const inner = a.value.expression;
              if (name === 'style' && t.isObjectExpression(inner)) {
                const css = styleObjectToCss(inner);
                if (!css) return null; // complex style
                const esc = css.replace(/"/g, '&quot;');
                strParts[strParts.length - 1] += ` style="${esc}"`;
              } else {
                // dynamic attr
                strParts[strParts.length - 1] += ` ${name}="`;
                exprs.push(inner);
                strParts.push('"');
              }
              continue;
            }
          }
          strParts[strParts.length - 1] += '>';

          // Utility: unwrap findText calls when safe
          function unwrapFindText(exprNode) {
            if (!t.isCallExpression(exprNode) || !t.isIdentifier(exprNode.callee, { name: 'findText' })) return { kind: 'expr', expr: exprNode };
            const args = exprNode.arguments || [];
            const first = args[0];
            if (!first || !t.isStringLiteral(first)) return { kind: 'expr', expr: exprNode };
            const text = first.value || '';
            const phMatches = text.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
            if (phMatches.length === 0) {
              // Pure static -> treat as text segment
              return { kind: 'text', text };
            }
            if (phMatches.length === 1 && args[1] && t.isObjectExpression(args[1])) {
              const name = phMatches[0].slice(1, -1);
              const prop = args[1].properties.find(
                (p) => t.isObjectProperty(p) && ((t.isIdentifier(p.key) && p.key.name === name) || (t.isStringLiteral(p.key) && p.key.value === name))
              );
              if (prop) return { kind: 'expr', expr: prop.value, name };
            }
            return { kind: 'expr', expr: exprNode };
          }

          // Recursively serialize children: text | expr | inline element
          function serializeChildren(children) {
            for (const ch of children) {
              if (t.isJSXText(ch)) {
                const txt = collapseJsxText(ch.value);
                if (txt) strParts[strParts.length - 1] += txt;
              } else if (t.isJSXExpressionContainer(ch)) {
                let innerRes = unwrapFindText(ch.expression);
                if (innerRes.kind === 'text') {
                  strParts[strParts.length - 1] += innerRes.text;
                } else {
                  const expr = innerRes.expr;
                  exprs.push(expr);
                  if (!namingExpr && (t.isIdentifier(expr) || t.isMemberExpression(expr) || t.isOptionalMemberExpression(expr))) {
                    namingExpr = expr;
                  }
                  strParts.push('');
                }
              } else if (t.isJSXElement(ch)) {
                if (!isInlineAllowed(ch) || hasUnsafeAttrs(ch)) return false;
                const name = getJsxNameName(ch.openingElement.name).toLowerCase();
                // Open tag
                strParts[strParts.length - 1] += `<${name}`;
                // Serialize nested attributes on the same arrays
                for (const a of ch.openingElement.attributes) {
                  if (!t.isJSXAttribute(a) || !t.isJSXIdentifier(a.name)) continue;
                  const an = a.name.name;
                  if (a.value == null) { strParts[strParts.length - 1] += ` ${an}`; continue; }
                  if (t.isStringLiteral(a.value)) {
                    const esc = a.value.value.replace(/"/g, '&quot;');
                    strParts[strParts.length - 1] += ` ${an}="${esc}"`;
                  } else if (t.isJSXExpressionContainer(a.value)) {
                    const inner = a.value.expression;
                    if (an === 'style' && t.isObjectExpression(inner)) {
                      const css = styleObjectToCss(inner);
                      if (!css) return false;
                      const esc = css.replace(/"/g, '&quot;');
                      strParts[strParts.length - 1] += ` style="${esc}"`;
                    } else {
                      strParts[strParts.length - 1] += ` ${an}="`;
                      exprs.push(inner);
                      strParts.push('"');
                    }
                  }
                }
                strParts[strParts.length - 1] += '>';
                // Recurse into nested children
                if (!serializeChildren(ch.children || [])) return false;
                // Close nested tag
                strParts[strParts.length - 1] += `</${name}>`;
              } else {
                return false; // other node kinds not supported
              }
            }
            return true;
          }

          if (!serializeChildren(el.children || [])) return null;
          // Close tag
          strParts[strParts.length - 1] += `</${tag}>`;

          // Build TemplateLiteral
          if (exprs.length === 0) {
            return { tpl: t.templateLiteral([t.templateElement({ raw: strParts[0], cooked: strParts[0] }, true)], []), placeholderName: null };
          }
          const quasis = [];
          for (let i = 0; i < strParts.length; i++) {
            const tail = i === strParts.length - 1;
            quasis.push(t.templateElement({ raw: strParts[i], cooked: strParts[i] }, tail));
          }
          const placeholderName = namingExpr ? getPlaceholderName(namingExpr, 0, code) : null;
          return { tpl: t.templateLiteral(quasis, exprs), placeholderName };
        }

        // Determine eligibility: at least one text-like segment and at least one inline child; no non-text expressions
        const kids = path.node.children || [];
        let hasText = false;
        let hasInline = false;
        let eligible = true;
        for (const ch of kids) {
          if (t.isJSXText(ch)) {
            if (collapseJsxText(ch.value)) hasText = true;
          } else if (t.isJSXElement(ch)) {
            if (!isInlineAllowed(ch)) { eligible = false; break; }
            if (hasUnsafeAttrs(ch)) { eligible = false; break; }
            hasInline = true;
          } else if (t.isJSXExpressionContainer(ch)) {
            // Treat findText("...") as text; allow whitespace-only string literal
            const e = ch.expression;
            if (t.isStringLiteral(e) && /^\s+$/.test(e.value)) {
              continue;
            }
            if (t.isCallExpression(e) && t.isIdentifier(e.callee, { name: 'findText' }) && e.arguments && e.arguments[0] && t.isStringLiteral(e.arguments[0])) {
              hasText = true;
              continue;
            }
            eligible = false; break;
          } else {
            eligible = false; break;
          }
        }

        if (eligible && hasText && hasInline) {
          // Build template and kwargs
          let templateText = '';
          const entries = [];
          for (const ch of kids) {
            if (t.isJSXText(ch)) {
              const txt = collapseJsxText(ch.value);
              if (txt) templateText += (templateText && !templateText.endsWith(' ') ? ' ' : '') + txt;
            } else if (t.isJSXExpressionContainer(ch)) {
              const e = ch.expression;
              if (t.isCallExpression(e) && t.isIdentifier(e.callee, { name: 'findText' }) && e.arguments && e.arguments[0] && t.isStringLiteral(e.arguments[0])) {
                const txt = e.arguments[0].value || '';
                if (txt) templateText += (templateText && !templateText.endsWith(' ') ? ' ' : '') + txt;
              }
            } else if (t.isJSXElement(ch)) {
              const built = buildInlineFragment(ch);
              if (!built) { eligible = false; break; }
              const ph = built.placeholderName || 'arg' + (entries.length + 1);
              entries.push([ph, built.tpl]);
              templateText += (templateText && !templateText.endsWith(' ') ? ' ' : '') + `{${ph}}`;
            }
          }
          if (eligible && templateText) {
            // Replace children with dangerouslySetInnerHTML
            const call = makeFindTextCallFromTemplateString(templateText.trim(), entries);
            const obj = t.objectExpression([
              t.objectProperty(t.identifier('__html'), call),
            ]);
            // Remove existing children
            path.node.children = [];
            // Add/replace dangerouslySetInnerHTML attribute
            const existingIdx = opening.attributes.findIndex((a) => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name, { name: 'dangerouslySetInnerHTML' }));
            const attr = t.jsxAttribute(t.jsxIdentifier('dangerouslySetInnerHTML'), t.jsxExpressionContainer(obj));
            if (existingIdx >= 0) opening.attributes[existingIdx] = attr; else opening.attributes.push(attr);

            changed = true; nodesRewritten++;
            path.skip();
            return; // skip further child processing
          }
        }
      }

      // Try to merge children into a single findText call when possible
      const kids = path.node.children || [];

      function exprContainsJSX(n) {
        let found = false;
        function walk(x) {
          if (!x || found) return;
          if (t.isJSXElement(x) || t.isJSXFragment(x)) { found = true; return; }
          const keys = t.VISITOR_KEYS[x.type] || [];
          for (const k of keys) {
            const v = x[k];
            if (Array.isArray(v)) v.forEach(walk); else walk(v);
          }
        }
        walk(n);
        return found;
      }

      function isMapCall(n) {
        return t.isCallExpression(n) && t.isMemberExpression(n.callee) && t.isIdentifier(n.callee.property, { name: 'map' });
      }

      const canMerge = (
        kids.length > 0 &&
        !kids.some((ch) => t.isJSXElement(ch)) &&
        kids.every((ch) => {
          if (t.isJSXText(ch)) return true;
          if (t.isJSXExpressionContainer(ch)) {
            const e = ch.expression;
            if (isFindTextCall(e)) return false;
            if (t.isConditionalExpression(e) || t.isLogicalExpression(e)) return false; // handle separately
            if (exprContainsJSX(e) || isMapCall(e)) return false;
            // allow if strictly normalizable or simple identifier/member
            const strict = tryStrictNormalize(e, path, code);
            if (strict) return true;
            if (t.isIdentifier(e) || t.isMemberExpression(e) || t.isOptionalMemberExpression(e)) return true;
            return false;
          }
          return false;
        })
      );

      if (canMerge) {
        let template = '';
        const entries = [];
        let exprIndex = 0;

        function appendSpaceIfEdgeSpace(raw, collapsed, isLeading) {
          // Preserve a single space when author intended edge spacing
          if (!raw) return collapsed;
          if (isLeading) {
            if (/^[\t\n\r\f ]+/.test(raw)) {
              return (collapsed ? ' ' : ' ') + collapsed; // ensure a space at start
            }
          } else {
            if (/[\t\n\r\f ]+$/.test(raw)) {
              return collapsed + ' ';
            }
          }
          return collapsed;
        }

        for (let i = 0; i < kids.length; i++) {
          const ch = kids[i];
          if (t.isJSXText(ch)) {
            let txt = collapseJsxText(ch.value);
            // Re-add edge spaces if present in the raw
            if (txt) {
              // leading space if previous segment is placeholder or start
              const lead = i === 0;
              const trail = i === kids.length - 1;
              if (lead) {
                txt = appendSpaceIfEdgeSpace(ch.value, txt, true);
              }
              if (trail) {
                txt = appendSpaceIfEdgeSpace(ch.value, txt, false);
              }
              template += (template && !template.endsWith(' ') && !txt.startsWith(' ') ? ' ' : '') + txt;
            }
          } else if (t.isJSXExpressionContainer(ch)) {
            const expr = ch.expression;
            // Ignore pure whitespace expressions like {' '}
            if (t.isStringLiteral(expr) && /^\s+$/.test(expr.value)) {
              template += ' ';
              continue;
            }
            const strict = tryStrictNormalize(expr, path, code);
            if (strict) {
              // Merge strict text and collect entries
              if (template && !template.endsWith(' ')) template += ' ';
              template += strict.text;
              strict.entries.forEach(([k, v]) => entries.push([k, v]));
            } else {
              let entryExpr = expr;
              const placeholderName = getPlaceholderName(expr, exprIndex++, code);
              entries.push([placeholderName, entryExpr]);
              if (template && !template.endsWith(' ')) template += ' ';
              template += `{${placeholderName}}`;
            }
          }
        }

        template = template.replace(/\s+/g, ' ').trim();
        if (template) {
          const call = makeFindTextCallFromTemplateString(template, entries);
          path.node.children = [t.jsxExpressionContainer(call)];
          changed = true; nodesRewritten++;
          return; // skip per-child rewrite when merged
        }
      }

      // Rewrite children
      const newChildren = [];
      for (const ch of path.node.children) {
        if (t.isJSXText(ch)) {
          const wrapped = wrapJsxTextNode(ch.value);
          if (wrapped) { newChildren.push(wrapped); changed = true; nodesRewritten++; }
          else newChildren.push(ch); // keep whitespace-only
        } else if (t.isJSXExpressionContainer(ch)) {
          // Ignore pure spaces like {' '}
          if (t.isStringLiteral(ch.expression) && /^\s+$/.test(ch.expression.value)) {
            newChildren.push(ch);
            continue;
          }
          // Skip wrapping if the expression yields JSX or a map over items (node-like)
          const e = ch.expression;
          const wrapped = (function() {
            if (isMapCall(e)) return null;
            if (exprContainsJSX(e)) return null;
            return wrapJsxExpression(e, path, code, config.mode);
          })();
          if (wrapped) { newChildren.push(wrapped); changed = true; nodesRewritten++; }
          else newChildren.push(ch);
        } else {
          newChildren.push(ch);
        }
      }
      if (newChildren.length !== path.node.children.length) {
        path.node.children = newChildren;
      } else {
        // Even if lengths match, we may have replaced some nodes
        if (newChildren.some((n, i) => n !== path.node.children[i])) {
          path.node.children = newChildren;
        }
      }
    },
  });

  if (!changed) return { changed: false, code };
  let output = generate(ast, { jsescOption: { minimal: true } }, code).code;
  if (config.format) {
    try {
      const ext = path.extname(absPath).toLowerCase();
      const parserName = ext === '.ts' || ext === '.tsx' ? 'babel-ts' : 'babel';
      output = await prettier.format(output, {
        parser: parserName,
        singleQuote: true,
        trailingComma: 'all',
      });
    } catch (e) {
      // Ignore formatting errors, keep generated code
    }
  }
  return { changed: true, code: output, nodesRewritten };
}

async function runRewrite(config) {
  const patterns = config.include || ['**/*.{js,jsx,ts,tsx}'];
  const ignore = config.exclude || [];
  const files = await fg(patterns, { cwd: config.root, ignore, absolute: true, dot: false });

  let filesProcessed = 0;
  let filesChanged = 0;
  let nodesRewritten = 0;

  for (const abs of files) {
    const code = fs.readFileSync(abs, 'utf8');
    const { changed, code: newCode, nodesRewritten: n } = await rewriteFile(abs, code, config);
    filesProcessed++;
    if (changed) {
      filesChanged++;
      nodesRewritten += (n || 0);
      if (!config.dryRun) fs.writeFileSync(abs, newCode);
    }
  }

  return { filesProcessed, filesChanged, nodesRewritten };
}

module.exports = { runRewrite };
