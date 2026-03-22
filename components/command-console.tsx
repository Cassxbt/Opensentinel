"use client";

const examples = [
  "Send 45 USDC to research-agent.eth for research ops.",
  "Bridge 80 USDC to Base, then create a 5 day DCA plan into ETH.",
  "Swap 30 USDC into ETH on Base if policy allows.",
];

export function CommandConsole({
  prompt,
  onPromptChange,
  pending,
  counterparty,
}: {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  pending: boolean;
  counterparty: {
    displayName: string;
    address: string | null;
    trustStatus: "allowlisted" | "resolved" | "unverified";
    reason: string;
  } | null;
}) {
  return (
    <section className="dashboard-panel console-stage space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Command Stage</p>
          <h2 className="mt-2 text-2xl font-semibold uppercase tracking-[-0.04em]">
            Describe the wallet objective once
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-dim)]">
            The planner turns one instruction into a structured action chain,
            then the policy engine decides whether the wallet is allowed to act.
          </p>
        </div>
        <span className="badge-live">{pending ? "Refreshing" : "Planner live"}</span>
      </div>

      <textarea
        className="textarea-shell"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
      />

      <div className="space-y-3">
        <p className="eyebrow">Prompt examples</p>
        <div className="examples-row">
          {examples.map((example) => (
            <button
              key={example}
              className="example-chip"
              type="button"
              onClick={() => onPromptChange(example)}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {counterparty ? (
        <div className="understanding-grid">
          <div className="insight-card">
            <p className="label">Agent understanding</p>
            <p className="value">{counterparty.displayName}</p>
          </div>
          <div className="insight-card">
            <p className="label">Resolved address</p>
            <p className="value break-all text-sm">
              {counterparty.address ?? "No resolved address available"}
            </p>
          </div>
          <div className="insight-card">
            <p className="label">Trust status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="policy-pill">{counterparty.trustStatus}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-dim)]">
              {counterparty.reason}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
