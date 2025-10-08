#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../../src/config');
const { runScan } = require('../../src/scanner');

const ROOT = path.resolve(__dirname, '../..');
const WORKSPACE_DIR = path.join(ROOT, 'tests/workspace');
const OUTPUT_DIR = path.join(ROOT, 'tests/output');
const THIRD_PARTY_CFG = path.join(ROOT, 'tests/config/third-party.json');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function scanScenario(scenario) {
  const scenarioRoot = path.join(WORKSPACE_DIR, scenario);
  const outDir = path.join(OUTPUT_DIR, scenario);
  ensureDir(outDir);

  const config = await loadConfig({
    root: scenarioRoot,
    mode: 'loose',
    outDir,
    thirdPartyConfigPath: THIRD_PARTY_CFG,
    htmlCollapseDetect: true,
  });

  const result = await runScan(config);
  return result;
}

async function main() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.error('Workspace not found. Run fixtures:prepare first.');
    process.exit(1);
  }

  const scenarios = fs.readdirSync(WORKSPACE_DIR).filter((n) => fs.lstatSync(path.join(WORKSPACE_DIR, n)).isDirectory());
  if (scenarios.length === 0) {
    console.error('No scenarios found in workspace.');
    process.exit(1);
  }

  let totalFiles = 0;
  let totalMessages = 0;
  let totalOccurrences = 0;

  for (const sc of scenarios) {
    const res = await scanScenario(sc);
    totalFiles += res.filesScanned;
    totalMessages += res.messagesCount;
    totalOccurrences += res.occurrencesCount;
    console.log(`[${sc}] files=${res.filesScanned} messages=${res.messagesCount} occurrences=${res.occurrencesCount}`);
  }

  console.log(`All scenarios complete.`);
  console.log(`Total files: ${totalFiles}`);
  console.log(`Total messages: ${totalMessages}`);
  console.log(`Total occurrences: ${totalOccurrences}`);
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  });
}
