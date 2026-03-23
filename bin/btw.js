#!/usr/bin/env node
/**
 * Bittensor Wallet CLI entrypoint.
 */
import { loadEnv } from "../src/lib/env.js";
import { runCli } from "../src/cli.js";

loadEnv();
runCli(process.argv);
