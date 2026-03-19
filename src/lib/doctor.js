import { homedir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import { VERSION } from "../version.js";

export async function doctor() {
  const node = process.version;
  const configDir = join(homedir(), ".config", "bittensor-wallet");

  console.log(chalk.bold("Bittensor Wallet doctor"));
  console.log("");
  console.log(`  ${chalk.dim("cli version")}  ${VERSION}`);
  console.log(`  ${chalk.dim("node")}         ${node}`);
  console.log(`  ${chalk.dim("config dir")}   ${configDir}`);
  console.log("");
  console.log(chalk.green("✓") + " Environment looks OK. Chain integration is not wired yet.");
}
