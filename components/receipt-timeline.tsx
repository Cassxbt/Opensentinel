import type { Receipt } from "@/lib/types";

export function ReceiptTimeline({ receipts }: { receipts: Receipt[] }) {
  return (
    <section className="dashboard-card space-y-6">
      <div className="space-y-3">
        <p className="eyebrow">Receipts Timeline</p>
        <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
          Execution ledger
        </h2>
        <p className="max-w-lg text-sm leading-7 text-[var(--text-dim)]">
          Every generated receipt captures the wallet context, execution mode,
          and action trail the judges can inspect.
        </p>
      </div>

      <div className="receipt-stack">
        {receipts.map((receipt) => (
          <article key={receipt.id} className="receipt-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.02em] text-[var(--text-primary)]">
                  {receipt.headline}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  {new Date(receipt.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="badge-live">{receipt.mode}</span>
            </div>

            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-dim)]">
              {receipt.narrative.map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>

            {receipt.walletName || receipt.walletAddress ? (
              <div className="mt-4 rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
                <p className="receipt-label">Wallet context</p>
                <p className="mt-2 text-sm text-[var(--text-primary)]">
                  {receipt.walletName ?? "MoonPay local wallet"}
                </p>
                <p className="mt-1 break-all text-xs text-[var(--text-dim)]">
                  {receipt.walletAddress}
                </p>
                {receipt.counterpartyDisplay ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Counterparty / {receipt.counterpartyDisplay}
                  </p>
                ) : null}
              </div>
            ) : null}

            {receipt.policyArtifact ? (
              <div className="mt-4 rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
                <p className="receipt-label">OWS-aligned policy export</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-dim)]">
                  {receipt.policyArtifact.standard} for {receipt.policyArtifact.walletName}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {receipt.policyArtifact.policyTypes.map((item) => (
                    <span key={item.name} className="policy-pill">
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {receipt.executionSteps && receipt.executionSteps.length > 0 ? (
              <div className="mt-4 space-y-3">
                {receipt.executionSteps.map((step) => (
                  <div
                    key={step.stepId}
                    className="rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.022)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="receipt-label">
                          {step.type} / {step.stepId}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[var(--text-dim)]">
                          {step.detail}
                        </p>
                      </div>
                      <span
                        className={
                          step.status === "executed"
                            ? "badge-ok"
                            : step.status === "failed" || step.status === "blocked"
                              ? "badge-blocked"
                              : "badge-live"
                        }
                      >
                        {step.status}
                      </span>
                    </div>
                    <code className="hash-chip mt-4 block break-all text-left">
                      {step.command}
                    </code>
                    {step.txHashes.length > 0 ? (
                      <div className="receipt-hashes mt-4">
                        {step.txHashes.map((hash) => (
                          <code key={hash} className="hash-chip">
                            {hash}
                          </code>
                        ))}
                      </div>
                    ) : null}
                    {step.rawResult ? (
                      <p className="mt-4 text-xs leading-6 text-[var(--text-muted)]">
                        {step.rawResult}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {receipt.txHashes.length > 0 ? (
              <div className="receipt-hashes mt-4">
                {receipt.txHashes.map((hash) => (
                  <code key={hash} className="hash-chip">
                    {hash}
                  </code>
                ))}
              </div>
            ) : receipt.mode === "simulated" ? (
              <div className="mt-4 rounded-[18px] border border-[var(--line)] bg-[rgba(255,255,255,0.022)] px-4 py-4">
                <p className="receipt-label">Execution evidence</p>
                <p className="mt-2 text-sm leading-7 text-[var(--text-dim)]">
                  This receipt records policy, wallet context, and prepared
                  MoonPay commands without claiming an onchain transaction hash.
                </p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
