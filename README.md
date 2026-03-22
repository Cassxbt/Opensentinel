# Open Sentinel

Open Sentinel is a policy-first wallet control plane for AI agents.

## Core Idea

An agent can execute wallet actions, but only inside visible user-defined rules:

- daily spend limits
- chain allowlists
- token allowlists
- approved destinations
- dry-run before execution
- clear receipts after execution

## Hero Actions

- send payment to another address
- bridge across chains
- swap into another asset
- create a DCA plan

## Why It Matters

Most agent wallets are either too permissive or too opaque. Open Sentinel gives
an agent enough authority to be useful, while making its spending perimeter,
counterparty identity, and execution trail visible before funds move.

## Product Story

1. The user gives one natural-language wallet instruction.
2. The planner converts it into a structured sequence.
3. The policy engine checks whether the wallet is allowed to do it.
4. The wallet only proceeds if the route clears the perimeter.
5. The system produces a receipt-grade execution trail judges can inspect.

## Target Tracks

- OpenWallet Standard
- MoonPay CLI Agents
- Synthesis Open Track

## Current MoonPay State

Open Sentinel is currently built around the verified local MoonPay wallet path.
Local wallet creation and retrieval work in simulated mode even while
account-backed user endpoints remain login-gated.

## Local Development

```bash
npm install
npm run dev
```

## Environment

Create `.env.local`:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
MOONPAY_WALLET_NAME=open-sentinel-demo
DEMO_WALLET_ADDRESS=0x1A28C3C6263f6f7B65458457081Eb57d20Cd3856
ENS_RPC_URL=https://ethereum-rpc.publicnode.com
MOONPAY_EXECUTION_MODE=simulated
```

## Confirmed local MoonPay wallet

The current local simulated wallet confirmed through `mp wallet list` is:

- wallet name: `open-sentinel-demo`
- Base address: `0x1A28C3C6263f6f7B65458457081Eb57d20Cd3856`

Local wallet creation and retrieval work in simulated mode even if authenticated
account commands return `403 Forbidden`.

Keep `MOONPAY_EXECUTION_MODE=simulated` until the MoonPay action path is stable.
