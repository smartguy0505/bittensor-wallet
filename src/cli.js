import { Command } from "commander";
import chalk from "chalk";
import { VERSION } from "./version.js";
import { registerWalletCommands } from "./commands/wallet.js";
import { registerConfigCommands } from "./commands/config.js";

export function runCli(argv) {
  const program = new Command();

  program
    .name("btw")
    .description("Bittensor Wallet — manage keys, stake, and interact with subnets")
    .version(VERSION, "-V, --version", "print version")
    .option("-v, --verbose", "verbose logging")
    .configureHelp({ sortSubcommands: true })
    .showHelpAfterError("(add --help for usage)");

  program
    .command("doctor")
    .description("check runtime (Node version, config paths)")
    .action(async () => {
      const { doctor } = await import("./lib/doctor.js");
      await doctor();
    });

  registerWalletCommands(program);
  registerConfigCommands(program);

  program.hook("preAction", (thisCommand) => {
    const opts =
      typeof thisCommand.optsWithGlobals === "function"
        ? thisCommand.optsWithGlobals()
        : thisCommand.opts();
    if (opts.verbose) {
      process.env.BTW_VERBOSE = "1";
    }
  });

  program.parse(argv);
}

export function logInfo(msg) {
  console.log(chalk.cyan("info") + "  " + msg);
}

export function logWarn(msg) {
  console.warn(chalk.yellow("warn") + "  " + msg);
}

export function logError(msg) {
  console.error(chalk.red("error") + " " + msg);
}
