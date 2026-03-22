import type { Policy, WalletRuntime } from "@/lib/types";

export function WalletStatus({
  policy,
  wallet,
}: {
  policy: Policy;
  wallet: WalletRuntime | null;
}) {
  const activeHoldings =
    wallet?.balances?.filter((entry) => Number(entry.amount) > 0) ?? [];

  return (
    <section className="dashboard-card space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Wallet runtime</p>
        <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
          Dedicated MoonPay demo wallet
        </h2>
        <p className="text-sm leading-7 text-[var(--text-dim)]">
          Open Sentinel is anchored to a local MoonPay wallet and uses MoonPay
          CLI as the action rail for payments, bridges, and swaps. The wallet
          only proceeds after policy review and execution preparation clear.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="insight-card">
          <p className="label">Wallet</p>
          <p className="value">{wallet?.walletName ?? "Loading local wallet"}</p>
          <p className="mt-3 break-all text-sm leading-6 text-[var(--text-dim)]">
            {wallet?.walletAddress ?? "Resolving wallet address"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="policy-pill">{wallet?.executionMode ?? "simulated"}</span>
            <span className="policy-pill">local wallet</span>
            <span className="policy-pill">{wallet?.authStatus ?? "unknown auth"}</span>
          </div>
        </div>
        <div className="insight-card">
          <p className="label">Approval perimeter</p>
          <p className="value">${policy.manualApprovalThresholdUsd}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
            Commands above this threshold require explicit human review even if
            every other rule passes.
          </p>
        </div>
      </div>

      <div className="understanding-grid">
        <div className="insight-card">
          <p className="label">Daily ceiling</p>
          <p className="value">${policy.dailySpendUsd}</p>
        </div>
        <div className="insight-card">
          <p className="label">Agent can do</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="policy-pill">pay</span>
            <span className="policy-pill">bridge</span>
            <span className="policy-pill">swap</span>
            <span className="policy-pill">dca</span>
            <span className="policy-pill">resolve ENS</span>
          </div>
        </div>
      </div>

      <div className="insight-card">
        <p className="label">MoonPay account status</p>
        <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
          {wallet?.readiness === "ready"
            ? "Authenticated wallet checks are live and the wallet is funded enough to proceed with real CLI actions."
            : wallet?.readiness === "needs-funding"
              ? "Authentication is working. The remaining live-execution gate is funding this wallet with the assets needed for the demo path."
              : wallet?.readiness === "auth-required"
                ? "The wallet exists locally, but authenticated MoonPay execution still requires a valid session."
                : "The wallet is available locally. Execution is still being prepared before any live money movement."}
        </p>
      </div>

      <div className="insight-card">
        <p className="label">Wallet readiness</p>
        <p className="value">{wallet?.readiness ?? "loading"}</p>
        <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
          Last checked {wallet?.lastCheckedAt ? new Date(wallet.lastCheckedAt).toLocaleTimeString() : "just now"}.
        </p>
      </div>

      <div className="insight-card">
        <p className="label">Visible balances</p>
        {activeHoldings.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeHoldings.map((entry) => (
              <span
                key={`${entry.chain}-${entry.tokenAddress}`}
                className="policy-pill"
              >
                {entry.chain} {entry.tokenSymbol} {entry.amount}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
            No funded balances detected yet across Base, Ethereum, or Arbitrum.
          </p>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="insight-card">
          <p className="label">Track fit</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="policy-pill">ows wallet layer</span>
            <span className="policy-pill">moonpay cli route</span>
            <span className="policy-pill">bounded payments</span>
          </div>
        </div>
        <div className="insight-card">
          <p className="label">Judge takeaway</p>
          <p className="mt-3 text-sm leading-7 text-[var(--text-dim)]">
            The agent can pay, bridge, swap, and stage DCA plans, but only
            after the wallet perimeter, dry-run, and MoonPay execution path all
            clear.
          </p>
        </div>
      </div>
    </section>
  );
}
