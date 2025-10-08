#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FIXTURES_DIR = path.join(ROOT, 'tests/fixtures');
const WORKSPACE_DIR = path.join(ROOT, 'tests/workspace');
const OUTPUT_DIR = path.join(ROOT, 'tests/output');

function rimraf(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.lstatSync(p);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(p)) {
      rimraf(path.join(p, entry));
    }
    fs.rmdirSync(p);
  } else {
    fs.unlinkSync(p);
  }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const st = fs.lstatSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  // Clean workspace and output
  rimraf(WORKSPACE_DIR);
  rimraf(OUTPUT_DIR);
  ensureDir(WORKSPACE_DIR);
  ensureDir(OUTPUT_DIR);

  // Copy each fixture scenario into workspace
  if (!fs.existsSync(FIXTURES_DIR)) {
    console.error(`No fixtures found at ${FIXTURES_DIR}`);
    process.exit(1);
  }
  const scenarios = fs.readdirSync(FIXTURES_DIR).filter((n) => fs.lstatSync(path.join(FIXTURES_DIR, n)).isDirectory());
  for (const sc of scenarios) {
    const src = path.join(FIXTURES_DIR, sc);
    const dest = path.join(WORKSPACE_DIR, sc);
    copyDir(src, dest);
  }
  console.log(`Prepared workspace with ${scenarios.length} scenario(s).`);
}

if (require.main === module) {
  main();
}
