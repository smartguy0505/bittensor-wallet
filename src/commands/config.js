import chalk from "chalk";
import { homedir } from "node:os";
import { join } from "node:path";

export function registerConfigCommands(program) {
  program
    .command("config-path")
    .description("print default config directory")
    .action(() => {
      const dir = join(homedir(), ".config", "bittensor-wallet");
      console.log(dir);
      console.log(chalk.dim("Set BTW_CONFIG_DIR to override."));
    });
}
