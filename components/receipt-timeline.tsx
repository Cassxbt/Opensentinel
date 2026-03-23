import type { Receipt } from "@/lib/types";

export function ReceiptTimeline({ receipts }: { receipts: Receipt[] }) {
  if (receipts.length === 0) return null;

  return (
    <div>
      <div className="log-section-head">execution ledger</div>
      {receipts.map((receipt) => (
        <div key={receipt.id} className="log-receipt-block">
          <div className="log-receipt-head">
            <span className="log-receipt-headline">{receipt.headline}</span>
            <span className="log-receipt-ts">
              {new Date(receipt.createdAt).toLocaleTimeString()}
            </span>
            <span style={{
              fontSize: "0.62rem",
              color: receipt.mode === "live" ? "var(--green)" : "var(--amber)",
            }}>
              {receipt.mode}
            </span>
          </div>

          <div className="log-receipt-narrative">
            {receipt.narrative.map((line) => (
              <div key={line}>— {line}</div>
            ))}
          </div>

          {(receipt.walletName ?? receipt.walletAddress) && (
            <div className="log-receipt-wallet">
              {receipt.walletName}
              {receipt.counterpartyDisplay ? ` → ${receipt.counterpartyDisplay}` : ""}
              {receipt.walletAddress && (
                <div style={{ marginTop: "0.1rem", fontSize: "0.62rem" }}>
                  {receipt.walletAddress}
                </div>
              )}
            </div>
          )}

          {receipt.txHashes.length > 0
            ? receipt.txHashes.map((hash) => (
                <code key={hash} className="log-hash">{hash}</code>
              ))
            : receipt.mode === "simulated" && (
                <div style={{ marginTop: "0.35rem", fontSize: "0.66rem", color: "var(--dim)" }}>
                  — simulated: policy + wallet context captured, no on-chain hash claimed
                </div>
              )}
        </div>
      ))}
    </div>
  );
}
