const t = require('@babel/types');

function isStringLiteralLike(node) {
  return t.isStringLiteral(node) || t.isTemplateLiteral(node);
}

function asCode(source, node) {
  if (!node || typeof node.start !== 'number' || typeof node.end !== 'number') return '';
  return source.slice(node.start, node.end);
}

function collapseJsxText(raw) {
  if (raw == null) return '';
  // React collapses runs of whitespace in JSXText. We also trim edges.
  return String(raw).replace(/[\t\n\r\f ]+/g, ' ').trim();
}

function normalizeStringLiteral(node) {
  // Keep as-authored, including entities and spaces; just return value
  return node.value;
}

function pickLastPropertyName(member) {
  // For MemberExpression or OptionalMemberExpression, return last property identifier name
  let cur = member;
  while (t.isOptionalMemberExpression(cur) || t.isMemberExpression(cur)) {
    if (!cur.property) break;
    if (t.isIdentifier(cur.property)) return cur.property.name;
    if (t.isStringLiteral(cur.property)) return cur.property.value;
    // Computed non-identifier property
    break;
  }
  return null;
}

function getIdentifierName(node) {
  if (t.isIdentifier(node)) return node.name;
  if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
    const name = pickLastPropertyName(node);
    if (name) return name;
  }
  return null;
}

function getPlaceholderName(expr, index, source) {
  // Naming rules:
  // - Identifier name -> {name}
  // - Member user.firstName -> {firstName}
  // - CallExpression -> use first arg name if possible
  // - Else -> {arg1}, {arg2}, ...
  const ident = getIdentifierName(expr);
  if (ident) return ident;

  if (t.isCallExpression(expr)) {
    if (expr.arguments && expr.arguments.length > 0) {
      const first = expr.arguments[0];
      const argIdent = getIdentifierName(first);
      if (argIdent) return argIdent;
    }
  }

  return `arg${index + 1}`;
}

function normalizeTemplateLiteral(node, source) {
  const placeholders = [];
  const sourceExprs = {};
  let text = '';
  node.quasis.forEach((q, i) => {
    text += q.value.cooked ?? q.value.raw;
    if (i < node.expressions.length) {
      const expr = node.expressions[i];
      const name = getPlaceholderName(expr, i, source);
      if (!placeholders.includes(name)) placeholders.push(name);
      sourceExprs[name] = asCode(source, expr);
      text += `{${name}}`;
    }
  });
  return { text, placeholders, sourceExprs };
}

function normalizeBinaryExpression(node, source) {
  // Flatten "a" + b + `c${d}` into string with placeholders
  const parts = [];
  const placeholders = [];
  const sourceExprs = {};

  function walk(n) {
    if (t.isBinaryExpression(n) && n.operator === '+') {
      walk(n.left);
      walk(n.right);
      return;
    }
    if (t.isStringLiteral(n)) {
      parts.push(n.value);
      return;
    }
    if (t.isTemplateLiteral(n)) {
      const { text, placeholders: ph, sourceExprs: se } = normalizeTemplateLiteral(n, source);
      parts.push(text);
      ph.forEach((p) => {
        if (!placeholders.includes(p)) placeholders.push(p);
        if (se[p]) sourceExprs[p] = se[p];
      });
      return;
    }
    // Any other expression becomes a placeholder
    const name = getPlaceholderName(n, placeholders.length, source);
    if (!placeholders.includes(name)) placeholders.push(name);
    sourceExprs[name] = asCode(source, n);
    parts.push(`{${name}}`);
  }

  walk(node);
  return { text: parts.join(''), placeholders, sourceExprs };
}

module.exports = {
  collapseJsxText,
  normalizeStringLiteral,
  normalizeTemplateLiteral,
  normalizeBinaryExpression,
  getPlaceholderName,
  isStringLiteralLike,
  asCode,
};
