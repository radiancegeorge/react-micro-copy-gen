const fs = require('fs');
const path = require('path');
const fg = require('fast-glob');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const {
  collapseJsxText,
  normalizeStringLiteral,
  normalizeTemplateLiteral,
  normalizeBinaryExpression,
  isStringLiteralLike,
  asCode,
} = require('./normalize');
const { getPlaceholderName } = require('./normalize');

const NON_TEXT_PROPS = new Set([
  'class', 'className', 'style', 'id', 'htmlFor', 'role', 'type', 'src', 'href', 'to',
  'd', 'viewBox', 'fill', 'stroke', 'width', 'height', 'color', 'bg', 'background',
  'variant', 'size', 'key', 'data-testid', 'aria-hidden', 'tabIndex', 'disabled',
  'checked', 'required', 'name', 'value', 'defaultValue'
]);

function isLikelyMicrocopy(text, attrName) {
  if (!text) return false;
  const trimmed = String(text).trim();
  if (!trimmed) return false;
  if (attrName && NON_TEXT_PROPS.has(attrName)) return false;
  if (/^https?:\/\/|^(mailto:|tel:)/i.test(trimmed)) return false;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return false;
  if (/^(rgb|rgba)\(/i.test(trimmed)) return false;
  if (!/[a-z]/i.test(trimmed)) return false;
  return true;
}

function isChildrenReference(expr) {
  if (!expr) return false;
  if (t.isIdentifier(expr, { name: 'children' })) return true;
  const isMem = (n) => t.isMemberExpression(n) || t.isOptionalMemberExpression(n);
  let cur = expr;
  while (isMem(cur)) {
    const prop = cur.property;
    if (cur.computed && t.isStringLiteral(prop) && prop.value === 'children') return true;
    if (!cur.computed && t.isIdentifier(prop, { name: 'children' })) return true;
    cur = cur.object;
  }
  return false;
}

function deepCollectPlainStringsInExpression(expr, pathCtx) {
  const out = [];
  function visit(n) {
    if (!n) return;
    if (t.isStringLiteral(n)) {
      const val = n.value;
      if (val && val.trim() !== '') out.push(val);
      return;
    }
    if (t.isArrayExpression(n)) {
      (n.elements || []).forEach(visit);
      return;
    }
    if (t.isObjectExpression(n)) {
      (n.properties || []).forEach((p) => {
        if (t.isObjectProperty(p)) visit(p.value);
      });
      return;
    }
  }
  visit(expr);
  return out;
}

function isUppercaseName(name) {
  return typeof name === 'string' && /^[A-Z]/.test(name);
}

function isComponentReference(expr) {
  if (!expr) return false;
  if (t.isIdentifier(expr)) return isUppercaseName(expr.name);
  if (t.isMemberExpression(expr) || t.isOptionalMemberExpression(expr)) {
    const prop = expr.property;
    if (!expr.computed && t.isIdentifier(prop)) return isUppercaseName(prop.name);
    if (expr.computed && t.isStringLiteral(prop)) return isUppercaseName(prop.value);
  }
  return false;
}

function isReactCreateElementCall(expr) {
  if (!t.isCallExpression(expr)) return false;
  const callee = expr.callee;
  if (t.isIdentifier(callee, { name: 'createElement' })) return true;
  if (t.isMemberExpression(callee) && !callee.computed) {
    if (t.isIdentifier(callee.property, { name: 'createElement' })) return true;
  }
  return false;
}

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

function getRel(root, abs) {
  return path.relative(root, abs) || path.basename(abs);
}

function getLoc(node) {
  if (!node || !node.loc) return null;
  return {
    start: { line: node.loc.start.line, column: node.loc.start.column },
    end: { line: node.loc.end.line, column: node.loc.end.column },
  };
}

function getJsxNameName(nameNode) {
  // Return simple name string for JSX element: <Foo.Bar> -> 'Bar', <Foo> -> 'Foo'
  if (t.isJSXIdentifier(nameNode)) return nameNode.name;
  if (t.isJSXMemberExpression(nameNode)) {
    let cur = nameNode;
    while (t.isJSXMemberExpression(cur)) cur = cur.property;
    return t.isJSXIdentifier(cur) ? cur.name : null;
  }
  return null;
}

function placeholderSetKey(placeholders) {
  return JSON.stringify([...new Set(placeholders)].sort());
}

function shouldIndexText(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return false;
  // Skip single-symbol texts like ":", "@", "-"
  if (trimmed === ':' || trimmed === '@' || trimmed === '-') return false;
  // Skip single placeholder-only texts like "{name}" with nothing else
  if (/^\{\s*[a-zA-Z0-9_]+\s*\}$/.test(trimmed)) return false;
  return true;
}

function addOccurrence(state, occ) {
  if (!shouldIndexText(occ.text)) return;
  state.occurrences.push(occ);
  // messages dedupe by text
  const key = occ.text;
  if (!state.messagesMap.has(key)) {
    state.messagesMap.set(key, {
      text: occ.text,
      placeholders: [...new Set(occ.placeholders || [])],
      occurrences: [
        {
          file: occ.file,
          loc: occ.loc,
          context: occ.context,
          element: occ.element,
          attribute: occ.attribute || null,
        },
      ],
      _placeholderSetKeys: new Set([placeholderSetKey(occ.placeholders || [])]),
    });
  } else {
    const msg = state.messagesMap.get(key);
    msg.occurrences.push({
      file: occ.file,
      loc: occ.loc,
      context: occ.context,
      element: occ.element,
      attribute: occ.attribute || null,
    });
    // union placeholders for reference; collisions handled in report
    const set = new Set(msg.placeholders);
    (occ.placeholders || []).forEach((p) => set.add(p));
    msg.placeholders = [...set];
    msg._placeholderSetKeys.add(placeholderSetKey(occ.placeholders || []));
  }
}

function collectStringFromExpression(expr, pathCtx, source, opts = {}) {
  // Returns array of { text, placeholders, sourceExprs }
  const out = [];

  // Never treat React children references as text
  if (isChildrenReference(expr)) return out;
  if (isComponentReference(expr)) return out;
  if (isReactCreateElementCall(expr)) return out;

  function add(res) {
    if (!res) return;
    if (!res.text) return;
    // Skip single placeholder-only expressions like {name} ONLY when requested (children context)
    if (opts.skipPlaceholderOnly && /^\{[a-zA-Z0-9_]+\}$/.test(res.text)) return;
    out.push({ text: res.text, placeholders: res.placeholders || [], sourceExprs: res.sourceExprs || {} });
  }

  function resolveIdentifier(id) {
    const binding = pathCtx.scope.getBinding(id.name);
    if (!binding) return null;
    const bnode = binding.path.node;
    // VariableDeclarator or FunctionDeclaration
    if (t.isVariableDeclarator(bnode)) {
      const init = bnode.init;
      return resolveNode(init);
    }
    if (t.isFunctionDeclaration(bnode)) {
      return analyzeFunctionReturn(bnode);
    }
    return null;
  }

  function resolveMemberExpression(mem) {
    // Only handle non-computed chain like copy.empty.title
    const chain = [];
    let cur = mem;
    while (t.isMemberExpression(cur) || t.isOptionalMemberExpression(cur)) {
      const prop = cur.property;
      if (cur.computed) return null;
      if (!t.isIdentifier(prop)) return null;
      chain.unshift(prop.name);
      if (t.isIdentifier(cur.object)) {
        // Base identifier
        const baseBinding = pathCtx.scope.getBinding(cur.object.name);
        if (!baseBinding) return null;
        const baseNode = baseBinding.path.node;
        if (!t.isVariableDeclarator(baseNode)) return null;
        const init = baseNode.init;
        if (!t.isObjectExpression(init)) return null;
        // Walk object literal by chain
        let obj = init;
        for (const key of chain) {
          const propNode = obj.properties.find(
            (p) => t.isObjectProperty(p) && ((t.isIdentifier(p.key) && p.key.name === key) || (t.isStringLiteral(p.key) && p.key.value === key))
          );
          if (!propNode) return null;
          const val = propNode.value;
          if (t.isObjectExpression(val)) {
            obj = val;
            continue;
          }
          // Final value
          return resolveNode(val);
        }
        return null;
      }
      cur = cur.object;
    }
    return null;
  }

  function analyzeFunctionReturn(funcNode) {
    // Support simple arrow/function bodies without traversing non-Program/File nodes
    // - ArrowFunctionExpression with expression body -> body is the return
    // - BlockStatement body -> first top-level ReturnStatement
    if (t.isArrowFunctionExpression(funcNode) && !t.isBlockStatement(funcNode.body)) {
      const retExpr = funcNode.body;
      return resolveNode(retExpr, funcNode.params || []);
    }
    const body = funcNode.body;
    if (t.isBlockStatement(body)) {
      const stmts = body.body || [];
      for (const s of stmts) {
        if (t.isReturnStatement(s)) {
          return resolveNode(s.argument, funcNode.params || []);
        }
      }
    }
    return null;
  }

  function resolveCallExpression(call) {
    // Simple: function name identifier only
    if (t.isIdentifier(call.callee)) {
      const binding = pathCtx.scope.getBinding(call.callee.name);
      if (binding) {
        const bnode = binding.path.node;
        if (t.isFunctionDeclaration(bnode)) {
          const analyzed = analyzeFunctionReturn(bnode);
          if (analyzed && analyzed.placeholders && (bnode.params || []).length > 0) {
            // Map param names to call args
            const nameMap = {};
            bnode.params.forEach((p, idx) => {
              if (t.isIdentifier(p)) nameMap[p.name] = call.arguments[idx] ? asCode(source, call.arguments[idx]) : undefined;
            });
            const sourceExprs = { ...analyzed.sourceExprs };
            analyzed.placeholders.forEach((ph) => {
              if (nameMap[ph]) sourceExprs[ph] = nameMap[ph];
            });
            return { text: analyzed.text, placeholders: analyzed.placeholders, sourceExprs };
          }
          return analyzed;
        }
        if (t.isVariableDeclarator(bnode)) {
          const init = bnode.init;
          if (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init)) {
            const analyzed = analyzeFunctionReturn(init);
            if (analyzed && init.params && init.params.length > 0) {
              const nameMap = {};
              init.params.forEach((p, idx) => {
                if (t.isIdentifier(p)) nameMap[p.name] = call.arguments[idx] ? asCode(source, call.arguments[idx]) : undefined;
              });
              const sourceExprs = { ...analyzed.sourceExprs };
              analyzed.placeholders.forEach((ph) => {
                if (nameMap[ph]) sourceExprs[ph] = nameMap[ph];
              });
              return { text: analyzed.text, placeholders: analyzed.placeholders, sourceExprs };
            }
            return analyzed;
          }
        }
      }
    }
    return null;
  }

  function resolveNode(node, funcParams = []) {
    if (!node) return null;
    if (t.isStringLiteral(node)) {
      return { text: normalizeStringLiteral(node), placeholders: [], sourceExprs: {} };
    }
    if (t.isTemplateLiteral(node)) {
      return normalizeTemplateLiteral(node, source);
    }
    if (t.isBinaryExpression(node) && node.operator === '+') {
      return normalizeBinaryExpression(node, source);
    }
    if (t.isIdentifier(node)) {
      const r = resolveIdentifier(node);
      if (r) return r;
      // Fallback: treat bare identifier as placeholder
      return { text: `{${node.name}}`, placeholders: [node.name], sourceExprs: { [node.name]: node.name } };
    }
    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
      const r = resolveMemberExpression(node);
      if (r) return r;
      // Fallback: use last segment as placeholder name
      const ph = getPlaceholderName(node, 0, source);
      return { text: `{${ph}}`, placeholders: [ph], sourceExprs: {} };
    }
    if (t.isCallExpression(node)) {
      return resolveCallExpression(node);
    }
    // Function return referencing its params -> placeholders by param names
    if (funcParams.length > 0) {
      // If node is one of the params -> placeholder
      const idx = funcParams.findIndex((p) => t.isIdentifier(p) && t.isIdentifier(node) && p.name === node.name);
      if (idx >= 0) {
        const name = funcParams[idx].name;
        return { text: `{${name}}`, placeholders: [name], sourceExprs: { [name]: node.name } };
      }
    }

    return null;
  }

  // Collect
  if (t.isStringLiteral(expr)) {
    add({ text: normalizeStringLiteral(expr), placeholders: [], sourceExprs: {} });
  } else if (t.isTemplateLiteral(expr)) {
    add(normalizeTemplateLiteral(expr, source));
  } else if (t.isBinaryExpression(expr) && expr.operator === '+') {
    add(normalizeBinaryExpression(expr, source));
  } else if (t.isConditionalExpression(expr)) {
    const a = resolveNode(expr.consequent); if (a) add(a);
    const b = resolveNode(expr.alternate); if (b) add(b);
  } else if (t.isLogicalExpression(expr)) {
    const l = resolveNode(expr.left); if (l) add(l);
    const r = resolveNode(expr.right); if (r) add(r);
  } else {
    const r = resolveNode(expr);
    if (r) add(r);
  }

  return out;
}

function scanFile(absPath, relPath, code, config, state) {
  const ast = parseFile(code, absPath);

  const thirdParty = config.thirdParty || {};

  traverse(ast, {
    JSXElement(path) {
      const opening = path.node.openingElement;
      const elemName = getJsxNameName(opening.name);

      // Attributes
      for (const attr of opening.attributes) {
        if (!t.isJSXAttribute(attr)) continue;
        if (attr.name && t.isJSXIdentifier(attr.name) && attr.name.name === 'dangerouslySetInnerHTML') continue; // skip
        const attrName = t.isJSXIdentifier(attr.name) ? attr.name.name : null;
        if (!attrName) continue;

        const allowedByName = config.allowAttrs.includes(attrName);
        const allowedByThirdParty = elemName && thirdParty[elemName] && Array.isArray(thirdParty[elemName]) && thirdParty[elemName].includes(attrName);

        const val = attr.value;
        if (!val) continue; // boolean attrs

        if (t.isStringLiteral(val)) {
          const raw = val.value;
          const ok = (allowedByName || allowedByThirdParty || isLikelyMicrocopy(raw, attrName));
          if (ok && raw && raw.trim() !== '') {
            addOccurrence(state, {
              file: relPath,
              loc: getLoc(val),
              context: 'JSXAttribute',
              element: elemName,
              attribute: attrName,
              text: raw,
              placeholders: [],
              sourceExprs: {},
            });
          }
        } else if (t.isJSXExpressionContainer(val)) {
          const expr = val.expression;
          if (isChildrenReference(expr)) continue; // skip React children
          if (isComponentReference(expr)) continue; // skip component refs
          if (isReactCreateElementCall(expr)) continue; // skip createElement
          let results = collectStringFromExpression(expr, path, code, { skipPlaceholderOnly: false });
          if (!allowedByName && !allowedByThirdParty) {
            results = results.filter((r) => isLikelyMicrocopy(r.text, attrName));
          }
          for (const res of results) {
            if (!res.text || res.text.trim() === '') continue;
            addOccurrence(state, {
              file: relPath,
              loc: getLoc(val),
              context: 'JSXAttribute',
              element: elemName,
              attribute: attrName,
              text: res.text,
              placeholders: res.placeholders,
              sourceExprs: res.sourceExprs,
            });
          }
          // Deep collect nested plain strings in arrays/objects (and identifier bindings)
          let deepStrings = [];
          if (t.isArrayExpression(expr) || t.isObjectExpression(expr)) {
            deepStrings = deepCollectPlainStringsInExpression(expr, path);
          } else if (t.isIdentifier(expr)) {
            const binding = path.scope.getBinding(expr.name);
            if (binding && t.isVariableDeclarator(binding.path.node)) {
              const init = binding.path.node.init;
              if (t.isArrayExpression(init) || t.isObjectExpression(init)) {
                deepStrings = deepCollectPlainStringsInExpression(init, path);
              }
            }
          }
          for (const s of deepStrings) {
            if (!allowedByName && !allowedByThirdParty && !isLikelyMicrocopy(s, attrName)) continue;
            addOccurrence(state, {
              file: relPath,
              loc: getLoc(val),
              context: 'JSXAttribute',
              element: elemName,
              attribute: attrName,
              text: s,
              placeholders: [],
              sourceExprs: {},
            });
          }
        }
      }

      // Children
      const children = path.node.children || [];
      children.forEach((child) => {
        if (t.isJSXText(child)) {
          const norm = collapseJsxText(child.value);
          if (norm) {
            addOccurrence(state, {
              file: relPath,
              loc: getLoc(child),
              context: 'JSXText',
              element: elemName,
              text: norm,
              placeholders: [],
              sourceExprs: {},
            });
          }
        } else if (t.isJSXExpressionContainer(child)) {
          const expr = child.expression;
          if (isChildrenReference(expr)) return; // skip React children
          if (isComponentReference(expr)) return; // skip component refs
          if (isReactCreateElementCall(expr)) return; // skip createElement
          const results = collectStringFromExpression(expr, path, code, { skipPlaceholderOnly: true });
          for (const res of results) {
            if (!res.text || res.text.trim() === '') continue;
            addOccurrence(state, {
              file: relPath,
              loc: getLoc(child),
              context: 'JSXExpression',
              element: elemName,
              text: res.text,
              placeholders: res.placeholders,
              sourceExprs: res.sourceExprs,
            });
          }
        }
      });

      // HTML collapsing candidate detection (opt-in)
      if (config.htmlCollapse && config.htmlCollapse.detect) {
        try {
          const cand = detectHtmlCollapseCandidate(path, code, config);
          if (cand) {
            state.htmlCollapseCandidates.push({ file: relPath, element: elemName, loc: getLoc(path.node), ...cand });
          }
        } catch (e) {
          if (!state.errors) state.errors = [];
          state.errors.push({ file: relPath, error: `htmlCollapse: ${e.message}` });
        }
      }
    },

    CallExpression(path) {
      // Existing findText() calls
      if (t.isIdentifier(path.node.callee) && path.node.callee.name === 'findText') {
        const args = path.node.arguments || [];
        const first = args[0];
        if (!first) return;
        const loc = getLoc(first);
        if (t.isStringLiteral(first)) {
          const val = normalizeStringLiteral(first);
          if (shouldIndexText(val)) {
            path.state.findTextCalls.push({
              file: relPath,
              loc,
              text: val,
              placeholders: [],
              sourceExprs: {},
              ok: true,
            });
            // Add to store
            addOccurrence(path.state, {
              file: relPath,
              loc,
              context: 'findText',
              element: null,
              text: val,
              placeholders: [],
              sourceExprs: {},
            });
          }
        } else if (t.isTemplateLiteral(first)) {
          const res = normalizeTemplateLiteral(first, code);
          if (shouldIndexText(res.text)) {
            path.state.findTextCalls.push({ file: relPath, loc, ...res, ok: true });
            addOccurrence(path.state, {
              file: relPath,
              loc,
              context: 'findText',
              element: null,
              text: res.text,
              placeholders: res.placeholders,
              sourceExprs: res.sourceExprs,
            });
          }
        } else if (t.isBinaryExpression(first) && first.operator === '+') {
          const res = normalizeBinaryExpression(first, code);
          if (shouldIndexText(res.text)) {
            path.state.findTextCalls.push({ file: relPath, loc, ...res, ok: true });
            addOccurrence(path.state, {
              file: relPath,
              loc,
              context: 'findText',
              element: null,
              text: res.text,
              placeholders: res.placeholders,
              sourceExprs: res.sourceExprs,
            });
          }
        } else {
          // Try trivial resolution
          const tries = collectStringFromExpression(first, path, code);
          if (tries && tries.length > 0) {
            // Take first as best-effort
            const res = tries[0];
            if (shouldIndexText(res.text)) {
              path.state.findTextCalls.push({ file: relPath, loc, ...res, ok: true });
              addOccurrence(path.state, {
                file: relPath,
                loc,
                context: 'findText',
                element: null,
                text: res.text,
                placeholders: res.placeholders,
                sourceExprs: res.sourceExprs,
              });
            }
          } else {
            const ref = `EXPR(findText-arg1)`;
            path.state.findTextCalls.push({ file: relPath, loc, text: ref, placeholders: [], sourceExprs: {}, ok: false });
          }
        }
      }
    },
  },
  // No custom scope; pass state correctly so it's available via path.state
  undefined,
  state);
}

function detectHtmlCollapseCandidate(path, source, config) {
  const parent = path.node;
  const children = parent.children || [];

  const whitelist = (config.htmlCollapse && config.htmlCollapse.inlineWhitelist) || [];

  // Determine eligibility: mixed text plus only inline-safe elements
  let hasText = false;
  let hasInline = false;

  for (const ch of children) {
    if (t.isJSXText(ch)) {
      const txt = collapseJsxText(ch.value);
      if (txt) hasText = true;
    } else if (t.isJSXElement(ch)) {
      const name = getJsxNameName(ch.openingElement.name);
      if (!name) return null; // unknown
      // Custom components (capitalized) or member expressions => skip
      if (name[0] && name[0] !== name[0].toLowerCase()) return null;
      const lower = name.toLowerCase();
      if (!whitelist.includes(lower)) return null;
      // Event handlers present? skip
      for (const attr of ch.openingElement.attributes) {
        if (t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && /^on[A-Z]/.test(attr.name.name)) {
          return null;
        }
        if (t.isJSXSpreadAttribute(attr)) return null;
      }
      hasInline = true;
    } else if (t.isJSXExpressionContainer(ch)) {
      // An expression child outside inline element means mixed nodes -> skip for safety
      const exprText = asCode(source, ch.expression);
      if (exprText && exprText.trim()) return null;
    } else {
      return null; // other node kinds
    }
  }

  if (!(hasText && hasInline)) return null;

  // Now build the collapsed HTML template and kwargs
  const parts = [];
  const placeholders = [];
  const kwargs = {};
  const warnings = [];

  function serializeAttributes(opening) {
    const buffs = [];
    for (const attr of opening.attributes) {
      if (!t.isJSXAttribute(attr)) continue;
      if (!t.isJSXIdentifier(attr.name)) continue;
      const name = attr.name.name;
      if (attr.value == null) {
        buffs.push(`${name}`);
        continue;
      }
      if (t.isStringLiteral(attr.value)) {
        const val = attr.value.value.replace(/"/g, '&quot;');
        buffs.push(`${name}="${val}"`);
      } else if (t.isJSXExpressionContainer(attr.value)) {
        const code = asCode(source, attr.value.expression);
        buffs.push(`${name}="\${${code}}"`);
        // Trust warnings for href/src/style etc.
        if (config.htmlCollapse.warnUntrusted && /^(href|src|style|on.*)$/i.test(name)) {
          warnings.push(`Untrusted attribute ${name}: ${code}`);
        }
      }
    }
    return buffs.length ? ' ' + buffs.join(' ') : '';
  }

  function inlineChildToTemplate(el) {
    const name = getJsxNameName(el.openingElement.name);
    const lower = name.toLowerCase();
    const attrs = serializeAttributes(el.openingElement);
    const kids = el.children || [];

    // Self-closing like <br /> or <wbr />
    if (kids.length === 0 && (lower === 'br' || lower === 'wbr')) {
      return `<${lower}${attrs} />`;
    }

    if (kids.length !== 1) return null; // only single child allowed
    const only = kids[0];
    if (t.isJSXText(only)) {
      const txt = collapseJsxText(only.value);
      return `<${lower}${attrs}>${txt}</${lower}>`;
    }
    if (t.isJSXExpressionContainer(only)) {
      const expr = only.expression;
      const ph = getPlaceholderName(expr, placeholders.length, source);
      const exprCode = asCode(source, expr);
      if (!placeholders.includes(ph)) placeholders.push(ph);
      kwargs[ph] = `<${lower}${attrs}>\${${exprCode}}</${lower}>`;
      // Warn on content expression by default
      if (config.htmlCollapse.warnUntrusted) warnings.push(`Untrusted HTML content expression in <${lower}>: ${exprCode}`);
      // Special-case anchor link hygiene
      if (lower === 'a') {
        const hrefAttr = (el.openingElement.attributes || []).find(a => t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === 'href');
        if (hrefAttr && t.isJSXExpressionContainer(hrefAttr.value)) {
          const code = asCode(source, hrefAttr.value.expression);
          warnings.push(`Untrusted href in <a>: ${code}`);
        }
      }
      return `{${ph}}`;
    }
    return null; // nested elements not allowed
  }

  for (const ch of children) {
    if (t.isJSXText(ch)) {
      const txt = collapseJsxText(ch.value);
      if (txt) parts.push(txt);
    } else if (t.isJSXElement(ch)) {
      const seg = inlineChildToTemplate(ch);
      if (!seg) return null; // not eligible
      parts.push(seg);
    } else if (t.isJSXExpressionContainer(ch)) {
      // For standalone expressions in parent flow, we consider this complex -> skip
      const exprText = asCode(source, ch.expression);
      if (exprText && exprText.trim()) return null;
    }
  }

  const template = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!template) return null;

  return {
    template,
    placeholders,
    kwargs,
    warnings,
    inlineWhitelist: whitelist,
  };
}

async function runScan(config) {
  const patterns = config.include;
  const ignore = config.exclude;

  const files = await fg(patterns, {
    cwd: config.root,
    ignore,
    dot: false,
    absolute: true,
  });

  const state = {
    occurrences: [],
    messagesMap: new Map(),
    findTextCalls: [],
    htmlCollapseCandidates: [],
  };

  // Load previous messages for unusedInCode report
  const prevMessagesPath = path.join(config.outDir, 'messages.json');
  let prevMessages = [];
  if (fs.existsSync(prevMessagesPath)) {
    try {
      prevMessages = JSON.parse(fs.readFileSync(prevMessagesPath, 'utf8'));
    } catch (_) {
      prevMessages = [];
    }
  }
  const prevSet = new Set(prevMessages.map((m) => m.text));

  for (const abs of files) {
    const code = fs.readFileSync(abs, 'utf8');
    const rel = getRel(config.root, abs);
    try {
      scanFile(abs, rel, code, config, state);
    } catch (e) {
      // Keep scanning but note in report errors list
      if (!state.errors) state.errors = [];
      state.errors.push({ file: rel, error: e.message });
    }
  }

  // Build messages array
  const messages = Array.from(state.messagesMap.values()).map((m) => ({
    text: m.text,
    placeholders: m.placeholders,
    occurrences: m.occurrences,
  }));

  // Build word store (sorted unique sentences)
  const wordStore = messages.map((m) => m.text).sort((a, b) => a.localeCompare(b));

  // Collisions: same text with different placeholder sets
  const collisions = [];
  for (const m of state.messagesMap.values()) {
    if (m._placeholderSetKeys && m._placeholderSetKeys.size > 1) {
      collisions.push({
        text: m.text,
        placeholderSets: Array.from(m._placeholderSetKeys).map((k) => JSON.parse(k)),
        exampleFiles: m.occurrences.slice(0, 5).map((o) => ({ file: o.file, loc: o.loc })),
      });
    }
  }

  // missingInStore: findText that didn't end up as messages
  const messageTextSet = new Set(messages.map((m) => m.text));
  const missingInStore = state.findTextCalls
    .filter((fc) => !fc.ok || !messageTextSet.has(fc.text))
    .map((fc) => ({ file: fc.file, loc: fc.loc, text: fc.text }));

  // unusedInCode: previous messages not present now
  const unusedInCode = Array.from(prevSet).filter((t) => !messageTextSet.has(t));

  const report = {
    filesScanned: files.length,
    messagesCount: messages.length,
    occurrencesCount: state.occurrences.length,
    collisions,
    missingInStore,
    unusedInCode,
    errors: state.errors || [],
    mode: config.mode,
    htmlCollapseCandidatesCount: (state.htmlCollapseCandidates || []).length,
    wordStoreCount: wordStore.length,
  };

  if (!config.reportOnly) {
    const occPath = path.join(config.outDir, 'occurrences.json');
    const msgPath = path.join(config.outDir, 'messages.json');
    const repPath = path.join(config.outDir, 'report.json');
    const htmlPath = path.join(config.outDir, 'html-collapse.json');
    const wordStorePath = path.join(config.outDir, 'wordStore.json');

    fs.writeFileSync(occPath, JSON.stringify(state.occurrences, null, 2));
    fs.writeFileSync(msgPath, JSON.stringify(messages, null, 2));
    fs.writeFileSync(repPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(wordStorePath, JSON.stringify(wordStore, null, 2));
    if (config.htmlCollapse && config.htmlCollapse.detect) {
      fs.writeFileSync(htmlPath, JSON.stringify(state.htmlCollapseCandidates, null, 2));
    }

    // Write root-level metadata so rewrite can auto-locate outputs later
    try {
      const metaPath = path.join(config.root, 'mc.json');
      let existing = null;
      try {
        if (fs.existsSync(metaPath)) existing = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (_) {
        existing = null;
      }
      const meta = {
        ...(existing || {}),
        version: 1,
        lastScan: {
          root: config.root,
          outDir: config.outDir,
          reportPath: repPath,
          messagesPath: msgPath,
          occurrencesPath: occPath,
          wordStorePath: wordStorePath,
          htmlCollapsePath: (config.htmlCollapse && config.htmlCollapse.detect) ? htmlPath : null,
          include: config.include,
          exclude: config.exclude,
          mode: config.mode,
          scannedAt: new Date().toISOString(),
        },
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    } catch (e) {
      // Non-fatal: continue even if metadata write fails
    }
  }

  return {
    filesScanned: files.length,
    messagesCount: messages.length,
    occurrencesCount: state.occurrences.length,
    report,
  };
}

module.exports = {
  runScan,
};
