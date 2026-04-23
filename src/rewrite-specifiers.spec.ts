import { rewriteSpecifiers } from './rewrite-specifiers';

describe('rewriteSpecifiers', () => {
  describe('when the specifier is a relative import', () => {
    it('should add .js to an extensionless relative import', () => {
      const source = `import { foo } from './foo';`;
      expect(rewriteSpecifiers(source)).toBe(`import { foo } from './foo.js';`);
    });

    it('should add .js to a parent directory import', () => {
      const source = `import { bar } from '../utils/bar';`;
      expect(rewriteSpecifiers(source)).toBe(`import { bar } from '../utils/bar.js';`);
    });

    it('should add .js to a deeply nested relative import', () => {
      const source = `import { x } from '../../interfaces/config.interface';`;
      expect(rewriteSpecifiers(source)).toBe(
        `import { x } from '../../interfaces/config.interface.js';`,
      );
    });

    it('should skip a relative import with .js extension', () => {
      const source = `import { foo } from './foo.js';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .mjs extension', () => {
      const source = `import { foo } from './foo.mjs';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .cjs extension', () => {
      const source = `import { foo } from './foo.cjs';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .json extension', () => {
      const source = `import data from './data.json';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .ts extension', () => {
      const source = `import { foo } from './foo.ts';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .tsx extension', () => {
      const source = `import { App } from './App.tsx';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .jsx extension', () => {
      const source = `import { App } from './App.jsx';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .cts extension', () => {
      const source = `import { foo } from './foo.cts';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a relative import with .mts extension', () => {
      const source = `import { foo } from './foo.mts';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });
  });

  describe('when the specifier is a bare package import', () => {
    it('should skip a bare package import', () => {
      const source = `import lodash from 'lodash';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip a scoped package import', () => {
      const source = `import { McpServer } from '@modelcontextprotocol/sdk';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });
  });

  describe('when the specifier is an external deep path', () => {
    it('should skip external deep paths by default', () => {
      const source = `import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should skip unscoped deep paths by default', () => {
      const source = `import debounce from 'lodash/debounce';`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should add extension to unscoped deep path when externalDeep is true', () => {
      const source = `import debounce from 'lodash/debounce';`;
      expect(rewriteSpecifiers(source, { externalDeep: true })).toBe(
        `import debounce from 'lodash/debounce.js';`,
      );
    });

    it('should add extension to scoped deep path when externalDeep is true', () => {
      const source = `import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';`;
      expect(rewriteSpecifiers(source, { externalDeep: true })).toBe(
        `import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';`,
      );
    });

    it('should skip scoped package without deep path when externalDeep is true', () => {
      const source = `import { foo } from '@scope/pkg';`;
      expect(rewriteSpecifiers(source, { externalDeep: true })).toBe(source);
    });

    it('should skip node: protocol imports when externalDeep is true', () => {
      const source = `import { readFile } from 'node:fs/promises';`;
      expect(rewriteSpecifiers(source, { externalDeep: true })).toBe(source);
    });

    it('should skip bun: protocol imports when externalDeep is true', () => {
      const source = `import { serve } from 'bun:test';`;
      expect(rewriteSpecifiers(source, { externalDeep: true })).toBe(source);
    });

    it('should skip # subpath imports when externalDeep is true', () => {
      const source = `import { helper } from '#internal/utils';`;
      expect(rewriteSpecifiers(source, { externalDeep: true })).toBe(source);
    });

    it('should skip a deep path that already has an extension when externalDeep is true', () => {
      const source = `import { foo } from '@scope/pkg/sub.js';`;
      expect(rewriteSpecifiers(source, { externalDeep: true })).toBe(source);
    });
  });

  describe('when ignore patterns are provided', () => {
    it('should skip specifiers matching a wildcard ignore pattern', () => {
      const source = `import { foo } from './foo';`;
      expect(rewriteSpecifiers(source, { ignore: ['./*'] })).toBe(source);
    });

    it('should skip specifiers matching a scoped wildcard ignore pattern', () => {
      const source = `import { EUtils } from '@ncbijs/eutils';`;
      expect(rewriteSpecifiers(source, { externalDeep: true, ignore: ['@ncbijs/*'] })).toBe(source);
    });

    it('should skip deep paths matching a scoped wildcard ignore pattern', () => {
      const source = `import { config } from '@ncbijs/eutils/config';`;
      expect(rewriteSpecifiers(source, { externalDeep: true, ignore: ['@ncbijs/*'] })).toBe(source);
    });

    it('should skip specifiers matching an exact ignore pattern', () => {
      const source = `import { foo } from './foo';`;
      expect(rewriteSpecifiers(source, { ignore: ['./foo'] })).toBe(source);
    });

    it('should not skip non-matching specifiers', () => {
      const source = `import { foo } from './foo';`;
      expect(rewriteSpecifiers(source, { ignore: ['./bar'] })).toBe(
        `import { foo } from './foo.js';`,
      );
    });
  });

  describe('when using different import forms', () => {
    it('should handle dynamic import', () => {
      const source = `const mod = await import('./lazy');`;
      expect(rewriteSpecifiers(source)).toBe(`const mod = await import('./lazy.js');`);
    });

    it('should handle side-effect import', () => {
      const source = `import './polyfills';`;
      expect(rewriteSpecifiers(source)).toBe(`import './polyfills.js';`);
    });

    it('should handle export from', () => {
      const source = `export { foo } from './foo';`;
      expect(rewriteSpecifiers(source)).toBe(`export { foo } from './foo.js';`);
    });

    it('should handle export star from', () => {
      const source = `export * from './utils';`;
      expect(rewriteSpecifiers(source)).toBe(`export * from './utils.js';`);
    });

    it('should handle type import in declaration file', () => {
      const source = `import type { Config } from './interfaces/config.interface';`;
      expect(rewriteSpecifiers(source)).toBe(
        `import type { Config } from './interfaces/config.interface.js';`,
      );
    });

    it('should handle type export in declaration file', () => {
      const source = `export type { Config } from './interfaces/config.interface';`;
      expect(rewriteSpecifiers(source)).toBe(
        `export type { Config } from './interfaces/config.interface.js';`,
      );
    });

    it('should handle double-quoted imports', () => {
      const source = `import { foo } from "./foo";`;
      expect(rewriteSpecifiers(source)).toBe(`import { foo } from "./foo.js";`);
    });
  });

  describe('when a custom extension is specified', () => {
    it('should use .mjs when specified', () => {
      const source = `import { foo } from './foo';`;
      expect(rewriteSpecifiers(source, { extension: '.mjs' })).toBe(
        `import { foo } from './foo.mjs';`,
      );
    });

    it('should use .cjs when specified', () => {
      const source = `import { foo } from './foo';`;
      expect(rewriteSpecifiers(source, { extension: '.cjs' })).toBe(
        `import { foo } from './foo.cjs';`,
      );
    });
  });

  describe('when the source has mixed content', () => {
    it('should rewrite multiple imports in one source', () => {
      const source = [
        `import { foo } from './foo';`,
        `import { bar } from './bar';`,
        `import lodash from 'lodash';`,
        `export { baz } from './baz';`,
      ].join('\n');

      const expected = [
        `import { foo } from './foo.js';`,
        `import { bar } from './bar.js';`,
        `import lodash from 'lodash';`,
        `export { baz } from './baz.js';`,
      ].join('\n');

      expect(rewriteSpecifiers(source)).toBe(expected);
    });

    it('should return source unchanged when no imports need rewriting', () => {
      const source = `import lodash from 'lodash';\nconst x = 1;`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });

    it('should return empty string unchanged', () => {
      expect(rewriteSpecifiers('')).toBe('');
    });

    it('should handle source with no imports', () => {
      const source = `const x = 1;\nconst y = 2;`;
      expect(rewriteSpecifiers(source)).toBe(source);
    });
  });
});
