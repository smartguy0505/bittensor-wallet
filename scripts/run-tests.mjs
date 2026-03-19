#!/usr/bin/env node
/**
 * Run all *.test.js files under test/ (recursive). Avoids shell glob / quoting
 * issues on GitHub Actions and Windows (npm scripts).
 */
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const testDir = join(root, "test");

function collectTestFiles(dir, acc = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      collectTestFiles(p, acc);
    } else if (ent.name.endsWith(".test.js")) {
      acc.push(p);
    }
  }
  return acc;
}

const files = collectTestFiles(testDir).sort();
if (files.length === 0) {
  console.error("No test files found under test/");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  cwd: root,
  env: process.env,
});

process.exit(result.status === null ? 1 : result.status);
