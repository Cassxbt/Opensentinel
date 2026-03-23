import type { CommandPlan } from "@/lib/types";

type ResearchToken = {
  aliases: string[];
  coingeckoId: string;
  symbol: string;
  name: string;
};

type CoinGeckoPricePayload = Record<
  string,
  {
    usd?: number;
    usd_24h_change?: number;
  }
>;

const supportedResearchTokens: ResearchToken[] = [
  {
    aliases: ["eth", "ethereum"],
    coingeckoId: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
  },
  {
    aliases: ["weth", "wrapped eth", "wrapped ethereum"],
    coingeckoId: "weth",
    symbol: "WETH",
    name: "Wrapped Ether",
  },
  {
    aliases: ["usdc", "usd coin"],
    coingeckoId: "usd-coin",
    symbol: "USDC",
    name: "USD Coin",
  },
  {
    aliases: ["sol", "solana"],
    coingeckoId: "solana",
    symbol: "SOL",
    name: "Solana",
  },
  {
    aliases: ["btc", "bitcoin"],
    coingeckoId: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
  },
  {
    aliases: ["bonk"],
    coingeckoId: "bonk",
    symbol: "BONK",
    name: "BONK",
  },
];

const priceKeywords = [
  "price",
  "prices",
  "worth",
  "quote",
  "trending",
  "safe",
  "risk",
];

const capabilityKeywords = [
  "capabilities",
  "what can you do",
  "what do you do",
  "what are your capabilities",
  "help",
];

function hasKeyword(prompt: string, keywords: string[]) {
  return keywords.some((keyword) => prompt.includes(keyword));
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 2 : 4,
  }).format(value);
}

function formatChange(change: number | undefined) {
  if (typeof change !== "number" || Number.isNaN(change)) return "24h n/a";
  const prefix = change >= 0 ? "+" : "";
  return `24h ${prefix}${change.toFixed(2)}%`;
}

function createStaticResearchPlan(rawPrompt: string, agentResponse: string): CommandPlan {
  return {
    rawPrompt,
    normalizedPrompt: rawPrompt.trim().toLowerCase(),
    intent: "research",
    confidence: "high",
    steps: [],
    thinking:
      "This input is read-only. I should answer directly instead of producing wallet execution steps.",
    agentResponse,
  };
}

function extractTokens(prompt: string) {
  const matches: ResearchToken[] = [];

  for (const token of supportedResearchTokens) {
    if (token.aliases.some((alias) => prompt.includes(alias))) {
      matches.push(token);
    }
  }

  return matches.filter(
    (token, index, current) =>
      current.findIndex((candidate) => candidate.coingeckoId === token.coingeckoId) === index,
  );
}

async function fetchCoinGeckoPrices(tokens: ResearchToken[]) {
  const ids = tokens.map((token) => token.coingeckoId).join(",");
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`,
    {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 30 },
    },
  );

  if (!response.ok) {
    throw new Error(`CoinGecko price request failed with ${response.status}`);
  }

  return (await response.json()) as CoinGeckoPricePayload;
}

async function buildPriceResponse(tokens: ResearchToken[]) {
  const market = await fetchCoinGeckoPrices(tokens);
  const lines = tokens.map((token) => {
    const entry = market[token.coingeckoId];
    if (!entry || typeof entry.usd !== "number") {
      return `${token.symbol} — live quote unavailable right now`;
    }

    return `${token.symbol} (${token.name}) — ${formatUsd(entry.usd)} · ${formatChange(entry.usd_24h_change)}`;
  });

  return `${lines.join("\n")}\n\nLive market snapshot sourced from a public market data feed.`;
}

export function looksLikeResearchPrompt(rawPrompt: string) {
  const prompt = rawPrompt.trim().toLowerCase();
  if (!prompt) return false;

  return hasKeyword(prompt, capabilityKeywords) || hasKeyword(prompt, priceKeywords);
}

export async function resolveResearchPlan(rawPrompt: string) {
  const prompt = rawPrompt.trim().toLowerCase();

  if (!prompt) {
    return createStaticResearchPlan(rawPrompt, "Ask about a token price or describe a wallet action.");
  }

  if (hasKeyword(prompt, capabilityKeywords)) {
    return createStaticResearchPlan(
      rawPrompt,
      [
        "I handle transfers, swaps, bridges, and DCA plan creation inside a policy-bound wallet.",
        "I can also answer live token price questions before you decide whether to act.",
        "For money-moving actions, I always route through planning, policy checks, and explicit execution review.",
      ].join("\n"),
    );
  }

  const tokens = extractTokens(prompt);
  if (tokens.length === 0) {
    return createStaticResearchPlan(
      rawPrompt,
      "I can answer live price questions for ETH, WETH, USDC, SOL, BTC, and BONK right now. Ask for the token directly, for example: 'what is ETH price and SOL price?'",
    );
  }

  try {
    return createStaticResearchPlan(rawPrompt, await buildPriceResponse(tokens));
  } catch {
    return createStaticResearchPlan(
      rawPrompt,
      "I recognized this as a market-data request, but the live price source is unavailable right now. Try again in a moment or continue with a wallet action.",
    );
  }
}
