import chalk from "chalk";
import { createInterface } from "node:readline/promises";
import { createWallet, listWallets } from "../lib/wallets.js";
import { disconnectApi, getApi } from "../lib/chain.js";

async function resolveWalletName(providedName) {
  if (typeof providedName === "string" && providedName.trim() !== "") {
    return providedName.trim();
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Wallet name is required. Use --name <name>.");
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("Wallet name: ");
    const value = answer.trim();
    if (!value) {
      throw new Error("Wallet name is required.");
    }
    return value;
  } finally {
    rl.close();
  }
}

async function selectMnemonicWords(providedWords) {
  if (providedWords !== undefined) {
    const n = Number.parseInt(String(providedWords), 10);
    if (![12, 15, 18, 21, 24].includes(n)) {
      throw new Error("Invalid words count. Use --words 12, 15, 18, 21, or 24");
    }
    return n;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return 12;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question("Mnemonic words (12/15/18/21/24) [12]: ");
    const value = answer.trim() === "" ? "12" : answer.trim();
    const n = Number.parseInt(value, 10);
    if (![12, 15, 18, 21, 24].includes(n)) {
      throw new Error("Invalid words count. Choose 12, 15, 18, 21, or 24");
    }
    return n;
  } finally {
    rl.close();
  }
}

function isLikelySs58(value) {
  return /^[1-9A-HJ-NP-Za-km-z]{47,64}$/.test(value);
}

async function resolveBalanceInput(providedInput, wallets) {
  if (typeof providedInput === "string" && providedInput.trim() !== "") {
    return providedInput.trim();
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      const answer = await rl.question(
        "Enter the wallet name or coldkey ss58 addresses (comma-separated) (default): ",
      );
      const text = answer.trim();
      if (text) return text;
    } finally {
      rl.close();
    }
  }

  if (process.env.BTW_WALLET_NAME) return process.env.BTW_WALLET_NAME;
  if (wallets.length === 1) return wallets[0].name;
  throw new Error("Select wallet with --name <name> or --wallets <name-or-ss58,...> (or set BTW_WALLET_NAME)");
}

function resolveBalanceTargets(wallets, input) {
  const parts = input
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const targets = [];

  for (const part of parts) {
    const walletByName = wallets.find((w) => w.name === part);
    if (walletByName) {
      targets.push(walletByName);
      continue;
    }
    if (!isLikelySs58(part)) {
      throw new Error(`Target "${part}" is neither a known wallet name nor a valid ss58 address`);
    }
    targets.push({
      name: "(external)",
      ss58Address: part,
      type: "-",
    });
  }

  if (targets.length === 0) {
    throw new Error("No wallet target provided");
  }
  return targets;
}

function formatFixed(valueRaw, decimals, places = 4) {
  const value = BigInt(valueRaw);
  const base = 10n ** BigInt(decimals);
  const scale = 10n ** BigInt(places);
  const scaled = (value * scale) / base;
  const whole = scaled / scale;
  const frac = (scaled % scale).toString().padStart(places, "0");
  return `${whole}.${frac}`;
}

function pad(text, width, right = false) {
  const str = String(text);
  if (str.length >= width) return str;
  return right ? " ".repeat(width - str.length) + str : str + " ".repeat(width - str.length);
}

export function registerWalletCommands(program) {
  const wallet = program.command("wallet").description("key and account operations");
  wallet.showHelpAfterError("(add --help for usage)");

  const create = wallet
    .command("create")
    .description("create wallet from mnemonic (or generate one)")
    .option("-n, --name [name]", "wallet name (unique)")
    .option("-m, --mnemonic <mnemonic>", "existing 12/15/18/21/24-word mnemonic")
    .option("-w, --words <count>", "generated mnemonic words: 12, 15, 18, 21, or 24")
    .option("--hide-mnemonic", "do not print mnemonic to console")
    .option("-t, --type <type>", "key type: sr25519 or ed25519", "sr25519")
    .action(async (opts) => {
      const type = String(opts.type || "").toLowerCase();
      if (!["sr25519", "ed25519"].includes(type)) {
        console.error(chalk.red("error") + " unsupported key type: " + opts.type);
        process.exitCode = 1;
        return;
      }

      try {
        const name = await resolveWalletName(opts.name);
        const words = opts.mnemonic ? 12 : await selectMnemonicWords(opts.words);
        const result = await createWallet({
          name,
          mnemonic: opts.mnemonic,
          type,
          words,
        });
        console.log(chalk.green("✓") + ` wallet "${result.wallet.name}" created`);
        console.log(`  ${chalk.dim("ss58Address")}  ${result.wallet.ss58Address}`);
        console.log(`  ${chalk.dim("type")}     ${result.wallet.type}`);
        if (result.generatedMnemonic) {
          // Never print sensitive mnemonic when output is hidden/piped.
          if (!opts.hideMnemonic && process.stdout.isTTY) {
            console.log("");
            console.log(chalk.yellow("Save this mnemonic now. It is shown only once:"));
            console.log(result.mnemonic);
          } else {
            const reason = opts.hideMnemonic ? "--hide-mnemonic flag" : "output is not interactive (TTY)";
            console.log(chalk.dim(`Mnemonic hidden because ${reason}.`));
          }
        }
      } catch (err) {
        console.error(chalk.red("error") + " " + err.message);
        process.exitCode = 1;
      }
    });
  create.addHelpText(
    "after",
    `
Examples:
  $ btw wallet create --name alice
  $ btw wallet create --name bob --words 24
  $ btw wallet create --name imported --mnemonic "word1 word2 ..."
  $ btw wallet create --name secure --hide-mnemonic
`,
  );

  wallet
    .command("list")
    .description("list saved wallets")
    .action(() => {
      try {
        const wallets = listWallets();
        if (wallets.length === 0) {
          console.log(chalk.dim("No wallets found. Create one with: btw wallet create --name my-wallet"));
          return;
        }

        for (const w of wallets) {
          console.log(`${w.name}  ${chalk.dim(w.type)}  ${w.ss58Address}`);
        }
      } catch (err) {
        console.error(chalk.red("error") + " " + err.message);
        process.exitCode = 1;
      }
    });

  wallet
    .command("balance")
    .description("check wallet balance via api.query.system.account")
    .option("-n, --name <name>", "wallet name to query")
    .option("--wallets <value>", "wallet names or ss58 addresses (comma-separated)")
    .option("--network <network>", "network: finney or test")
    .action(async (opts) => {
      try {
        const wallets = listWallets();
        if (wallets.length === 0) {
          throw new Error("No wallets found. Create one with: btw wallet create --name my-wallet");
        }

        const input = await resolveBalanceInput(opts.wallets || opts.name, wallets);
        const targets = resolveBalanceTargets(wallets, input);
        const network = opts.network ? String(opts.network).toLowerCase() : undefined;
        const api = await getApi({ network });
        const decimals = api.registry.chainDecimals[0] ?? 12;
        const symbol = api.registry.chainTokens[0] ?? "UNIT";
        const unit = symbol === "TAO" ? "τ" : symbol;

        const rows = [];
        let totalFree = 0n;
        let totalStaked = 0n;

        for (const target of targets) {
          const account = await api.query.system.account(target.ss58Address);
          const data = account.data;
          const free = BigInt(data.free.toString());
          const staked = BigInt(data.reserved.toString());
          const total = free + staked;
          totalFree += free;
          totalStaked += staked;
          rows.push({
            name: target.name,
            address: target.ss58Address,
            free,
            staked,
            total,
          });
        }

        const totalAll = totalFree + totalStaked;
        const wName = 14;
        const wAddr = 49;
        const wVal = 14;
        const line = "━".repeat(wName + wAddr + wVal * 3 + 8);

        console.log("");
        console.log("Wallet Coldkey Balance");
        console.log(`Network: ${network || "default"}`);
        console.log("");
        console.log(
          `${pad("Wallet Name", wName)}  ${pad("Coldkey Address", wAddr)}  ${pad("Free Balance", wVal, true)}  ${pad("Staked Value", wVal, true)}  ${pad("Total Balance", wVal, true)}`,
        );
        console.log(line);
        for (const row of rows) {
          console.log(
            `${pad(row.name, wName)}  ${pad(row.address, wAddr)}  ${pad(`${formatFixed(row.free, decimals)} ${unit}`, wVal, true)}  ${pad(`${formatFixed(row.staked, decimals)} ${unit}`, wVal, true)}  ${pad(`${formatFixed(row.total, decimals)} ${unit}`, wVal, true)}`,
          );
        }
        console.log("");
        console.log(
          `${pad("Total Balance", wName + wAddr + 2)}  ${pad(`${formatFixed(totalFree, decimals)} ${unit}`, wVal, true)}  ${pad(`${formatFixed(totalStaked, decimals)} ${unit}`, wVal, true)}  ${pad(`${formatFixed(totalAll, decimals)} ${unit}`, wVal, true)}`,
        );
        console.log(line);
      } catch (err) {
        console.error(chalk.red("error") + " " + err.message);
        process.exitCode = 1;
      } finally {
        await disconnectApi();
      }
    });

  wallet.addHelpText(
    "after",
    `
Detailed usage:
  create   Create a new wallet from an existing mnemonic or generate one.
           If --name is missing in interactive mode, you will be prompted.
           If --words is missing in interactive mode, you will be prompted.
           Use --hide-mnemonic to prevent mnemonic output on console.

  list     Show all saved wallets from BTW_CONFIG_DIR.
  balance  Query free/staked/total balances from chain RPC.

Examples:
  $ btw wallet create --name alice
  $ btw wallet create --name alice --words 12
  $ btw wallet create --name alice --words 24 --hide-mnemonic
  $ btw wallet create --name import --mnemonic "word1 word2 ..."
  $ btw wallet list
  $ btw wallet balance --name alice
  $ btw wallet balance --wallets alice,bob --network test
  $ btw wallet balance --name alice --network finney
  $ btw wallet balance --name alice --network test
`,
  );
}
