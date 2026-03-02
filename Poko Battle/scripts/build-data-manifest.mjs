import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {normalizeSourceText} from '../src/brain/dataMerge.js';

const root = process.cwd();
const configPath = path.join(root, 'config', 'data-sources.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function hashText(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function readFileSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function buildEntry(relativeFile) {
  const officialPath = path.resolve(root, config.officialDataDir, relativeFile);
  const customPath = path.resolve(root, config.customDataDir, relativeFile);

  const officialRaw = readFileSafe(officialPath);
  const customRaw = readFileSafe(customPath);

  const official = officialRaw ? normalizeSourceText(officialRaw) : null;
  const custom = customRaw ? normalizeSourceText(customRaw) : null;

  const status = !official
    ? 'missing-official'
    : !custom
      ? 'official-only'
      : official === custom
        ? 'in-sync'
        : 'custom-overrides-official';

  return {
    file: relativeFile,
    status,
    officialHash: official ? hashText(official) : null,
    customHash: custom ? hashText(custom) : null,
    officialPath,
    customPath,
  };
}

const generatedAt = new Date().toISOString();
const files = config.trackedFiles.map(buildEntry);

const manifest = {
  generatedAt,
  officialDataDir: config.officialDataDir,
  customDataDir: config.customDataDir,
  summary: {
    tracked: files.length,
    inSync: files.filter((f) => f.status === 'in-sync').length,
    overrides: files.filter((f) => f.status === 'custom-overrides-official').length,
    officialOnly: files.filter((f) => f.status === 'official-only').length,
    missingOfficial: files.filter((f) => f.status === 'missing-official').length,
  },
  files,
};

const outDir = path.join(root, 'generated');
fs.mkdirSync(outDir, {recursive: true});
const outPath = path.join(outDir, 'data-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

console.log(`Wrote ${outPath}`);
console.log(JSON.stringify(manifest.summary, null, 2));
