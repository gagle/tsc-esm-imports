<h1 align="center">tsc-esm-imports</h1>

<p align="center">A zero-dependency post-build tool that adds <code>.js</code> extensions to import specifiers in compiled TypeScript output.</p>

<p align="center">
  <a href="https://github.com/gagle/tsc-esm-imports/blob/main/LICENSE"><img src="https://img.shields.io/github/license/gagle/tsc-esm-imports" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/tsc-esm-imports"><img src="https://img.shields.io/npm/v/tsc-esm-imports" alt="npm version"></a>
</p>

---

## The problem

TypeScript's `tsc` compiler does not add file extensions to import specifiers in its output. When you write:

```ts
import { helper } from './helper';
```

The compiled `.js` output keeps the extensionless specifier:

```js
import { helper } from './helper';
```

Node.js ESM requires explicit file extensions for relative imports. Your code fails at runtime:

```
ERR_MODULE_NOT_FOUND: Cannot find module './helper'
```

## The solution

Run `tsc-esm-imports` on your `dist/` directory after `tsc`. It rewrites every import specifier that needs an extension:

```js
// Before
import { helper } from './helper';
import { parse } from './utils/parse';
import type { Config } from './interfaces/config.interface';

// After
import { helper } from './helper.js';
import { parse } from './utils/parse.js';
import type { Config } from './interfaces/config.interface.js';
```

Zero dependencies. Works on `.js`, `.mjs`, `.cjs`, `.d.ts`, `.d.mts`, and `.d.cts` files.

---

## Install

```bash
npm install --save-dev tsc-esm-imports
# or
pnpm add -D tsc-esm-imports
```

## Quick start

Add it as a postbuild step in your `package.json`:

```json
{
  "scripts": {
    "build": "tsc && tsc-esm-imports dist"
  }
}
```

That's it. All relative imports in `dist/` now have `.js` extensions.

---

## CLI

```
Usage: tsc-esm-imports <directory> [options]

Options:
  --ext <extension>     Extension to add (default: .js)
  --external-deep       Add extensions to external deep path imports
  --ignore <pattern>    Specifier pattern to skip (repeatable, supports trailing *)
  --dry-run             Show what would change without writing
  --help                Show this help message
```

### Examples

```bash
# Basic usage — add .js to all relative imports
tsc-esm-imports dist

# Use .mjs instead of .js
tsc-esm-imports dist --ext .mjs

# Also fix deep external imports (lodash/debounce, @scope/pkg/sub)
tsc-esm-imports dist --external-deep

# Skip specific packages
tsc-esm-imports dist --external-deep --ignore '@myorg/*'

# Preview changes without writing
tsc-esm-imports dist --dry-run
```

---

## Programmatic API

### `rewriteSpecifiers(source, options?)`

Rewrites import specifiers in a source string. Pure function, no I/O.

```ts
import { rewriteSpecifiers } from 'tsc-esm-imports';

const source = `import { foo } from './foo';`;
const result = rewriteSpecifiers(source);
// → `import { foo } from './foo.js';`
```

### `addImportExtensions(directory, options?)`

Walks a directory recursively, rewrites all processable files, returns stats.

```ts
import { addImportExtensions } from 'tsc-esm-imports';

const result = await addImportExtensions('dist', {
  extension: '.js',
  externalDeep: true,
  ignore: ['@myorg/*'],
  dryRun: false,
});

console.log(result);
// → { filesScanned: 42, filesChanged: 38 }
```

### Options

| Option         | Type                    | Default | Description                                                |
| -------------- | ----------------------- | ------- | ---------------------------------------------------------- |
| `extension`    | `string`                | `'.js'` | Extension to append                                        |
| `externalDeep` | `boolean`               | `false` | Add extensions to external deep path imports               |
| `ignore`       | `ReadonlyArray<string>` | `[]`    | Specifier patterns to skip (trailing `*` for prefix match) |
| `dryRun`       | `boolean`               | `false` | Count changes without writing to disk                      |

### Types

```ts
import type {
  RewriteSpecifiersOptions,
  AddImportExtensionsOptions,
  AddImportExtensionsResult,
} from 'tsc-esm-imports';
```

---

## What it handles

| Import form           | Example                                       | Rewritten?                  |
| --------------------- | --------------------------------------------- | --------------------------- |
| Relative import       | `import { x } from './foo'`                   | Yes                         |
| Parent import         | `import { x } from '../utils/bar'`            | Yes                         |
| Side-effect import    | `import './polyfills'`                        | Yes                         |
| Dynamic import        | `import('./lazy')`                            | Yes                         |
| Re-export             | `export { x } from './foo'`                   | Yes                         |
| Type import           | `import type { T } from './types'`            | Yes                         |
| Already has extension | `import { x } from './foo.js'`                | No (skipped)                |
| Bare package          | `import lodash from 'lodash'`                 | No (skipped)                |
| Scoped package        | `import { x } from '@scope/pkg'`              | No (skipped)                |
| External deep path    | `import { x } from 'lodash/debounce'`         | Only with `--external-deep` |
| `node:` protocol      | `import { readFile } from 'node:fs/promises'` | No (skipped)                |
| `#` subpath import    | `import { x } from '#internal/utils'`         | No (skipped)                |

### Processable file types

`.js` `.mjs` `.cjs` `.d.ts` `.d.mts` `.d.cts`

All other files (`.js.map`, `.json`, etc.) are skipped.

---

## Common patterns

### TypeScript + ESM postbuild

```json
{
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.build.json && tsc-esm-imports dist"
  }
}
```

### Monorepo with workspace packages

When your monorepo has `@myorg/*` packages resolved via path aliases, skip them so only relative and external deep paths get extensions:

```bash
tsc-esm-imports packages/my-pkg/dist --external-deep --ignore '@myorg/*'
```

### Nx monorepo (per-package build)

In each package's `project.json`:

```json
{
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p packages/my-pkg/tsconfig.build.json && tsc-esm-imports packages/my-pkg/dist --external-deep --ignore '@myorg/*'"
      }
    }
  }
}
```

### Custom extension for `.mjs` output

```bash
tsc-esm-imports dist --ext .mjs
```

---

## Why not alternatives?

| Approach                                           | Downside                                                                                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `"moduleResolution": "nodenext"` + `.js` in source | Forces `.js` extensions in TypeScript source files, breaks IDE go-to-definition in some setups |
| Bundlers (esbuild, rollup)                         | Adds build complexity for libraries that just need `tsc` output                                |
| `tsc-alias`                                        | Focused on path alias resolution, not extension addition                                       |
| Custom `sed`/regex script                          | Fragile, doesn't handle edge cases (protocol imports, subpath imports, declaration files)      |

`tsc-esm-imports` is purpose-built for one thing: add `.js` extensions to compiled ESM output. No bundler needed. No source code changes. No config files.
