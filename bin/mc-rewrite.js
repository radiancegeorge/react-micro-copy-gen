#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const { loadConfig } = require('../src/config');
const { runRewrite } = require('../src/rewrite');

async function main() {
  const program = new Command();
  program
    .name('mc-rewrite')
    .description('Rewrite JSX to route UI text through findText(...) at render sites')
    .option('-r, --root <dir>', 'root directory to rewrite', process.cwd())
    .option('-i, --include <glob...>', 'include glob(s)', undefined)
    .option('-x, --exclude <glob...>', 'exclude glob(s)', undefined)
    .option('-m, --mode <mode>', 'rewrite mode: loose | strict', 'loose')
    .option('--allow-attrs <names>', 'comma-separated attribute allowlist', undefined)
    .option('--third-party-config <path>', 'path to JSON config for third-party component text props', undefined)
    .option('--no-format', 'disable Prettier formatting of rewritten files')
    .option('--dry', 'do not write files, just report', false)
    .parse(process.argv);

  const opts = program.opts();
  const root = path.resolve(opts.root);
  const allowAttrs = opts.allowAttrs
    ? opts.allowAttrs.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  const cliConfig = {
    root,
    include: opts.include,
    exclude: opts.exclude,
    mode: opts.mode,
    allowAttrs,
    thirdPartyConfigPath: opts.thirdPartyConfig
      ? path.resolve(root, opts.thirdPartyConfig)
      : undefined,
    // rewrite-specific
    format: opts.format !== false,
    dryRun: !!opts.dry,
  };

  const config = await loadConfig(cliConfig);
  const result = await runRewrite(config);

  const summary = {
    filesProcessed: result.filesProcessed,
    filesChanged: result.filesChanged,
    nodesRewritten: result.nodesRewritten,
    mode: config.mode,
    dryRun: !!config.dryRun,
  };

  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
