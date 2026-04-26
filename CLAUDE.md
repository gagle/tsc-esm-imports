# CLAUDE.md

## Commands

```bash
pnpm build       # Build (tsc + postbuild adds .js extensions to compiled output)
pnpm test        # Test (Vitest with 100% coverage thresholds)
pnpm lint        # Lint (ESLint flat config)
pnpm typecheck   # Type-check (tsc --noEmit)
```

## Architecture

- **Language**: TypeScript 5, ES2022 target, `strict: true`
- **Module**: ESM-only (`"type": "module"`), `moduleResolution: "bundler"`, no `.js` in source imports
- **Build**: `tsc` + post-build script (`scripts/postbuild.mjs`) adds `.js` to compiled output
- **Zero-dep**: No runtime dependencies
- **Package manager**: pnpm 10.15

### File structure

```
src/
  index.ts                            # Re-exports public API
  rewrite-specifiers.ts               # Core import rewriting logic (pure function)
  add-import-extensions.ts            # Filesystem walker (reads/writes files)
  cli.ts                              # CLI argument parsing + run
  bin.ts                              # CLI entry point (shebang)
  interfaces/options.interface.ts     # All public types
  *.spec.ts                           # Co-located test files
scripts/
  postbuild.mjs                       # Self-hosting: adds .js to own dist output
```

### Self-hosting

The package uses itself to build itself. Since the compiled output can't run until extensions are added, `scripts/postbuild.mjs` contains a standalone copy of the rewriting logic. This script's regex must stay in sync with `src/rewrite-specifiers.ts`.

## Rules and Skills

This repo uses global `~/.claude/` configuration and project-level `.claude/` skills:

- **`~/.claude/rules/typescript.md`** -- TypeScript coding conventions
- **`~/.claude/skills/testing/`** -- Testing conventions
- **`~/.claude/skills/review/`** -- Code review process
- **`.claude/skills/commit/`** -- Composable git workflow

## Conventions

### Imports

```ts
import { rewriteSpecifiers } from './rewrite-specifiers'; // relative (no extension)
import type { RewriteSpecifiersOptions } from './interfaces/options.interface'; // type imports separated
```

### Types

- All interfaces live in `src/interfaces/{feature}.interface.ts`
- All properties are `readonly`
- Use generic `Array<T>` syntax, not `T[]` (ESLint enforced)
- Separate `import type` from value imports (ESLint enforced)
- No `any` (ESLint enforced)
- Unused vars must be prefixed with `_`

### Testing

- **Framework**: Vitest with `@vitest/coverage-v8`
- **Coverage**: 100% on lines, functions, branches, statements
- **Config**: `globals: true`, `restoreMocks: true`
- **Specs co-located**: `foo.spec.ts` next to `foo.ts` in `src/`

### Formatting

- Prettier: 100 width, single quotes, trailing commas, 2-space indent, LF
- Commit: `{type}({scope}): {subject}` (conventional commits via commitlint)
- Scopes: `cli`, `core`, `workspace`

## Verification

After ANY code change, run lint, build, typecheck, and test before marking work complete:

```bash
pnpm lint && pnpm build && pnpm typecheck && pnpm test
```

### Self-review loop

After implementation is complete, run the following skills in sequence. Loop until both produce no issues or improvements:

1. `/agent-skills:review` -- five-axis code review
2. `/agent-skills:code-simplify` -- simplify code for clarity without changing behavior

If either skill finds issues, fix them, re-run `pnpm lint && pnpm build && pnpm typecheck && pnpm test`, then repeat the loop.
