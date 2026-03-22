import type { Policy, WalletRuntime } from "@/lib/types";

export function WalletStatus({
  policy,
  wallet,
}: {
  policy: Policy;
  wallet: WalletRuntime | null;
}) {
  return (
    <section className="dashboard-card space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Wallet runtime</p>
        <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
          Dedicated MoonPay demo wallet
        </h2>
        <p className="text-sm leading-7 text-[var(--text-dim)]">
          Open Sentinel is anchored to a local MoonPay wallet in simulated
          mode. The demo still shows real wallet boundaries, agent planning,
          and receipt-grade execution review.
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
          Local wallet creation and retrieval work without account login.
          Account-backed user endpoints are still gated, so the demo is framed
          honestly around the local wallet runtime.
        </p>
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
            after the wallet perimeter and dry-run both clear.
          </p>
        </div>
      </div>
    </section>
  );
}
