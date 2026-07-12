import { readFileSync } from "node:fs";
import path from "node:path";

export function findVersionAndLocation(lib: string, rootPath: string): Array<string> {
  let bsVersion: string | null = findVersionOnNodeModules(lib, rootPath);
  const location = bsVersion ? 'local' : 'remote';

  if (!bsVersion) {
    bsVersion = findVersionOnGemfileLock(lib, rootPath);
  }

  return [bsVersion || 'latest', location];
}

function findVersionOnNodeModules(lib: string, rootPath: string): string | null {
  try {
    const packageJsonPath = path.join(rootPath, 'node_modules', lib, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

    return packageJson.version ?? null;
  } catch (error) {
    return null;
  }
}

function findVersionOnGemfileLock(lib: string, rootPath: string): string | null {
  const regex = new RegExp(`${lib} \\((\\d+\\.\\d+\\.\\d+)\\)`);

  try {
    const fileContent = readFileSync(path.join(rootPath, 'Gemfile.lock'), 'utf8');
    const match = fileContent.match(regex);

    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
}
