"use client";

const examples = [
  "Send 45 USDC to research-agent.eth for research ops.",
  "Bridge 80 USDC to Base, then create a 5 day DCA plan into ETH.",
  "Swap 30 USDC into ETH on Base if policy allows.",
  "What is current ETH price and SOL price?",
];

export function CommandConsole({
  prompt,
  onPromptChange,
  pending,
  onExecute,
}: {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  pending: boolean;
  onExecute: () => void;
}) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onExecute();
    }
  }

  return (
    <div>
      <div className="term-examples">
        {examples.map((example) => (
          <button
            key={example}
            className="term-example-chip"
            type="button"
            onClick={() => onPromptChange(example)}
          >
            {example}
          </button>
        ))}
      </div>
      <div className="term-input-row">
        <div className="term-input-container">
          <span className="term-prompt-marker">
            {pending ? <span className="term-pending-dot" /> : ">"}
          </span>
          <textarea
            className="term-textarea"
            value={prompt}
            rows={2}
            placeholder="describe the wallet action or ask for live token prices… (⌘Enter to execute)"
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          className="term-run-btn"
          type="button"
          onClick={onExecute}
          disabled={pending || !prompt.trim()}
        >
          execute
        </button>
      </div>
    </div>
  );
}
