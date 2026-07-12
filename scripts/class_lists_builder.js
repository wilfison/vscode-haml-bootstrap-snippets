const fs = require("fs");
const path = require("path");

// Generates the offline class-list snapshots shipped in the `.vsix`, used as a
// last-resort fallback by the CSS class completion when the CDN is unreachable
// and there's no cache (see src/css_library.ts `loadEmbeddedFallback`).
//
// It reuses the SAME extractor as the runtime (out/helpers/css.js) so the
// snapshots match exactly what production would extract. That file is compiled
// output, so `npm run compile` must run first (guaranteed in vscode:prepublish).
//
// Fail-safe: if a download fails, any already-committed data/*.json is kept
// intact and the script still exits 0, so publishing is never blocked offline.

const rootDir = path.join(__dirname, "..");
const cssHelperPath = path.join(rootDir, "out", "helpers", "css.js");

if (!fs.existsSync(cssHelperPath)) {
  console.error(
    "class_lists_builder: out/helpers/css.js not found. Run `npm run compile` first."
  );
  process.exit(1);
}

const { extractClasses } = require(cssHelperPath);

const dataDir = path.join(rootDir, "data");

const TARGETS = [
  {
    file: "bootstrap-4.json",
    url: "https://cdn.jsdelivr.net/npm/bootstrap@4/dist/css/bootstrap.min.css",
  },
  {
    file: "bootstrap-5.json",
    url: "https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css",
  },
  {
    file: "bootstrap-icons.json",
    url: "https://cdn.jsdelivr.net/npm/bootstrap-icons@1/font/bootstrap-icons.min.css",
  },
];

async function buildTarget({ file, url }) {
  const destination = path.join(dataDir, file);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }

    const classes = extractClasses(await response.text());

    if (classes.length === 0) {
      throw new Error(`no classes extracted from ${url}`);
    }

    fs.writeFileSync(destination, JSON.stringify(classes));
    console.log(`class_lists_builder: wrote ${file} (${classes.length} classes)`);
  } catch (error) {
    // Keep the committed snapshot rather than wiping it, so an offline build
    // still ships the last good data.
    const kept = fs.existsSync(destination) ? " keeping existing snapshot" : "";
    console.warn(`class_lists_builder: failed to update ${file}: ${error}.${kept}`);
  }
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });
  await Promise.all(TARGETS.map(buildTarget));
}

main();
