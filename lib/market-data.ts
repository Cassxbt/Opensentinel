import type { CommandPlan } from "@/lib/types";

type ResearchToken = {
  aliases: string[];
  coingeckoId: string;
  symbol: string;
  name: string;
  binanceSymbol?: string;
  coinbaseProduct?: string;
};

type CoinGeckoPricePayload = Record<string, { usd?: number; usd_24h_change?: number }>;
type MarketQuote = {
  usd: number;
  change24h?: number;
};

const supportedResearchTokens: ResearchToken[] = [
  {
    aliases: ["eth", "ethereum"],
    coingeckoId: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    binanceSymbol: "ETHUSDT",
    coinbaseProduct: "ETH-USD",
  },
  {
    aliases: ["weth", "wrapped eth", "wrapped ethereum"],
    coingeckoId: "weth",
    symbol: "WETH",
    name: "Wrapped Ether",
    binanceSymbol: "ETHUSDT",
    coinbaseProduct: "ETH-USD",
  },
  {
    aliases: ["usdc", "usd coin"],
    coingeckoId: "usd-coin",
    symbol: "USDC",
    name: "USD Coin",
    binanceSymbol: "USDCUSDT",
    coinbaseProduct: "USDC-USD",
  },
  {
    aliases: ["sol", "solana"],
    coingeckoId: "solana",
    symbol: "SOL",
    name: "Solana",
    binanceSymbol: "SOLUSDT",
    coinbaseProduct: "SOL-USD",
  },
  {
    aliases: ["btc", "bitcoin"],
    coingeckoId: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    binanceSymbol: "BTCUSDT",
    coinbaseProduct: "BTC-USD",
  },
  {
    aliases: ["bnb", "binance coin", "binance"],
    coingeckoId: "binancecoin",
    symbol: "BNB",
    name: "BNB",
    binanceSymbol: "BNBUSDT",
  },
  {
    aliases: ["bonk"],
    coingeckoId: "bonk",
    symbol: "BONK",
    name: "BONK",
    binanceSymbol: "BONKUSDT",
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

const actionKeywords = [
  "send",
  "pay",
  "transfer",
  "bridge",
  "swap",
  "buy",
  "sell",
  "dca",
  "deposit",
  "withdraw",
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
  const normalizedPrompt = prompt.replaceAll("botcoin", "bitcoin");
  const matches: ResearchToken[] = [];

  for (const token of supportedResearchTokens) {
    if (token.aliases.some((alias) => normalizedPrompt.includes(alias))) {
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

async function fetchBinanceQuote(token: ResearchToken) {
  if (!token.binanceSymbol) return null;

  const response = await fetch(
    `https://api.binance.com/api/v3/ticker/24hr?symbol=${encodeURIComponent(token.binanceSymbol)}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    lastPrice?: string;
    priceChangePercent?: string;
  };
  const usd = Number(payload.lastPrice);
  const change24h = Number(payload.priceChangePercent);

  if (Number.isNaN(usd)) return null;

  return {
    usd,
    change24h: Number.isNaN(change24h) ? undefined : change24h,
  } satisfies MarketQuote;
}

async function fetchCoinbaseQuote(token: ResearchToken) {
  if (!token.coinbaseProduct) return null;

  const response = await fetch(
    `https://api.coinbase.com/v2/prices/${encodeURIComponent(token.coinbaseProduct)}/spot`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    data?: { amount?: string };
  };
  const usd = Number(payload.data?.amount);

  if (Number.isNaN(usd)) return null;

  return {
    usd,
  } satisfies MarketQuote;
}

async function fetchMarketQuotes(tokens: ResearchToken[]) {
  const quotes = new Map<string, MarketQuote>();

  try {
    const market = await fetchCoinGeckoPrices(tokens);
    for (const token of tokens) {
      const entry = market[token.coingeckoId];
      if (!entry || typeof entry.usd !== "number") continue;
      quotes.set(token.coingeckoId, {
        usd: entry.usd,
        change24h:
          typeof entry.usd_24h_change === "number" ? entry.usd_24h_change : undefined,
      });
    }
  } catch {
    // Fall through to public exchange endpoints.
  }

  for (const token of tokens) {
    if (quotes.has(token.coingeckoId)) continue;

    const binanceQuote = await fetchBinanceQuote(token);
    if (binanceQuote) {
      quotes.set(token.coingeckoId, binanceQuote);
      continue;
    }

    const coinbaseQuote = await fetchCoinbaseQuote(token);
    if (coinbaseQuote) {
      quotes.set(token.coingeckoId, coinbaseQuote);
    }
  }

  return quotes;
}

async function buildPriceResponse(tokens: ResearchToken[]) {
  const market = await fetchMarketQuotes(tokens);
  const lines = tokens.map((token) => {
    const entry = market.get(token.coingeckoId);
    if (!entry) {
      return `${token.symbol} — live quote unavailable right now`;
    }

    return `${token.symbol} (${token.name}) — ${formatUsd(entry.usd)} · ${formatChange(entry.change24h)}`;
  });

  return lines.join("\n");
}

export function looksLikeResearchPrompt(rawPrompt: string) {
  const prompt = rawPrompt.trim().toLowerCase();
  if (!prompt) return false;

  if (hasKeyword(prompt, capabilityKeywords) || hasKeyword(prompt, priceKeywords)) {
    return true;
  }

  if (hasKeyword(prompt, actionKeywords)) {
    return false;
  }

  const normalized = prompt.replace(/[^\w\s]/g, " ");
  const words = normalized.split(/\s+/).filter(Boolean);
  const tokens = extractTokens(prompt);

  return tokens.length > 0 && words.length <= 4;
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
        "I can:",
        "• send, swap, and bridge inside your wallet policy",
        "• create DCA plans with review before execution",
        "• answer live prices for ETH, SOL, BTC, BNB, USDC, WETH, and BONK",
      ].join("\n"),
    );
  }

  const tokens = extractTokens(prompt);
  if (tokens.length === 0) {
    return createStaticResearchPlan(
      rawPrompt,
      "I couldn't match that token to a live quote. Try ETH, SOL, BTC, BNB, USDC, WETH, or BONK.",
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
