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
}

export default Bootstrap;
