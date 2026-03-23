import { homedir } from "node:os";
import { config as dotenvConfig } from "dotenv";

export function loadEnv() {
  dotenvConfig({ quiet: true });
}

export function expandHome(pathValue) {
  if (!pathValue) return pathValue;
  if (pathValue === "~") return homedir();
  if (pathValue.startsWith("~/")) return pathValue.replace(/^~(?=\/)/, homedir());
  return pathValue;
}
