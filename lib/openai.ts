import { createCommandPlan } from "@/lib/command-parser";
import type { CommandPlan, CommandStep } from "@/lib/types";

const plannerSchema = {
  name: "open_sentinel_command_plan",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      rawPrompt: { type: "string" },
      normalizedPrompt: { type: "string" },
      intent: { type: "string", enum: ["bridge", "swap", "dca", "transfer"] },
      confidence: { type: "string", enum: ["high", "medium"] },
      steps: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            type: {
              type: "string",
              enum: ["bridge", "swap", "dca", "transfer"],
            },
            summary: { type: "string" },
            amountUsd: { type: "number" },
            tokenIn: { type: "string", enum: ["USDC", "ETH", "WETH"] },
            tokenOut: {
              anyOf: [
                { type: "string", enum: ["USDC", "ETH", "WETH"] },
                { type: "null" },
              ],
            },
            sourceChain: {
              type: "string",
              enum: ["base", "ethereum", "arbitrum"],
            },
            destinationChain: {
              type: "string",
              enum: ["base", "ethereum", "arbitrum"],
            },
            destinationLabel: { type: "string" },
            destinationAddress: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
          },
          required: [
            "id",
            "type",
            "summary",
            "amountUsd",
            "tokenIn",
            "tokenOut",
            "sourceChain",
            "destinationChain",
            "destinationLabel",
            "destinationAddress",
          ],
        },
      },
    },
    required: ["rawPrompt", "normalizedPrompt", "intent", "confidence", "steps"],
  },
} as const;

function extractStructuredText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const output = (payload as { output?: unknown[] }).output;
  if (!Array.isArray(output)) return null;

  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown[] }).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      if ((block as { type?: string }).type === "output_text") {
        const text = (block as { text?: string }).text;
        if (typeof text === "string" && text.trim()) return text;
      }
    }
  }

  return null;
}

function canonicalDestinationLabel(step: CommandStep) {
  if (step.type === "bridge") return "MoonPay route";
  if (step.type === "swap") return "Agent execution wallet";
  if (step.type === "dca") return "DCA strategy";
  if (step.destinationAddress?.endsWith(".eth")) return step.destinationAddress;
  return step.destinationLabel || "Approved payout";
}

function sanitizePlan(plan: CommandPlan, rawPrompt: string): CommandPlan {
  let stagedUsd = 0;

  return {
    ...plan,
    rawPrompt,
    normalizedPrompt: plan.normalizedPrompt.toLowerCase(),
    steps: plan.steps.map((step, index) => {
      if (step.type === "bridge") {
        stagedUsd = step.amountUsd;
      }

      const normalizedAmount =
        step.type === "dca" && step.amountUsd <= 0 ? stagedUsd || 80 : step.amountUsd;

      const normalizedTokenIn =
        step.type === "dca" ? "USDC" : step.tokenIn;

      const normalizedStep: CommandStep = {
        ...step,
        id: step.id || `step${index + 1}`,
        amountUsd: normalizedAmount,
        tokenIn: normalizedTokenIn,
        destinationLabel: canonicalDestinationLabel(step),
        destinationAddress: step.destinationAddress ?? undefined,
        tokenOut:
          step.type === "dca"
            ? step.tokenOut ?? "ETH"
            : step.tokenOut ?? undefined,
      };

      return normalizedStep;
    }),
  };
}

export async function planWithOpenAI(rawPrompt: string): Promise<CommandPlan> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return createCommandPlan(rawPrompt);
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You are the Open Sentinel wallet planner. Convert natural-language wallet commands into strict JSON. Be conservative. Use transfer for direct payments, bridge for chain movement, swap for token conversions, and dca for creating a scheduled buy plan. Never invent unsupported chains or tokens. When a prompt contains multiple actions, emit one step per action in the original order. For DCA, keep tokenIn as USDC unless the user explicitly says otherwise. Use destination labels that fit these buckets: MoonPay route, Agent execution wallet, DCA strategy, or the exact ENS/identity being paid.",
        },
        {
          role: "user",
          content: `Return JSON for this wallet instruction: ${rawPrompt}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          ...plannerSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    return createCommandPlan(rawPrompt);
  }

  const payload = (await response.json()) as unknown;
  const text = extractStructuredText(payload);
  if (!text) {
    return createCommandPlan(rawPrompt);
  }

  try {
    const parsed = JSON.parse(text) as CommandPlan;
    return sanitizePlan(parsed, rawPrompt);
  } catch {
    return createCommandPlan(rawPrompt);
  }
}
