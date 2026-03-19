import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Run the real CLI binary (avoids Commander calling process.exit in-process).
 */
export function runBtw(args, env = {}) {
  const bin = join(root, "bin", "btw.js");
  return spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    // Apply last so local FORCE_COLOR / TTY hints from the parent shell can't re-enable chalk.
    env: { ...process.env, ...env, NO_COLOR: "1", FORCE_COLOR: "0" },
  });
}
