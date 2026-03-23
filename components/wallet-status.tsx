import type { Policy, WalletRuntime } from "@/lib/types";

export function WalletStatus({
  policy,
  wallet,
}: {
  policy: Policy;
  wallet: WalletRuntime | null;
}) {
  const activeHoldings = wallet?.balances?.filter((e) => Number(e.amount) > 0) ?? [];
  const mode = wallet?.executionMode ?? "simulated";

  return (
    <>
      <div className="sidebar-section">
        <span className="sidebar-label">agent wallet</span>
        <div className="sidebar-value">{wallet?.walletName ?? "open-sentinel-demo"}</div>
        <div className="sidebar-addr">{wallet?.walletAddress ?? "resolving…"}</div>
        <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span className={mode === "live" ? "sidebar-badge sidebar-badge-live" : "sidebar-badge sidebar-badge-sim"}>
            {mode === "live" ? "live" : "dry-run"}
          </span>
          {wallet?.lastCheckedAt && (
            <span className="sidebar-dim">
              synced {new Date(wallet.lastCheckedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">spend limits</span>
        <div className="sidebar-row">
          <div>
            <div className="sidebar-dim">daily ceiling</div>
            <div className="sidebar-value" style={{ color: "var(--amber)" }}>${policy.dailySpendUsd}</div>
          </div>
          <div>
            <div className="sidebar-dim">approval at</div>
            <div className="sidebar-value" style={{ color: "var(--amber)" }}>${policy.manualApprovalThresholdUsd}</div>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-label">balances</span>
        {activeHoldings.length > 0 ? (
          activeHoldings.map((h) => (
            <div key={`${h.chain}-${h.tokenAddress}`} style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
              <span className="sidebar-dim">{h.chain} · <span style={{ color: "var(--cyan)" }}>{h.tokenSymbol}</span></span>
              <span className="sidebar-value">{h.amount}</span>
            </div>
          ))
        ) : (
          <div className="sidebar-dim" style={{ marginTop: "0.15rem" }}>no funded balances</div>
        )}
      </div>
    </>
  );
}
