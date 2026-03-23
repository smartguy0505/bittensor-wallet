import chalk from "chalk";
import { getConfigDir } from "../lib/wallets.js";

export function registerConfigCommands(program) {
  program
    .command("config-path")
    .description("print default config directory")
    .action(() => {
      const dir = getConfigDir();
      console.log(dir);
      console.log(chalk.dim("Set BTW_CONFIG_DIR to override."));
    });
}
