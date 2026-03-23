import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
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
  const configDir = mkdtempSync(join(tmpdir(), "btw-config-"));
  const r = runBtw(["config-path"], { BTW_CONFIG_DIR: configDir });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, new RegExp(configDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("btw wallet list prints empty-state hint", () => {
  const configDir = mkdtempSync(join(tmpdir(), "btw-empty-"));
  const r = runBtw(["wallet", "list"], { BTW_CONFIG_DIR: configDir });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /No wallets found/);
});

test("btw wallet create generates mnemonic and list shows wallet", () => {
  const configDir = mkdtempSync(join(tmpdir(), "btw-create-"));
  const create = runBtw(["wallet", "create", "--name", "alice"], { BTW_CONFIG_DIR: configDir });
  assert.equal(create.status, 0, create.stderr);
  assert.match(create.stdout, /wallet "alice" created/);
  assert.doesNotMatch(create.stdout, /Save this mnemonic now/);
  assert.match(create.stdout, /Mnemonic hidden because output is not interactive/);

  const list = runBtw(["wallet", "list"], { BTW_CONFIG_DIR: configDir });
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /alice/);
  assert.match(list.stdout, /sr25519|ed25519/);

  const walletFile = join(configDir, "wallets", "alice.json");
  assert.equal(existsSync(walletFile), true);
  const saved = JSON.parse(readFileSync(walletFile, "utf8"));
  assert.equal(saved.name, "alice");
  assert.match(saved.mnemonic, /^(\w+\s){11,23}\w+$/);
  assert.equal(typeof saved.ss58Address, "string");
  assert.equal(typeof saved.accountId, "string");
  assert.equal(typeof saved.privateKey, "string");
  assert.equal(typeof saved.secretSeed, "string");
  assert.equal(typeof saved.publicKey, "string");
  assert.equal(saved.hotkeyJson, undefined);
});

test("btw wallet create supports --words 24", () => {
  const configDir = mkdtempSync(join(tmpdir(), "btw-words-"));
  const r = runBtw(["wallet", "create", "--name", "seed24", "--words", "24"], {
    BTW_CONFIG_DIR: configDir,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /wallet "seed24" created/);
});

test("btw wallet create supports --hide-mnemonic flag", () => {
  const configDir = mkdtempSync(join(tmpdir(), "btw-hide-"));
  const r = runBtw(["wallet", "create", "--name", "hidden", "--hide-mnemonic"], {
    BTW_CONFIG_DIR: configDir,
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /Mnemonic hidden because --hide-mnemonic flag/);
});

test("btw wallet create with invalid mnemonic fails", () => {
  const configDir = mkdtempSync(join(tmpdir(), "btw-invalid-"));
  const r = runBtw(
    ["wallet", "create", "--name", "bad", "--mnemonic", "not a valid mnemonic"],
    { BTW_CONFIG_DIR: configDir },
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Invalid mnemonic phrase/);
});

test("btw wallet create with unsupported --words fails", () => {
  const configDir = mkdtempSync(join(tmpdir(), "btw-bad-words-"));
  const r = runBtw(["wallet", "create", "--name", "badwords", "--words", "20"], {
    BTW_CONFIG_DIR: configDir,
  });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Invalid words count/);
});

test("btw wallet create without name fails in non-interactive mode", () => {
  const configDir = mkdtempSync(join(tmpdir(), "btw-no-name-"));
  const r = runBtw(["wallet", "create"], { BTW_CONFIG_DIR: configDir });
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /Wallet name is required/);
});

test("btw unknown-command exits with error", () => {
  const r = runBtw(["definitely-not-a-command"]);
  assert.notEqual(r.status, 0);
});
