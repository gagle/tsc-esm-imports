import { addImportExtensions } from './add-import-extensions';

interface ParsedArgs {
  readonly directory: string;
  readonly extension: string;
  readonly externalDeep: boolean;
  readonly ignore: ReadonlyArray<string>;
  readonly dryRun: boolean;
}

function printUsage(): void {
  // eslint-disable-next-line no-console
  console.log(`Usage: tsc-esm-imports <directory> [options]

Options:
  --ext <extension>     Extension to add (default: .js)
  --external-deep       Add extensions to external deep path imports
  --ignore <pattern>    Specifier pattern to skip (repeatable, supports trailing *)
  --dry-run             Show what would change without writing
  --help                Show this help message`);
}

export function parseArgs(argv: ReadonlyArray<string>): ParsedArgs | undefined {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    if (args.length === 0) {
      process.exitCode = 1;
    }
    return undefined;
  }

  let directory = '';
  let extension = '.js';
  let externalDeep = false;
  const ignore: Array<string> = [];
  let dryRun = false;

  for (let argIndex = 0; argIndex < args.length; argIndex++) {
    const arg = args[argIndex];
    if (arg === '--ext') {
      extension = args[++argIndex] ?? '.js';
    } else if (arg === '--external-deep') {
      externalDeep = true;
    } else if (arg === '--ignore') {
      const pattern = args[++argIndex];
      if (pattern) {
        ignore.push(pattern);
      }
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg && !arg.startsWith('-')) {
      directory = arg;
    }
  }

  if (!directory) {
    console.error('Error: directory argument is required\n');
    printUsage();
    process.exitCode = 1;
    return undefined;
  }

  return { directory, extension, externalDeep, ignore, dryRun };
}

export async function run(argv: ReadonlyArray<string>): Promise<void> {
  const parsed = parseArgs(argv);

  if (!parsed) {
    return;
  }

  const { directory, ...options } = parsed;
  const result = await addImportExtensions(directory, options);

  if (parsed.dryRun) {
    // eslint-disable-next-line no-console
    console.log(`Dry run: ${result.filesChanged} of ${result.filesScanned} files would be changed`);
  }
}
