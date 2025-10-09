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

Resolution order for settings:

1. CLI flags
2. File config (`.mc.config.json` or `mc.config.json` at project root)
3. Previous scan metadata (`<root>/mc.json`)
4. Built-in defaults

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

## Install and local linking

```bash
# in this repo
npm install
npm link

# optional: in a target project to add as a dependency (symlink)
cd /path/to/your/project
npm link auto-micro-copy-gen
```

Verify the CLIs are on PATH:

```bash
which mc-scan && which mc-rewrite
mc-scan --help
mc-rewrite --help
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

Additionally, when not in `--report-only` mode, a root-level metadata file is written:

- `<root>/mc.json`: records the last scan's `outDir`, `wordStorePath`, `reportPath`, `include`, `exclude`, and `mode`.

### Rewrite CLI

Rewrite JSX to route UI text through `findText(...)`, adding imports and top-level hook initialization where needed and safe.

Basic usage (auto-discovers prior scan output or generates it if missing):

```bash
mc-rewrite --root /path/to/project
```

Dry-run (no file writes):

```bash
mc-rewrite --root /path/to/project --dry
```

Custom hook and store identifiers (optional):

```bash
mc-rewrite \
  --root /path/to/project \
  --translation-hook-source l-min-components/src/components \
  --translation-hook-name useTranslation \
  --word-store-import-source ./i18n/mc/wordStore.json \
  --word-store-identifier wordStore
```

Notes:

- If you previously ran `mc-scan` with a custom `--out-dir`, rewrite reads `<root>/mc.json` to locate `wordStore.json` automatically.
- If no prior scan is detected and no explicit `--word-store-import-source` is provided, rewrite runs a quick scan to generate `<root>/mc-out/wordStore.json` and then proceeds.
- Hook placement follows React rules: initialization is hoisted to component/hook hosts (top level), not inside loops or nested functions.

### Linking and unlinking

- Global link (done once in this repo):
  - `npm link`
- Link into a target project (optional, if you want it as a dependency):
  - `npm link auto-micro-copy-gen`
- Unlink from a target project:
  - `npm unlink auto-micro-copy-gen`
- Remove the global link:
  - `npm unlink -g auto-micro-copy-gen`

You can also install from a local path or tarball instead of linking:

```bash
npm i /absolute/path/to/auto-micro-copy-gen
# or
npm pack   # produces auto-micro-copy-gen-<version>.tgz
npm i ./auto-micro-copy-gen-<version>.tgz
```

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

- HTML collapsing codemod (opt-in) with trust controls.
- Local function analysis: deeper branches and inter-file basics.
- File hash cache to skip unchanged files.
- CI guardrail with baseline store diff.
