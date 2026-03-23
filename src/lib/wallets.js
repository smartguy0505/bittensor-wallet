import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Keyring } from "@polkadot/keyring";
import {
  cryptoWaitReady,
  ed25519PairFromSeed,
  mnemonicGenerate,
  mnemonicToMiniSecret,
  mnemonicValidate,
  sr25519PairFromSeed,
} from "@polkadot/util-crypto";
import { expandHome } from "./env.js";

export function getConfigDir() {
  return expandHome(process.env.BTW_CONFIG_DIR) || join(homedir(), ".bittensor", "js-wallet");
}

function getWalletsPath() {
  return join(getConfigDir(), "wallets.json");
}

function getWalletsDir() {
  return join(getConfigDir(), "wallets");
}

function getWalletFilePath(name) {
  if (name.includes("/") || name.includes("\\")) {
    throw new Error("Wallet name cannot include / or \\");
  }
  return join(getWalletsDir(), `${name}.json`);
}

function readLegacyWalletsFile() {
  const path = getWalletsPath();
  if (!existsSync(path)) {
    return { wallets: [] };
  }

  const data = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(data.wallets)) {
    throw new Error("Invalid wallets.json format: expected { wallets: [] }");
  }
  return data;
}

function readWalletFile(path) {
  const data = JSON.parse(readFileSync(path, "utf8"));
  if (
    typeof data.name !== "string" ||
    typeof (data.ss58Address || data.address) !== "string" ||
    typeof data.type !== "string"
  ) {
    throw new Error(`Invalid wallet file: ${path}`);
  }
  return data;
}

function readWalletsFromDirectory() {
  const walletsDir = getWalletsDir();
  if (!existsSync(walletsDir)) {
    return [];
  }

  const files = readdirSync(walletsDir).filter((f) => f.endsWith(".json")).sort();
  return files.map((file) => {
    const wallet = readWalletFile(join(walletsDir, file));
    return {
      name: wallet.name,
      ss58Address: wallet.ss58Address || wallet.address,
      type: wallet.type,
      createdAt: wallet.createdAt,
    };
  });
}

function writeWalletFile(name, data) {
  const dir = getWalletsDir();
  mkdirSync(dir, { recursive: true });
  writeFileSync(getWalletFilePath(name), JSON.stringify(data, null, 2) + "\n", "utf8");
}

function toHex(bytes) {
  if (!bytes) {
    return undefined;
  }
  return "0x" + Buffer.from(bytes).toString("hex");
}

export async function createWallet({ name, mnemonic, type = "sr25519", words = 12 }) {
  await cryptoWaitReady();

  if (![12, 15, 18, 21, 24].includes(words)) {
    throw new Error("Invalid words count. Use 12, 15, 18, 21, or 24");
  }

  const finalMnemonic = mnemonic || mnemonicGenerate(words);
  if (!mnemonicValidate(finalMnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const keyring = new Keyring({ type });
  const pair = keyring.addFromMnemonic(finalMnemonic, { name });
  const secretSeed = mnemonicToMiniSecret(finalMnemonic);
  const rawPair = type === "ed25519" ? ed25519PairFromSeed(secretSeed) : sr25519PairFromSeed(secretSeed);
  const pubKey = rawPair.publicKey;
  const secretKey = rawPair.secretKey;

  if (listWallets().some((w) => w.name === name)) {
    throw new Error(`Wallet with name "${name}" already exists`);
  }

  const wallet = {
    name,
    ss58Address: pair.address,
    type,
    createdAt: new Date().toISOString(),
  };

  writeWalletFile(name, {
    ...wallet,
    mnemonic: finalMnemonic,
    accountId: toHex(pubKey),
    privateKey: toHex(secretKey),
    secretSeed: toHex(secretSeed),
    publicKey: toHex(pubKey),
  });

  return {
    wallet,
    mnemonic: finalMnemonic,
    generatedMnemonic: !mnemonic,
  };
}

export function listWallets() {
  const wallets = readWalletsFromDirectory();
  if (wallets.length > 0) {
    return wallets;
  }
  // Backward compatibility with older single-file storage.
  return readLegacyWalletsFile().wallets;
}
