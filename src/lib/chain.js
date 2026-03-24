import { ApiPromise, WsProvider } from "@polkadot/api";

let apiInstance;
let providerInstance;
let currentEndpoint;

export function resolveEndpoint(network) {
  const selected = (network || "").toLowerCase();
  if (selected && !["finney", "test"].includes(selected)) {
    throw new Error(`Unsupported network "${network}". Use "finney" or "test".`);
  }

  if (selected === "finney") {
    return process.env.BTW_FINNEY_WS_URL || "wss://entrypoint-finney.opentensor.ai:443";
  }
  if (selected === "test") {
    return process.env.BTW_TEST_WS_URL || "wss://test.finney.opentensor.ai:443";
  }

  return process.env.CHAIN_ENDPOINT || process.env.BTW_WS_URL || "ws://127.0.0.1:9944";
}

export async function getApi({ network } = {}) {
  const endpoint = resolveEndpoint(network);

  if (apiInstance && endpoint === currentEndpoint) {
    return apiInstance;
  }
  if (apiInstance && endpoint !== currentEndpoint) {
    await disconnectApi();
  }

  providerInstance = new WsProvider(endpoint);
  apiInstance = await ApiPromise.create({
    provider: providerInstance,
    // Suppress noisy initialization warnings (unknown signed extensions / missing RPC decorations).
    noInitWarn: true,
  });
  currentEndpoint = endpoint;
  return apiInstance;
}

export async function disconnectApi() {
  try {
    if (apiInstance) {
      await apiInstance.disconnect();
    } else if (providerInstance) {
      await providerInstance.disconnect();
    }
  } finally {
    apiInstance = undefined;
    providerInstance = undefined;
    currentEndpoint = undefined;
  }
}

export function formatBalance(raw, decimals) {
  const value = BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const frac = value % base;
  if (frac === 0n) {
    return `${whole}`;
  }
  const fracText = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${whole}.${fracText}`;
}
