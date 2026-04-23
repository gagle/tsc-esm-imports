#!/usr/bin/env node

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SPECIFIER_RE = /((?:from|import\()\s*['"])([^'"]+?)(['"])/g;
const HAS_EXT_RE = /\.(m?[jt]sx?|cjs|cts|json)$/;

function rewrite(source) {
  return source.replace(SPECIFIER_RE, (match, prefix, specifier, suffix) => {
    if (HAS_EXT_RE.test(specifier) || !specifier.startsWith('.')) {
      return match;
    }
    return `${prefix}${specifier}.js${suffix}`;
  });
}

async function walk(dirPath) {
  const entries = await readdir(dirPath);
  const tasks = entries.map(async (entry) => {
    const fullPath = join(dirPath, entry);
    if ((await stat(fullPath)).isDirectory()) {
      return walk(fullPath);
    }
    if (!entry.endsWith('.js') && !entry.endsWith('.d.ts')) {
      return;
    }
    const content = await readFile(fullPath, 'utf8');
    const updated = rewrite(content);
    if (updated !== content) {
      await writeFile(fullPath, updated, 'utf8');
    }
  });
  await Promise.all(tasks);
}

await walk('dist');
