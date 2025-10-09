#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');

async function main() {
  const program = new Command();
  program
    .name('mc-init')
    .description('Initialize a root-level mc.json with editable settings for extras')
    .option('-r, --root <dir>', 'project root to write mc.json', process.cwd())
    .option('-f, --force', 'overwrite existing mc.json', false)
    .parse(process.argv);

  const opts = program.opts();
  const root = path.resolve(opts.root);
  const metaPath = path.join(root, 'mc.json');

  if (fs.existsSync(metaPath) && !opts.force) {
    process.stderr.write(`mc.json already exists at ${metaPath}. Use --force to overwrite.\n`);
    process.exit(2);
  }

  const skeleton = {
    version: 1,
    settings: {
      allowAttrsExtra: [],
      thirdPartyExtra: {}
    }
  };

  fs.writeFileSync(metaPath, JSON.stringify(skeleton, null, 2));
  process.stdout.write(`Initialized mc.json at ${metaPath}.\n`);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
