import { workspace } from "vscode";
import { findVersionAndLocation, readLocalCssFile } from './helpers/version';

import * as cache from './helpers/cache';

// When the Bootstrap version can't be pinned we cache under 'latest'. Expire
// that entry so newly released versions eventually get picked up; pinned
// versions are immutable and cached forever.
const LATEST_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class Bootstrap {
  public version: string = 'latest';
  public majorVersion: string = '5';
  public locationType: string = 'remote';
  public classList: Array<string> = [];
  private bootstrapRoot: string = '';

  constructor() {
    const [version, locationType, rootPath] = this.detect();

    this.version = version;
    this.majorVersion = this.version.split('.')[0];
    this.locationType = locationType;
    this.bootstrapRoot = rootPath;
  }

  public async load() {
    const cached = this.readUsableCache();
    if (cached) {
      this.classList = cached;
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

  // Returns the cached class list only when it is fresh AND non-empty. A cache
  // holding `[]` (written by an older build before the empty-list write guard,
  // or for a version that once failed to load) must never be served: for pinned
  // versions it would otherwise count as valid forever, leaving class
  // completion permanently empty. Corrupt JSON is treated the same way.
  private readUsableCache(): Array<string> | null {
    if (!cache.cacheExists('bootstrap', this.version)) {
      return null;
    }

    if (this.version === 'latest' && cache.cacheAgeMs('bootstrap', this.version) >= LATEST_CACHE_TTL_MS) {
      return null;
    }

    try {
      const parsed = JSON.parse(cache.readCache('bootstrap', this.version));
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch (error) {
      console.error(`Error reading Bootstrap class cache: ${error}`);
      return null;
    }
  }

  private async loadRemote() {
    try {
      const response = await fetch(this.remoteUrl());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${this.remoteUrl()}`);
      }

      const content = await response.text();
      this.classList = this.extractClasses(content);
    } catch (error) {
      console.error(`Error fetching Bootstrap classes: ${error}`);
    }
  }

  private loadLocal() {
    const content = readLocalCssFile(this.bootstrapRoot);
    this.classList = this.extractClasses(content);
  }

  // Scan every workspace folder and use the first one where Bootstrap is
  // actually detected (node_modules or Gemfile.lock). Falls back to the first
  // folder so a remote 'latest' lookup still has a sensible root.
  private detect(): [string, string, string] {
    const folders = workspace.workspaceFolders ?? [];

    for (const folder of folders) {
      const root = folder.uri.fsPath;
      const [version, locationType] = findVersionAndLocation('bootstrap', root);

      if (version !== 'latest') {
        return [version, locationType, root];
      }
    }

    return ['latest', 'remote', folders[0]?.uri.fsPath ?? ''];
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
