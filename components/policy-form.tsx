"use client";

import type { Policy, SupportedChain, SupportedToken } from "@/lib/types";

const availableChains: SupportedChain[] = ["base", "ethereum", "arbitrum"];
const availableTokens: SupportedToken[] = ["USDC", "ETH", "WETH"];

export function PolicyForm({
  policy,
  onChange,
}: {
  policy: Policy;
  onChange: (policy: Policy) => void;
}) {
  function toggleChain(chain: SupportedChain) {
    onChange({
      ...policy,
      allowedChains: policy.allowedChains.includes(chain)
        ? policy.allowedChains.filter((entry) => entry !== chain)
        : [...policy.allowedChains, chain],
    });
  }

  function toggleToken(token: SupportedToken) {
    onChange({
      ...policy,
      allowedTokens: policy.allowedTokens.includes(token)
        ? policy.allowedTokens.filter((entry) => entry !== token)
        : [...policy.allowedTokens, token],
    });
  }

  return (
    <section className="dashboard-card space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Policy Setup</p>
        <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
          Wallet boundary
        </h2>
        <p className="text-sm leading-7 text-[var(--text-dim)]">
          The agent is only useful if the limits are legible. These settings
          define what the wallet may do before the dry-run can clear.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--text-dim)]">
          Daily spend limit (USD)
          <input
            className="input-shell"
            type="number"
            value={policy.dailySpendUsd}
            onChange={(event) =>
              onChange({ ...policy, dailySpendUsd: Number(event.target.value) })
            }
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--text-dim)]">
          Manual approval threshold (USD)
          <input
            className="input-shell"
            type="number"
            value={policy.manualApprovalThresholdUsd}
            onChange={(event) =>
              onChange({
                ...policy,
                manualApprovalThresholdUsd: Number(event.target.value),
              })
            }
          />
        </label>
      </div>

      <div className="space-y-3">
        <p className="eyebrow">
          Allowed chains
        </p>
        <div className="flex flex-wrap gap-2">
          {availableChains.map((chain) => (
            <button
              key={chain}
              className="policy-pill"
              type="button"
              onClick={() => toggleChain(chain)}
            >
              <span>{policy.allowedChains.includes(chain) ? "•" : "○"}</span>
              {chain}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="eyebrow">
          Allowed tokens
        </p>
        <div className="flex flex-wrap gap-2">
          {availableTokens.map((token) => (
            <button
              key={token}
              className="policy-pill"
              type="button"
              onClick={() => toggleToken(token)}
            >
              <span>{policy.allowedTokens.includes(token) ? "•" : "○"}</span>
              {token}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
