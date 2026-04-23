import type { RewriteSpecifiersOptions } from './interfaces/options.interface';

const IMPORT_SPECIFIER_RE = /((?:from|import\s|import\()\s*['"])([^'"]+?)(['"])/g;
const HAS_EXTENSION_RE = /\.(m?[jt]sx?|cjs|cts|json)$/;

function isRelative(specifier: string): boolean {
  return specifier.startsWith('.');
}

function isExternalDeepPath(specifier: string): boolean {
  if (specifier.includes(':') || specifier.startsWith('#')) {
    return false;
  }
  if (specifier.startsWith('@')) {
    return specifier.split('/').length > 2;
  }
  return specifier.includes('/');
}

function matchesIgnorePattern(specifier: string, patterns: ReadonlyArray<string>): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('*')) {
      return specifier.startsWith(pattern.slice(0, -1));
    }
    return specifier === pattern;
  });
}

export function rewriteSpecifiers(source: string, options: RewriteSpecifiersOptions = {}): string {
  const extension = options.extension ?? '.js';
  const externalDeep = options.externalDeep ?? false;
  const ignore = options.ignore ?? [];

  return source.replace(
    IMPORT_SPECIFIER_RE,
    (match: string, prefix: string, specifier: string, suffix: string) => {
      if (HAS_EXTENSION_RE.test(specifier)) {
        return match;
      }

      if (matchesIgnorePattern(specifier, ignore)) {
        return match;
      }

      if (isRelative(specifier) || (externalDeep && isExternalDeepPath(specifier))) {
        return `${prefix}${specifier}${extension}${suffix}`;
      }

      return match;
    },
  );
}
