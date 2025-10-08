#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../../src/config');
const { runRewrite } = require('../../src/rewrite');
const { runScan } = require('../../src/scanner');

const ROOT = path.resolve(__dirname, '../..');
const WORKSPACE_DIR = path.join(ROOT, 'tests/workspace');
const OUTPUT_DIR = path.join(ROOT, 'tests/output-rewrite');
const THIRD_PARTY_CFG = path.join(ROOT, 'tests/config/third-party.json');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function main() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.error('Workspace not found. Run fixtures:prepare first.');
    process.exit(1);
  }

  ensureDir(OUTPUT_DIR);

  // Rewrite across the entire workspace (strict for demonstration)
  const rewriteConfig = await loadConfig({
    root: WORKSPACE_DIR,
    mode: 'strict',
    thirdPartyConfigPath: THIRD_PARTY_CFG,
    dryRun: false,
  });
  const rewriteRes = await runRewrite(rewriteConfig);
  console.log(JSON.stringify(rewriteRes, null, 2));

  // Rescan to verify and produce a separate output
  const scanConfig = await loadConfig({
    root: WORKSPACE_DIR,
    mode: 'loose', // scanning mode independent of rewrite mode
    outDir: OUTPUT_DIR,
    thirdPartyConfigPath: THIRD_PARTY_CFG,
    htmlCollapseDetect: true,
  });
  const scanRes = await runScan(scanConfig);
  console.log(JSON.stringify({
    filesScanned: scanRes.filesScanned,
    messagesCount: scanRes.messagesCount,
    occurrencesCount: scanRes.occurrencesCount,
    reportPath: path.join(OUTPUT_DIR, 'report.json')
  }, null, 2));
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  });
}
