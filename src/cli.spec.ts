import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseArgs, run } from './cli';

describe('parseArgs', () => {
  afterEach(() => {
    process.exitCode = undefined;
  });

  describe('when a valid directory is given', () => {
    it('should parse the directory argument', () => {
      const result = parseArgs(['node', 'bin.js', 'dist/']);
      expect(result).toEqual({
        directory: 'dist/',
        extension: '.js',
        externalDeep: false,
        ignore: [],
        dryRun: false,
      });
    });

    it('should parse the --ext option', () => {
      const result = parseArgs(['node', 'bin.js', 'dist/', '--ext', '.mjs']);
      expect(result?.extension).toBe('.mjs');
    });

    it('should parse the --external-deep flag', () => {
      const result = parseArgs(['node', 'bin.js', 'dist/', '--external-deep']);
      expect(result?.externalDeep).toBe(true);
    });

    it('should parse the --ignore option', () => {
      const result = parseArgs(['node', 'bin.js', 'dist/', '--ignore', '@ncbijs/*']);
      expect(result?.ignore).toEqual(['@ncbijs/*']);
    });

    it('should parse multiple --ignore options', () => {
      const result = parseArgs([
        'node',
        'bin.js',
        'dist/',
        '--ignore',
        '@ncbijs/*',
        '--ignore',
        '@other/*',
      ]);
      expect(result?.ignore).toEqual(['@ncbijs/*', '@other/*']);
    });

    it('should parse the --dry-run flag', () => {
      const result = parseArgs(['node', 'bin.js', 'dist/', '--dry-run']);
      expect(result?.dryRun).toBe(true);
    });

    it('should parse all options together', () => {
      const result = parseArgs([
        'node',
        'bin.js',
        'dist/',
        '--ext',
        '.mjs',
        '--external-deep',
        '--ignore',
        '@ncbijs/*',
        '--dry-run',
      ]);
      expect(result).toEqual({
        directory: 'dist/',
        extension: '.mjs',
        externalDeep: true,
        ignore: ['@ncbijs/*'],
        dryRun: true,
      });
    });

    it('should default --ext to .js when value is missing', () => {
      const result = parseArgs(['node', 'bin.js', 'dist/', '--ext']);
      expect(result?.extension).toBe('.js');
    });
  });

  describe('when no arguments are given', () => {
    it('should return undefined', () => {
      const result = parseArgs(['node', 'bin.js']);
      expect(result).toBeUndefined();
    });

    it('should set exitCode to 1', () => {
      parseArgs(['node', 'bin.js']);
      expect(process.exitCode).toBe(1);
    });
  });

  describe('when help is requested', () => {
    it('should return undefined for --help', () => {
      const result = parseArgs(['node', 'bin.js', '--help']);
      expect(result).toBeUndefined();
    });

    it('should return undefined for -h', () => {
      const result = parseArgs(['node', 'bin.js', '-h']);
      expect(result).toBeUndefined();
    });

    it('should not set exitCode', () => {
      parseArgs(['node', 'bin.js', '--help']);
      expect(process.exitCode).toBeUndefined();
    });
  });

  describe('when the directory is missing', () => {
    it('should return undefined when only flags are given', () => {
      const result = parseArgs(['node', 'bin.js', '--dry-run']);
      expect(result).toBeUndefined();
    });

    it('should set exitCode to 1', () => {
      parseArgs(['node', 'bin.js', '--dry-run']);
      expect(process.exitCode).toBe(1);
    });
  });
});

describe('run', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'aie-cli-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true });
  });

  describe('when a directory is provided', () => {
    it('should process files in the given directory', async () => {
      await writeFile(join(tmpDir, 'index.js'), `import { foo } from './foo';`);
      await run(['node', 'bin.js', tmpDir]);
      const content = await readFile(join(tmpDir, 'index.js'), 'utf8');
      expect(content).toBe(`import { foo } from './foo.js';`);
    });
  });

  describe('when dry run is enabled', () => {
    it('should not modify files', async () => {
      const original = `import { foo } from './foo';`;
      await writeFile(join(tmpDir, 'index.js'), original);
      await run(['node', 'bin.js', tmpDir, '--dry-run']);
      const content = await readFile(join(tmpDir, 'index.js'), 'utf8');
      expect(content).toBe(original);
    });
  });

  describe('when no directory is provided', () => {
    it('should do nothing', async () => {
      await run(['node', 'bin.js']);
    });
  });

  describe('when help is requested', () => {
    it('should do nothing', async () => {
      await run(['node', 'bin.js', '--help']);
    });
  });
});
