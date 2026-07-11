import { workspace } from "vscode";
import { findVersionAndLocation, readLocalCssFile } from './helpers/version';

import * as cache from './helpers/cache';

class Bootstrap {
  public version: string = 'latest';
  public majorVersion: string = '5';
  public locationType: string = 'remote';
  public classList: Array<string> = [];

  constructor() {
    let [version, locationType] = findVersionAndLocation('bootstrap', this.rootPath());

    this.version = version;
    this.majorVersion = this.version.split('.')[0];
    this.locationType = locationType;
  }

  public async load() {
    const cached = cache.cacheExists('bootstrap', this.version);

    if (cached) {
      this.classList = JSON.parse(cache.readCache('bootstrap', this.version));
      return;
    }

    if (this.locationType === 'remote') {
      await this.loadRemote();
    } else {
      this.loadLocal();
    }

    if (this.classList.length > 0) {
      this.writeCache();
    }
  }

  private async loadRemote() {
    const response = await fetch(this.remoteUrl());
    const content = await response.text();

    this.classList = this.extractClasses(content);
  }

  private loadLocal() {
    const content = readLocalCssFile(this.rootPath());
    this.classList = this.extractClasses(content);
  }

  private rootPath(): string {
    return workspace.workspaceFolders ? workspace.workspaceFolders[0].uri.fsPath : '';
  }

  private remoteUrl(): string {
    return `https://cdn.jsdelivr.net/npm/bootstrap@${this.version}/dist/css/bootstrap.min.css`;
  }

  private writeCache() {
    cache.writeCache('bootstrap', this.version, this.classList);
  }

  private extractClasses(content: string): Array<string> {
    const classes: Set<string> = new Set();
    const classRegex = /\.(-?[a-zA-Z_][\w-]*)/g;

    // Depth of *declaration* blocks we're inside. Property values live here and
    // can contain dots (e.g. `.5rem` or SVG data URIs), so they must be skipped.
    // At-rule blocks (@media/@supports/@keyframes) are not counted, so their
    // nested selectors are still scanned.
    let skipDepth = 0;
    let selector = '';

    for (const char of content) {
      if (char === '{') {
        const isAtRule = selector.trimStart().startsWith('@');

        if (skipDepth === 0 && !isAtRule) {
          let match: RegExpExecArray | null;
          while ((match = classRegex.exec(selector)) !== null) {
            classes.add(match[1]);
          }
          skipDepth = 1;
        } else if (skipDepth > 0) {
          skipDepth++;
        }

        selector = '';
      } else if (char === '}') {
        if (skipDepth > 0) {
          skipDepth--;
        }

        selector = '';
      } else if (skipDepth === 0) {
        selector += char;
      }
    }

    return Array.from(classes);
  }
}

export default Bootstrap;
