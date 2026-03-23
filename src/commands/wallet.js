import chalk from "chalk";
import { createInterface } from "node:readline/promises";
import { createWallet, listWallets } from "../lib/wallets.js";

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

export function registerWalletCommands(program) {
  const wallet = program.command("wallet").description("key and account operations");

  wallet
    .command("create")
    .description("create wallet from mnemonic (or generate one)")
    .option("-n, --name [name]", "wallet name (unique)")
    .option("-m, --mnemonic <mnemonic>", "existing 12/15/18/21/24-word mnemonic")
    .option("-w, --words <count>", "generated mnemonic words: 12, 15, 18, 21, or 24")
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
          console.log("");
          console.log(chalk.yellow("Save this mnemonic now. It is shown only once:"));
          console.log(result.mnemonic);
        }
      } catch (err) {
        console.error(chalk.red("error") + " " + err.message);
        process.exitCode = 1;
      }
    });

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
}
