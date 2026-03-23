import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const versionFilePath = join(__dirname, "..", "VERSION");
const pkgPath = join(__dirname, "..", "package.json");
let version = "";

try {
  version = readFileSync(versionFilePath, "utf8").trim();
} catch {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  version = pkg.version;
}

export const VERSION = version;
