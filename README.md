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
| `npm test` | Node test runner (all `test/**/*.test.js` via `scripts/run-tests.mjs`) |

## Publishing to npm (GitHub Actions)

The workflow [`.github/workflows/publish-npm.yml`](.github/workflows/publish-npm.yml) runs when you **publish a GitHub Release** (not a draft). It runs `lint`, `test`, then `npm publish` with [provenance](https://docs.npmjs.com/generating-provenance-statements).

1. Bump `"version"` in `package.json` and push to the default branch.
2. Create and push a matching tag (e.g. `git tag v0.0.2 && git push origin v0.0.2`).
3. On GitHub: **Releases → Draft a new release** → choose that tag → **Publish release**.
4. In the repo: **Settings → Secrets and variables → Actions** → add **`NPM_TOKEN`** (an [npm automation token](https://www.npmjs.com/settings/~/tokens)).

If publish fails on `--provenance`, remove that flag from the workflow or ensure your npm account/registry setup supports provenance from GitHub Actions.

## License

MIT
