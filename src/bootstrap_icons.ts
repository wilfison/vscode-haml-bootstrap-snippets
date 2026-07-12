import path from "node:path";

import CssLibrary from "./css_library";

// Bootstrap Icons ships its glyphs as `.bi-*` CSS classes. Unlike Bootstrap
// itself, it is an optional dependency, so the extension only wires this up when
// the package is actually `detected` in the workspace (see extension.ts).
class BootstrapIcons extends CssLibrary {
  constructor() {
    super('bootstrap-icons', 'Bootstrap Icons');
  }

  protected remoteUrl(): string {
    return `https://cdn.jsdelivr.net/npm/bootstrap-icons@${this.version}/font/bootstrap-icons.min.css`;
  }

  protected localCssPath(): string {
    return path.join(this.rootPath, 'node_modules', 'bootstrap-icons', 'font', 'bootstrap-icons.min.css');
  }

  // `__dirname` is `out/` at runtime, so `../data` is the shipped snapshot dir.
  protected embeddedFallbackFile(): string {
    return path.resolve(__dirname, '../data/bootstrap-icons.json');
  }
}

export default BootstrapIcons;
