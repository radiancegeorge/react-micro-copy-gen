const fs = require('fs');
const path = require('path');

const DEFAULT_ALLOW_ATTRS = [
  'alt',
  'title',
  'placeholder',
  'aria-label',
  'aria-valuetext',
  'aria-description',
  'label',
  'helperText',
  'tooltip',
  'error',
  'description',
  'headline',
  'subtitle',
];

const DEFAULT_INCLUDE = ['**/*.{js,jsx,ts,tsx}'];
const DEFAULT_EXCLUDE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/out/**',
  '**/coverage/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.stories.*',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/storybook/**',
];

const DEFAULT_HTML_INLINE_WHITELIST = [
  'span', 'strong', 'em', 'b', 'i', 'u', 'small', 'sup', 'sub',
  'code', 'kbd', 'samp', 'mark', 'abbr', 'time', 'br', 'wbr', 'a'
];

const DEFAULT_TRANSLATION_HOOK_SOURCE = 'l-min-components/src/components';
const DEFAULT_TRANSLATION_HOOK_NAME = 'useTranslation';
const DEFAULT_WORD_STORE_IMPORT_SOURCE = './wordStore';
const DEFAULT_WORD_STORE_IDENTIFIER = 'wordStore';

function readJsonIfExists(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    // Surface a friendly message including the file path
    throw new Error(`Failed to parse JSON config at ${filePath}: ${e.message}`);
  }
  return null;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function loadConfig(cliConfig) {
  const root = cliConfig.root || process.cwd();

  const fileCandidates = [
    path.join(root, '.mc.config.json'),
    path.join(root, 'mc.config.json'),
  ];

  let fileConfig = null;
  for (const candidate of fileCandidates) {
    const cfg = readJsonIfExists(candidate);
    if (cfg) {
      fileConfig = cfg;
      break;
    }
  }

  // Load root-level metadata from previous scans (mc.json)
  const metaPath = path.join(root, 'mc.json');
  const meta = readJsonIfExists(metaPath);

  // Optional third-party props mapping in a separate file
  let thirdParty = {};
  const thirdPartyFromConfig = fileConfig && fileConfig.thirdParty ? fileConfig.thirdParty : {};
  if (cliConfig.thirdPartyConfigPath) {
    const tpp = readJsonIfExists(cliConfig.thirdPartyConfigPath);
    if (tpp) thirdParty = tpp;
  } else {
    thirdParty = thirdPartyFromConfig;
  }
  // merge thirdParty extras from mc.json
  if (meta && meta.settings && meta.settings.thirdPartyExtra && typeof meta.settings.thirdPartyExtra === 'object') {
    const extra = meta.settings.thirdPartyExtra;
    for (const comp of Object.keys(extra)) {
      const list = Array.isArray(extra[comp]) ? extra[comp] : [];
      if (!thirdParty[comp]) thirdParty[comp] = [];
      const set = new Set(thirdParty[comp]);
      list.forEach((n) => set.add(n));
      thirdParty[comp] = Array.from(set);
    }
  }

  const mode = (cliConfig.mode || (fileConfig && fileConfig.mode) || 'loose').toLowerCase();
  if (!['loose', 'strict'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Use 'loose' or 'strict'.`);
  }

  let allowAttrs = cliConfig.allowAttrs || (fileConfig && fileConfig.allowAttrs) || DEFAULT_ALLOW_ATTRS;
  // augment allowAttrs with extras from mc.json
  if (meta && meta.settings && Array.isArray(meta.settings.allowAttrsExtra)) {
    const set = new Set(allowAttrs);
    meta.settings.allowAttrsExtra.forEach((n) => set.add(n));
    allowAttrs = Array.from(set);
  }
  const include = cliConfig.include || (fileConfig && fileConfig.include) || DEFAULT_INCLUDE;
  const exclude = cliConfig.exclude || (fileConfig && fileConfig.exclude) || DEFAULT_EXCLUDE;
  let outDir = cliConfig.outDir
    || (fileConfig && fileConfig.outDir)
    || (meta && meta.lastScan && meta.lastScan.outDir)
    || path.join(root, 'mc-out');
  if (!path.isAbsolute(outDir)) outDir = path.resolve(root, outDir);

  const htmlDetect = typeof cliConfig.htmlCollapseDetect === 'boolean'
    ? cliConfig.htmlCollapseDetect
    : (fileConfig && fileConfig.htmlCollapse && typeof fileConfig.htmlCollapse.detect === 'boolean'
      ? fileConfig.htmlCollapse.detect
      : false);

  const htmlInlineWhitelist = (cliConfig.htmlCollapseInlineWhitelist && Array.isArray(cliConfig.htmlCollapseInlineWhitelist))
    ? cliConfig.htmlCollapseInlineWhitelist
    : (fileConfig && fileConfig.htmlCollapse && fileConfig.htmlCollapse.inlineWhitelist)
      || DEFAULT_HTML_INLINE_WHITELIST;

  const htmlWarnUntrusted = typeof cliConfig.htmlCollapseWarnUntrusted === 'boolean'
    ? cliConfig.htmlCollapseWarnUntrusted
    : (fileConfig && fileConfig.htmlCollapse && typeof fileConfig.htmlCollapse.warnUntrusted === 'boolean'
      ? fileConfig.htmlCollapse.warnUntrusted
      : true);

  const htmlApply = typeof cliConfig.htmlCollapseApply === 'boolean'
    ? cliConfig.htmlCollapseApply
    : (fileConfig && fileConfig.htmlCollapse && typeof fileConfig.htmlCollapse.apply === 'boolean'
      ? fileConfig.htmlCollapse.apply
      : false);

  const translationHookSource = cliConfig.translationHookSource
    || (fileConfig && fileConfig.translation && fileConfig.translation.hookSource)
    || DEFAULT_TRANSLATION_HOOK_SOURCE;
  const translationHookName = cliConfig.translationHookName
    || (fileConfig && fileConfig.translation && fileConfig.translation.hookName)
    || DEFAULT_TRANSLATION_HOOK_NAME;
  const translationHookIsDefault = typeof cliConfig.translationHookDefault === 'boolean'
    ? !!cliConfig.translationHookDefault
    : (fileConfig && fileConfig.translation && typeof fileConfig.translation.hookIsDefault === 'boolean'
      ? !!fileConfig.translation.hookIsDefault
      : (fileConfig && fileConfig.translation && typeof fileConfig.translation.hookDefault === 'boolean'
        ? !!fileConfig.translation.hookDefault
        : false));
  const wordStoreImportSource = cliConfig.wordStoreImportSource
    || (fileConfig && fileConfig.translation && fileConfig.translation.wordStoreImportSource)
    || (meta && meta.lastScan && meta.lastScan.wordStorePath)
    || DEFAULT_WORD_STORE_IMPORT_SOURCE;
  const wordStoreIdentifier = cliConfig.wordStoreIdentifier
    || (fileConfig && fileConfig.translation && fileConfig.translation.wordStoreIdentifier)
    || DEFAULT_WORD_STORE_IDENTIFIER;
  const wordStoreExplicit = typeof cliConfig.wordStoreImportSource !== 'undefined';

  const config = {
    root,
    mode,
    include,
    exclude,
    allowAttrs,
    thirdParty, // { [ComponentName]: [prop, prop2] }
    outDir,
    reportOnly: !!cliConfig.reportOnly,
    htmlCollapse: {
      detect: htmlDetect,
      // Optional future switch for codemod application (file-based only for now)
      enabled: fileConfig && fileConfig.htmlCollapse && typeof fileConfig.htmlCollapse.enabled === 'boolean'
        ? fileConfig.htmlCollapse.enabled
        : false,
      inlineWhitelist: htmlInlineWhitelist,
      warnUntrusted: htmlWarnUntrusted,
      apply: htmlApply,
    },
    // rewrite-specific passthroughs
    format: typeof cliConfig.format === 'boolean' ? cliConfig.format : true,
    dryRun: !!cliConfig.dryRun,
    findTextSetup: {
      hookSource: translationHookSource,
      hookName: translationHookName,
      hookIsDefault: translationHookIsDefault,
      wordStoreImportSource,
      wordStoreIdentifier,
    },
    wordStoreExplicit,
  };

  ensureDir(outDir);
  return config;
}
module.exports = {
  DEFAULT_ALLOW_ATTRS,
  DEFAULT_INCLUDE,
  DEFAULT_EXCLUDE,
  DEFAULT_HTML_INLINE_WHITELIST,
  loadConfig,
};
