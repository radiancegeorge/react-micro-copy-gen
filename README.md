# auto-micro-copy-gen

Scan React JSX/TSX code for UI text, normalize placeholders, and generate a deduped messages store and report. Defaults match the confirmed rules:

- **Scope**: JSX children, allowed JSX attributes, expressions that resolve to strings, local variables/object literals that flow into JSX, simple local functions returning strings, existing `findText()` calls.
- **Skips**: `node_modules`, build outputs, tests/stories/mocks, `dangerouslySetInnerHTML`, non-UI strings, nested rich nodes as single sentence.
- **Mode**: Loose by default. Strict available via `--mode strict`.
- **Dedupe**: Exact text match. Case-sensitive. Punctuation-sensitive.

### HTML collapsing mode (opt-in)

Detects places where a parent element has mixed text and inline-only children, and proposes collapsing inner content to a single `dangerouslySetInnerHTML` template using `findText(...)`. Detection only; no codemod is applied automatically.

Enable detection via CLI:

```bash
node ./bin/mc-scan.js --root /path --html-collapse-detect
```

Or config:

```json
{
  "htmlCollapse": {
    "detect": true,
    "inlineWhitelist": ["span","strong","em","b","i","u","small","sup","sub","code","kbd","samp","mark","abbr","time","br","wbr","a"],
    "warnUntrusted": true
  }
}
```

Outputs are written to `html-collapse.json` with entries:

```json
[
  {
    "file": "src/Heading.jsx",
    "element": "h1",
    "loc": { "start": {"line": 1, "column": 0}, "end": {"line": 5, "column": 4} },
    "template": "Obi is a boy {gender}",
    "placeholders": ["gender"],
    "kwargs": { "gender": "<span>${child?.gender}</span>" },
    "warnings": ["Untrusted HTML content expression in <span>: child?.gender"],
    "inlineWhitelist": ["span", "strong", "em", "b", "i", "u", "small", "sup", "sub", "code", "kbd", "samp", "mark", "abbr", "time", "br", "wbr", "a"]
  }
]
```

Rules:

- Parent has mixed text plus only inline-safe children (whitelist above).
- Inline child may contain a single expression or static text. Expressions become `{placeholder}` in the template and the full HTML fragment goes into `kwargs[placeholder]`.
- Attributes on inline children are preserved inside the HTML fragment; expression-valued attributes produce `name="${code}"` in the fragment.
- Never collapse when a child is a custom component, when event handlers are present, when spreads are present, or when block-level elements appear.
- Not applied to attributes; only element inner content is considered.

Security and correctness notes:

- XSS risk: any runtime value interpolated into HTML must be escaped or guaranteed safe. Detected entries include a `warnings` array when `warnUntrusted` is enabled (default true).
- Links: for `<a href={url}>{label}</a>`, ensure `url` is sanitized and `label` escaped or trusted; a warning is emitted when `href` is an expression.
- React diffing: collapsed HTML is opaque to reconciliation; use only when acceptable.
- `{br}` is not special; if you want a break token, author `{br}` and pass `kwargs.br` as `"<br/>"` or `"\n"`. Inline `<br/>` is kept as literal in the template.

## Install

```bash
npm install
chmod +x bin/mc-scan.js
```

## Usage

- **Basic scan (Loose mode by default)**

```bash
node ./bin/mc-scan.js --root /path/to/your/react/project
```

- **Strict mode**

```bash
node ./bin/mc-scan.js --root /path/to/your/react/project --mode strict
```

- **Custom include/exclude globs**

```bash
node ./bin/mc-scan.js \
  --root /path/to/project \
  --include "src/**/*.{tsx,jsx}" \
  --exclude "**/*.stories.*" "**/__tests__/**"
```

- **Custom attribute allowlist and third-party component props**

```bash
node ./bin/mc-scan.js \
  --root /path/to/project \
  --allow-attrs "alt,title,placeholder,aria-label,label,helperText" \
  --third-party-config config/mc.third-party.json
```

- **Report-only (no files written)**

```bash
node ./bin/mc-scan.js --root /path/to/project --report-only
```

Outputs are written to `mc-out/` by default:

- `messages.json`: deduped messages `{ text, placeholders, occurrences[] }`.
- `occurrences.json`: raw sightings with file, loc, element/attribute, and source expressions.
- `report.json`: summary with `collisions`, `missingInStore`, `unusedInCode`, and `errors`.

## Configuration

The CLI auto-loads `.mc.config.json` or `mc.config.json` at project root when present. CLI flags override file config.

Example config:

```json
{
  "mode": "loose",
  "allowAttrs": [
    "alt", "title", "placeholder", "aria-label", "aria-valuetext", "aria-description",
    "label", "helperText", "tooltip", "error", "description", "headline", "subtitle"
  ],
  "include": ["**/*.{js,jsx,ts,tsx}"],
  "exclude": [
    "**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**", "**/out/**",
    "**/coverage/**", "**/*.test.*", "**/*.spec.*", "**/*.stories.*",
    "**/__tests__/**", "**/__mocks__/**", "**/storybook/**"
  ],
  "thirdParty": {
    "Empty": ["title", "description"],
    "Tooltip": ["title"],
    "VisuallyHidden": ["children"]
  }
}
```

## Normalization rules (summary)

- **Placeholders**: `${expr}` and `+` concatenations become `{placeholder}`.
  - Identifier → `{name}`.
  - Member `user.firstName` / `user?.firstName` → `{firstName}`.
  - Deep chains → last segment, e.g. `{firstName}`.
  - Other expressions → `{arg1}`, `{arg2}` (with `sourceExprs` stored for review).
- **Whitespace**: JSXText collapses internal whitespace similar to React. Intentional spacing via `{ ' ' }` is ignored as microcopy.
- **Newlines**: Preserved as `\n` in stored text.
- **Literal braces**: Kept as-authored; no escaping.
- **Entities & nbsp**: Kept as-authored.

## Existing `findText()` verification

- If the first argument is a literal/template/`+` concatenation, it is normalized and added to the store.
- Non-literal args are best-effort resolved; if not trivial, recorded as `EXPR(findText-arg1)` in `missingInStore`.

## Report fields

- **collisions**: same normalized sentence used with different placeholder sets.
- **missingInStore**: `findText()` sentences not present in `messages.json`.
- **unusedInCode**: sentences in previous run but not found now.
- **errors**: parse/traverse failures per-file.

## Notes

- Attributes that accept nodes are handled via nested JSX traversal.
- `dangerouslySetInnerHTML` is skipped entirely.
- Cross-file resolution is not performed; the scanner prefers safe local analysis. Loose mode reliably wraps at replacement time (codemod planned).

## Roadmap

- Codemod replacement (Loose/Strict) with idempotence.
- Local function analysis with simple branching and param-based inlining.
- File hash cache to skip unchanged files.
- CI guardrail with baseline store diff.
