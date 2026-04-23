import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addImportExtensions } from './add-import-extensions';

describe('addImportExtensions', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'aie-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  describe('when processing JavaScript files', () => {
    it('should add .js to relative imports in .js files', async () => {
      await writeFile(join(tmpDir, 'index.js'), `import { foo } from './foo';`);
      await addImportExtensions(tmpDir);
      const content = await readFile(join(tmpDir, 'index.js'), 'utf8');
      expect(content).toBe(`import { foo } from './foo.js';`);
    });

    it('should add extension to .mjs files', async () => {
      await writeFile(join(tmpDir, 'index.mjs'), `import { foo } from './foo';`);
      await addImportExtensions(tmpDir);
      const content = await readFile(join(tmpDir, 'index.mjs'), 'utf8');
      expect(content).toBe(`import { foo } from './foo.js';`);
    });

    it('should add extension to .cjs files', async () => {
      await writeFile(join(tmpDir, 'index.cjs'), `import { foo } from './foo';`);
      await addImportExtensions(tmpDir);
      const content = await readFile(join(tmpDir, 'index.cjs'), 'utf8');
      expect(content).toBe(`import { foo } from './foo.js';`);
    });
  });

  describe('when processing declaration files', () => {
    it('should add .js to relative imports in .d.ts files', async () => {
      await writeFile(
        join(tmpDir, 'index.d.ts'),
        `export type { Config } from './config.interface';`,
      );
      await addImportExtensions(tmpDir);
      const content = await readFile(join(tmpDir, 'index.d.ts'), 'utf8');
      expect(content).toBe(`export type { Config } from './config.interface.js';`);
    });

    it('should add extension to .d.mts files', async () => {
      await writeFile(join(tmpDir, 'index.d.mts'), `export type { Foo } from './foo';`);
      await addImportExtensions(tmpDir);
      const content = await readFile(join(tmpDir, 'index.d.mts'), 'utf8');
      expect(content).toBe(`export type { Foo } from './foo.js';`);
    });

    it('should add extension to .d.cts files', async () => {
      await writeFile(join(tmpDir, 'index.d.cts'), `export type { Foo } from './foo';`);
      await addImportExtensions(tmpDir);
      const content = await readFile(join(tmpDir, 'index.d.cts'), 'utf8');
      expect(content).toBe(`export type { Foo } from './foo.js';`);
    });
  });

  describe('when the file is not processable', () => {
    it('should skip non-processable files', async () => {
      const originalContent = `{"mappings":"AAAA"}`;
      await writeFile(join(tmpDir, 'index.js.map'), originalContent);
      await addImportExtensions(tmpDir);
      const content = await readFile(join(tmpDir, 'index.js.map'), 'utf8');
      expect(content).toBe(originalContent);
    });
  });

  describe('when processing nested directories', () => {
    it('should process files recursively', async () => {
      const nestedDir = join(tmpDir, 'sub');
      await mkdir(nestedDir);
      await writeFile(join(nestedDir, 'nested.js'), `import { x } from './x';`);
      await addImportExtensions(tmpDir);
      const content = await readFile(join(nestedDir, 'nested.js'), 'utf8');
      expect(content).toBe(`import { x } from './x.js';`);
    });
  });

  describe('when counting results', () => {
    it('should return correct stats for changed files', async () => {
      await writeFile(join(tmpDir, 'a.js'), `import { a } from './a';`);
      await writeFile(join(tmpDir, 'b.js'), `import { b } from './b';`);
      const result = await addImportExtensions(tmpDir);
      expect(result).toEqual({ filesScanned: 2, filesChanged: 2 });
    });

    it('should not count unchanged files', async () => {
      await writeFile(join(tmpDir, 'unchanged.js'), `import lodash from 'lodash';`);
      await writeFile(join(tmpDir, 'changed.js'), `import { foo } from './foo';`);
      const result = await addImportExtensions(tmpDir);
      expect(result).toEqual({ filesScanned: 2, filesChanged: 1 });
    });
  });

  describe('when dry run is enabled', () => {
    it('should return stats but not modify files', async () => {
      const originalContent = `import { foo } from './foo';`;
      await writeFile(join(tmpDir, 'index.js'), originalContent);
      const result = await addImportExtensions(tmpDir, { dryRun: true });
      expect(result).toEqual({ filesScanned: 1, filesChanged: 1 });
      const content = await readFile(join(tmpDir, 'index.js'), 'utf8');
      expect(content).toBe(originalContent);
    });
  });

  describe('when the directory is empty', () => {
    it('should return zero stats', async () => {
      const result = await addImportExtensions(tmpDir);
      expect(result).toEqual({ filesScanned: 0, filesChanged: 0 });
    });
  });

  describe('when options are passed through', () => {
    it('should pass options to rewriteSpecifiers', async () => {
      await writeFile(join(tmpDir, 'index.js'), `import { McpServer } from '@mcp/sdk/server';`);
      const resultDefault = await addImportExtensions(tmpDir, { dryRun: true });
      expect(resultDefault.filesChanged).toBe(0);

      const resultDeep = await addImportExtensions(tmpDir, { externalDeep: true, dryRun: true });
      expect(resultDeep.filesChanged).toBe(1);
    });

    it('should use a custom extension', async () => {
      await writeFile(join(tmpDir, 'index.mjs'), `import { foo } from './foo';`);
      await addImportExtensions(tmpDir, { extension: '.mjs' });
      const content = await readFile(join(tmpDir, 'index.mjs'), 'utf8');
      expect(content).toBe(`import { foo } from './foo.mjs';`);
    });
  });
});
