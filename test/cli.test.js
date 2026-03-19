import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runBtw } from "./helpers.js";

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), "..", "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

test("btw --help prints usage and core commands", () => {
  const r = runBtw(["--help"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Bittensor Wallet/);
  assert.match(r.stdout, /doctor/);
  assert.match(r.stdout, /wallet/);
});

test("btw -V prints package version", () => {
  const r = runBtw(["-V"]);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), pkg.version);
});

test("btw doctor prints environment summary", () => {
  const r = runBtw(["doctor"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Bittensor Wallet doctor/);
  assert.match(r.stdout, /cli version/);
  // Chalk may wrap the "node" label in ANSI; allow gaps between label and vX.Y.Z.
  assert.match(r.stdout, /node[\s\S]*?v\d+\.\d+\.\d+/);
  assert.match(r.stdout, /bittensor-wallet/);
});

test("btw config-path prints config directory line", () => {
  const r = runBtw(["config-path"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /bittensor-wallet/);
});

test("btw wallet list prints placeholder", () => {
  const r = runBtw(["wallet", "list"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /No keys indexed yet/);
});

test("btw unknown-command exits with error", () => {
  const r = runBtw(["definitely-not-a-command"]);
  assert.notEqual(r.status, 0);
});
