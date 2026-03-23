"use client";

import type { Policy, SupportedChain, SupportedToken } from "@/lib/types";

const availableChains: SupportedChain[] = ["base", "ethereum", "arbitrum"];
const availableTokens: SupportedToken[] = ["USDC", "ETH", "WETH"];

export function PolicyForm({
  policy,
  onChange,
}: {
  policy: Policy;
  onChange: (p: Policy) => void;
}) {
  function toggleChain(chain: SupportedChain) {
    onChange({
      ...policy,
      allowedChains: policy.allowedChains.includes(chain)
        ? policy.allowedChains.filter((c) => c !== chain)
        : [...policy.allowedChains, chain],
    });
  }

  function toggleToken(token: SupportedToken) {
    onChange({
      ...policy,
      allowedTokens: policy.allowedTokens.includes(token)
        ? policy.allowedTokens.filter((t) => t !== token)
        : [...policy.allowedTokens, token],
    });
  }

  return (
    <>
      <div className="sidebar-section">
        <span className="sidebar-label">policy</span>
        <div className="sidebar-row">
          <div className="sidebar-field">
            <span className="sidebar-dim">daily $</span>
            <input
              className="term-number-input"
              type="number"
              value={policy.dailySpendUsd}
              onChange={(e) => onChange({ ...policy, dailySpendUsd: Number(e.target.value) })}
            />
          </div>
          <div className="sidebar-field">
            <span className="sidebar-dim">approval $</span>
            <input
              className="term-number-input"
              type="number"
              value={policy.manualApprovalThresholdUsd}
              onChange={(e) =>
                onChange({ ...policy, manualApprovalThresholdUsd: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">allowed chains</span>
        <div className="term-toggle-row">
          {availableChains.map((chain) => (
            <button
              key={chain}
              className={`term-toggle ${policy.allowedChains.includes(chain) ? "active" : ""}`}
              type="button"
              onClick={() => toggleChain(chain)}
            >
              {policy.allowedChains.includes(chain) ? "[●]" : "[○]"} {chain}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">allowed tokens</span>
        <div className="term-toggle-row">
          {availableTokens.map((token) => (
            <button
              key={token}
              className={`term-toggle ${policy.allowedTokens.includes(token) ? "active" : ""}`}
              type="button"
              onClick={() => toggleToken(token)}
            >
              {policy.allowedTokens.includes(token) ? "[●]" : "[○]"} {token}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
