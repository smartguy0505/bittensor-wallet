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
npm run cli -- wallet create --name alice
npm run cli -- wallet create --name alice --words 24
npm run cli -- wallet list
npm run cli -- wallet balance --name alice
npm run cli -- wallet balance --name alice --network finney
npm run cli -- wallet balance --name alice --network test
npm run cli -- wallet transfer --from alice --to 5F... --amount 0.1 --network finney
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

The workflow [`.github/workflows/publish-npm.yml`](.github/workflows/publish-npm.yml) runs when you **publish a GitHub Release** (not a draft). It runs `lint`, `test`, then `npm publish` using **[Trusted publishing](https://docs.npmjs.com/trusted-publishers)** (OIDC). No long-lived **`NPM_TOKEN`** is required.

### One-time: link npm ↔ GitHub Actions

1. On [npmjs.com](https://www.npmjs.com/) open your package → **Settings** → **Trusted publishing**.
2. Choose **GitHub Actions** and set:
   - **Repository** — `smartguy0505/bittensor-wallet` (owner/repo, exact match).
   - **Workflow filename** — `publish-npm.yml` (filename only, case-sensitive; must exist under `.github/workflows/`).
3. Save. npm does not validate until the next publish — double-check spelling.

The workflow already sets `permissions: id-token: write` and uses **Node 22** + **npm ≥ 11.5.1**, as required by npm for OIDC publishes. [Trusted publishing docs](https://docs.npmjs.com/trusted-publishers) · [GitHub OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

### Each release

1. Bump `"version"` in `package.json` and push to the default branch.
2. Create and push a matching tag (e.g. `git tag v0.0.7 && git push origin v0.0.7`).
3. On GitHub: **Releases → Draft a new release** → choose that tag → **Publish release**.

Provenance is attached automatically when publishing via trusted publishing from a **public** repo (no `--provenance` flag needed).

## Donations

If this project helps you, donations are appreciated (TAO on Bittensor network):

`5E1rxg2dEix2HVngqKXuBEWp8srMPU1fg9iWxqLFnmtt5XJm`

## License

MIT
