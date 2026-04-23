import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  AddImportExtensionsOptions,
  AddImportExtensionsResult,
} from './interfaces/options.interface';
import { rewriteSpecifiers } from './rewrite-specifiers';

const PROCESSABLE_RE = /\.(js|mjs|cjs|d\.ts|d\.mts|d\.cts)$/;

async function walkDirectory(
  dirPath: string,
  options: AddImportExtensionsOptions,
  stats: { filesScanned: number; filesChanged: number },
): Promise<void> {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const tasks = entries.map(async (entry) => {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      return walkDirectory(fullPath, options, stats);
    }

    if (!PROCESSABLE_RE.test(entry.name)) {
      return;
    }

    stats.filesScanned++;
    const content = await readFile(fullPath, 'utf8');
    const updated = rewriteSpecifiers(content, options);

    if (updated !== content) {
      stats.filesChanged++;
      if (!options.dryRun) {
        await writeFile(fullPath, updated, 'utf8');
      }
    }
  });

  await Promise.all(tasks);
}

export async function addImportExtensions(
  directory: string,
  options: AddImportExtensionsOptions = {},
): Promise<AddImportExtensionsResult> {
  const stats = { filesScanned: 0, filesChanged: 0 };
  await walkDirectory(directory, options, stats);
  return stats;
}
