import path from "node:path";

import CssLibrary from "./css_library";

class Bootstrap extends CssLibrary {
  public majorVersion: string;

  constructor() {
    super('bootstrap', 'Bootstrap');
    this.majorVersion = this.version.split('.')[0];
  }

  protected remoteUrl(): string {
    return `https://cdn.jsdelivr.net/npm/bootstrap@${this.version}/dist/css/bootstrap.min.css`;
  }

  protected localCssPath(): string {
    return path.join(this.rootPath, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css');
  }

  // Pick the snapshot by major version. When the version can't be pinned
  // (`latest`) or is anything other than 4, fall back to BS5 (the current
  // default). `__dirname` is `out/` at runtime, so `../data` is the shipped dir.
  protected embeddedFallbackFile(): string {
    const major = this.majorVersion === '4' ? '4' : '5';
    return path.resolve(__dirname, `../data/bootstrap-${major}.json`);
  }
}

export default Bootstrap;
