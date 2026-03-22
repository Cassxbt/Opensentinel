import { createPublicClient, getAddress, http, isAddress, type Hex } from "viem";
import { mainnet } from "viem/chains";

export type ResolvedCounterparty = {
  input: string;
  displayName: string;
  address: string | null;
  trustStatus: "allowlisted" | "resolved" | "unverified";
  reason: string;
};

const knownCounterparties: Record<string, { address: string; reason: string }> = {
  "research-agent.eth": {
    address: "0xA12f000000000000000000000000000000009b31",
    reason: "Known demo agent profile stored in Open Sentinel.",
  },
  "ops-agent.eth": {
    address: "0xB45e0000000000000000000000000000000017cc",
    reason: "Known demo operations agent stored in Open Sentinel.",
  },
};

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.ENS_RPC_URL ?? "https://ethereum-rpc.publicnode.com",
    {
      timeout: 5_000,
    },
  ),
});

export async function resolveCounterparty(input: string): Promise<ResolvedCounterparty> {
  const normalized = input.trim().toLowerCase();
  if (!normalized) {
    return {
      input,
      displayName: "Unknown counterparty",
      address: null,
      trustStatus: "unverified",
      reason: "No counterparty was provided.",
    };
  }

  if (normalized in knownCounterparties) {
    const known = knownCounterparties[normalized];
    return {
      input,
      displayName: normalized,
      address: known.address,
      trustStatus: "allowlisted",
      reason: known.reason,
    };
  }

  if (isAddress(input)) {
    return {
      input,
      displayName: "Direct address",
      address: getAddress(input as Hex),
      trustStatus: "resolved",
      reason: "Direct address provided by the user.",
    };
  }

  if (normalized.endsWith(".eth")) {
    try {
      const address = await publicClient.getEnsAddress({ name: normalized });
      return {
        input,
        displayName: normalized,
        address: address ? getAddress(address) : null,
        trustStatus: address ? "resolved" : "unverified",
        reason: address
          ? "Resolved via ENS at request time."
          : "ENS name did not resolve.",
      };
    } catch {
      return {
        input,
        displayName: normalized,
        address: null,
        trustStatus: "unverified",
        reason: "ENS lookup failed. The name may be invalid or the resolver was unavailable.",
      };
    }
  }

  return {
    input,
    displayName: input,
    address: null,
    trustStatus: "unverified",
    reason: "Counterparty is not allowlisted and did not resolve as ENS or a direct address.",
  };
}
