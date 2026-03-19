import chalk from "chalk";

export function registerWalletCommands(program) {
  const wallet = program.command("wallet").description("key and account operations");

  wallet
    .command("list")
    .description("list known coldkeys / hotkeys (placeholder)")
    .action(() => {
      console.log(chalk.dim("No keys indexed yet. Implement storage + Substrate keyring next."));
    });
}
