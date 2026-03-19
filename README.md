# Bittensor Wallet

JavaScript CLI and client library for interacting with the **Bittensor** network: cryptographic identities, staking, and subnet workflows.

## Requirements

- **Node.js 20+** (see `.nvmrc`)

## Setup

```bash
npm install
```

## CLI

Run via npm or link globally:

```bash
npm run cli -- --help
npm run cli -- doctor
npm run cli -- wallet list
npm run cli -- config-path
```

After `npm link` (from this repo), use the `btw` command:

```bash
btw doctor
```

## Project layout

| Path | Purpose |
|------|---------|
| `bin/btw.js` | Executable entry (`btw`) |
| `src/cli.js` | Commander program + global hooks |
| `src/commands/` | Subcommands (`wallet`, `config`, …) |
| `src/lib/` | Shared helpers (`doctor`, future RPC) |
| `src/index.js` | Library exports for embedding |

## Next steps (implementation)

1. Add **`@polkadot/api`** (or your preferred Substrate stack) for chain RPC.
2. Implement **key storage** under `BTW_CONFIG_DIR` (default: `~/.config/bittensor-wallet`).
3. Map extrinsics for **stake / unstake / register** to your target runtime metadata.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run cli` | Run CLI with args after `--` |
| `npm run lint` | ESLint |
| `npm test` | Node test runner (add tests under `test/`) |

## License

MIT
