#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const { loadConfig } = require('../src/config');
const { runScan } = require('../src/scanner');

async function main() {
  const program = new Command();
  program
    .name('mc-scan')
    .description('Scan React/JSX/TSX code for UI text and produce messages + report')
    .option('-r, --root <dir>', 'root directory to scan', process.cwd())
    .option('-i, --include <glob...>', 'include glob(s)', undefined)
    .option('-x, --exclude <glob...>', 'exclude glob(s)', undefined)
    .option('-m, --mode <mode>', 'replacement mode: loose | strict', 'loose')
    .option('-o, --out-dir <dir>', 'output directory for results', 'mc-out')
    .option('--allow-attrs <names>', 'comma-separated attribute allowlist', undefined)
    .option('--third-party-config <path>', 'path to JSON config for third-party component text props', undefined)
    .option('--html-collapse-detect', 'enable HTML collapsing candidate detection (dangerouslySetInnerHTML)', false)
    .option('--html-inline-whitelist <tags>', 'comma-separated inline tag whitelist (e.g., span,strong,a)', undefined)
    .option('--html-warn-untrusted <bool>', 'warn on untrusted expressions in HTML fragments (true/false)', undefined)
    .option('--report-only', 'skip writing stores, only produce report to stdout', false)
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
    outDir: path.resolve(root, opts.outDir),
    allowAttrs,
    thirdPartyConfigPath: opts.thirdPartyConfig
      ? path.resolve(root, opts.thirdPartyConfig)
      : undefined,
    htmlCollapseDetect: !!opts.htmlCollapseDetect,
    htmlCollapseInlineWhitelist: opts.htmlInlineWhitelist
      ? opts.htmlInlineWhitelist.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined,
    htmlCollapseWarnUntrusted: typeof opts.htmlWarnUntrusted === 'string'
      ? opts.htmlWarnUntrusted.toLowerCase() !== 'false'
      : undefined,
    reportOnly: !!opts.reportOnly,
  };

  const config = await loadConfig(cliConfig);

  const result = await runScan(config);

  if (config.reportOnly) {
    // Print summary to stdout
    // Keep concise but informative
    const { report } = result;
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  } else {
    process.stdout.write(`Scan complete.\n`);
    process.stdout.write(`Files scanned: ${result.filesScanned}\n`);
    process.stdout.write(`Messages: ${result.messagesCount}\n`);
    process.stdout.write(`Occurrences: ${result.occurrencesCount}\n`);
    if (result.report && typeof result.report.htmlCollapseCandidatesCount === 'number') {
      process.stdout.write(`HTML collapse candidates: ${result.report.htmlCollapseCandidatesCount}\n`);
    }
    process.stdout.write(`Report written to: ${path.join(config.outDir, 'report.json')}\n`);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
