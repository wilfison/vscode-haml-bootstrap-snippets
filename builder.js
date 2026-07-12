const fs = require("fs");
const path = require("path");

// Templates under bootstrap/<version>/*.txt are written directly in native
// VS Code snippet syntax (tabstops, placeholders, choices, variables,
// transforms). The builder no longer expands any custom DSL: it just reads
// each file and turns it into a `.code-snippets` entry, one array item per line.
function buildSnippet(bsVersion, fileLocation) {
  const fileContent = fs
    .readFileSync(fileLocation, "utf8")
    .replace(/\r\n/g, "\n")
    .replace(/\n$/, "");
  const fileName = path.basename(fileLocation, ".txt");
  const html5 = fileName === "html5";
  const name = html5
    ? "HTML5 Bootstrap"
    : fileName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  const prefix = html5 ? "!bs" : "bs";

  return [
    name,
    {
      prefix: `${prefix}${bsVersion}-${fileName}`,
      body: fileContent.split("\n"),
    },
  ];
}

const BS_VERSIONS = ["4", "5"];
const bootstrapDir = path.join(__dirname, "bootstrap");

BS_VERSIONS.forEach((bsVersion) => {
  const files = fs
    .readdirSync(path.join(bootstrapDir, bsVersion))
    .filter((file) => file.endsWith(".txt"))
    .sort();
  const snippets = {};

  files.forEach((file) => {
    const fileLocation = path.join(bootstrapDir, bsVersion, file);
    const [name, snippet] = buildSnippet(bsVersion, fileLocation);
    snippets[name] = snippet;
  });

  fs.writeFileSync(
    path.join(__dirname, `snippets/bootstrap${bsVersion}.code-snippets`),
    JSON.stringify(snippets, null, 2) + "\n"
  );
});
