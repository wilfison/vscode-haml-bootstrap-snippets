import { workspace } from "vscode";
import { readFileSync } from "node:fs";

import { findVersionAndLocation } from './helpers/version';
import { extractClasses } from './helpers/css';
import * as cache from './helpers/cache';

// When the version can't be pinned we cache under 'latest'. Expire that entry so
// newly released versions eventually get picked up; pinned versions are
// immutable and cached forever.
const LATEST_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// A CSS class source (Bootstrap, Bootstrap Icons, ...) that detects the library
// version in the workspace, then loads its class list from the local
// node_modules copy or the jsDelivr CDN, caching the result per lib+version.
abstract class CssLibrary {
  public version: string = 'latest';
  public locationType: string = 'remote';
  public classList: Array<string> = [];
  protected rootPath: string = '';

  // `lib` is the package key used for detection and caching; `name` is the
  // human-facing label shown next to completion items.
  constructor(public readonly lib: string, public readonly name: string) {
    const [version, locationType, rootPath] = this.detect();

    this.version = version;
    this.locationType = locationType;
    this.rootPath = rootPath;
  }

  // The CDN URL for the pinned version's compiled CSS.
  protected abstract remoteUrl(): string;

  // The absolute path to the compiled CSS inside the local node_modules copy.
  protected abstract localCssPath(): string;

  // The absolute path to the offline snapshot shipped inside the extension,
  // used as a last resort when the live source can't be reached.
  protected abstract embeddedFallbackFile(): string;

  // True when the library was actually found in the workspace (a pinned
  // version), as opposed to falling back to 'latest'.
  public get detected(): boolean {
    return this.version !== 'latest';
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
      cache.writeCache(this.lib, this.version, this.classList);
      return;
    }

    // Last resort: an offline snapshot shipped with the extension, so class
    // completion is never permanently empty when the CDN is unreachable and
    // nothing is cached. Intentionally not cached, so the live source is
    // retried next session once the network recovers.
    this.loadEmbeddedFallback();
  }

  private loadEmbeddedFallback() {
    try {
      const parsed = JSON.parse(readFileSync(this.embeddedFallbackFile(), 'utf8'));

      if (Array.isArray(parsed) && parsed.length > 0) {
        this.classList = parsed;
      }
    } catch (error) {
      console.error(`Error reading ${this.lib} embedded classes: ${error}`);
    }
  }

  // Returns the cached class list only when it is fresh AND non-empty. A cache
  // holding `[]` (written by an older build before the empty-list write guard,
  // or for a version that once failed to load) must never be served: for pinned
  // versions it would otherwise count as valid forever, leaving class
  // completion permanently empty. Corrupt JSON is treated the same way.
  private readUsableCache(): Array<string> | null {
    if (!cache.cacheExists(this.lib, this.version)) {
      return null;
    }

    if (this.version === 'latest' && cache.cacheAgeMs(this.lib, this.version) >= LATEST_CACHE_TTL_MS) {
      return null;
    }

    try {
      const parsed = JSON.parse(cache.readCache(this.lib, this.version));
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch (error) {
      console.error(`Error reading ${this.lib} class cache: ${error}`);
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
      this.classList = extractClasses(content);
    } catch (error) {
      console.error(`Error fetching ${this.lib} classes: ${error}`);
    }
  }

  private loadLocal() {
    try {
      const content = readFileSync(this.localCssPath(), 'utf8');
      this.classList = extractClasses(content);
    } catch (error) {
      console.error(`Error reading ${this.lib} classes: ${error}`);
    }
  }

  // Scan every workspace folder and use the first one where the library is
  // actually detected (node_modules or Gemfile.lock). Falls back to the first
  // folder so a remote 'latest' lookup still has a sensible root.
  private detect(): [string, string, string] {
    const folders = workspace.workspaceFolders ?? [];

    for (const folder of folders) {
      const root = folder.uri.fsPath;
      const [version, locationType] = findVersionAndLocation(this.lib, root);

      if (version !== 'latest') {
        return [version, locationType, root];
      }
    }

    return ['latest', 'remote', folders[0]?.uri.fsPath ?? ''];
  }
}

export default CssLibrary;
