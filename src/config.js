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

  // Optional third-party props mapping in a separate file
  let thirdParty = {};
  const thirdPartyFromConfig = fileConfig && fileConfig.thirdParty ? fileConfig.thirdParty : {};
  if (cliConfig.thirdPartyConfigPath) {
    const tpp = readJsonIfExists(cliConfig.thirdPartyConfigPath);
    if (tpp) thirdParty = tpp;
  } else {
    thirdParty = thirdPartyFromConfig;
  }

  const mode = (cliConfig.mode || (fileConfig && fileConfig.mode) || 'loose').toLowerCase();
  if (!['loose', 'strict'].includes(mode)) {
    throw new Error(`Invalid mode: ${mode}. Use 'loose' or 'strict'.`);
  }

  const allowAttrs = cliConfig.allowAttrs || (fileConfig && fileConfig.allowAttrs) || DEFAULT_ALLOW_ATTRS;
  const include = cliConfig.include || (fileConfig && fileConfig.include) || DEFAULT_INCLUDE;
  const exclude = cliConfig.exclude || (fileConfig && fileConfig.exclude) || DEFAULT_EXCLUDE;
  const outDir = cliConfig.outDir || path.join(root, 'mc-out');

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
  const wordStoreImportSource = cliConfig.wordStoreImportSource
    || (fileConfig && fileConfig.translation && fileConfig.translation.wordStoreImportSource)
    || DEFAULT_WORD_STORE_IMPORT_SOURCE;
  const wordStoreIdentifier = cliConfig.wordStoreIdentifier
    || (fileConfig && fileConfig.translation && fileConfig.translation.wordStoreIdentifier)
    || DEFAULT_WORD_STORE_IDENTIFIER;

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
      wordStoreImportSource,
      wordStoreIdentifier,
    },
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
