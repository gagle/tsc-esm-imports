export interface RewriteSpecifiersOptions {
  readonly extension?: string;
  readonly externalDeep?: boolean;
  readonly ignore?: ReadonlyArray<string>;
}

export interface AddImportExtensionsOptions extends RewriteSpecifiersOptions {
  readonly dryRun?: boolean;
}

export interface AddImportExtensionsResult {
  readonly filesScanned: number;
  readonly filesChanged: number;
}
