# Open Sentinel

Open Sentinel is a policy-first wallet control plane for AI agents.

Built for **Synthesis 2026**. The event is now in **judging in progress**, with winners announced **March 25, 2026**.

## Build Stack

- Next.js 15 + React 19
- TypeScript policy engine
- OpenAI Responses API for command planning
- viem for allowlist-first ENS and identity resolution
- MoonPay CLI for wallet runtime and live execution
- Narrow live market-data fallback chain for read-only token prices

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
- answer live token-price questions

## Why It Matters

Most agent wallets are either too permissive or too opaque. Open Sentinel gives
an agent enough authority to be useful, while making its spending perimeter,
counterparty identity, and execution trail visible before funds move.

## Product Story

1. The user gives one natural-language wallet instruction.
2. The planner converts it into a structured sequence.
3. ENS / counterparty resolution binds human-readable identities to addresses.
4. The policy engine checks whether the wallet is allowed to do it.
5. The wallet only proceeds if the route clears the perimeter.
6. The system produces a receipt-grade execution trail judges can inspect.

## Primary Target Tracks

- OpenWallet Standard
- MoonPay CLI Agents
- Synthesis Open Track

## What Works Today

- natural-language parsing for send / swap / bridge / DCA plan requests
- deterministic policy evaluation before execution
- allowlist-first ENS-aware destination handling
- live wallet readiness checks against the local MoonPay CLI session
- live token-price lookups for a fixed set of tracked tokens with fallback read-only sources
- receipt / ledger output for policy and execution evidence

## Current Status

The current repo demonstrates the bounded-wallet control plane, judge-facing
review UX, live-mode readiness checks, and receipt-ledger flow. Open Sentinel
can be run in `live` mode for local MoonPay-backed testing, but that path is
still tightly coupled to the local CLI session and can fall back to blocked
preflight states if auth expires, balances are missing, the wrong chain is
funded, or native gas is unavailable.

## Current MoonPay State

Open Sentinel is built around the local MoonPay wallet `open-sentinel-demo`.
The live execution path is driven by the local MoonPay CLI session, so wallet
reads and execution readiness depend on:

- a valid local MoonPay auth session
- the correct token on the correct chain
- native gas on that chain for execution
- the planner selecting or being told the right execution chain

When those conditions are not met, Sentinel keeps the request at the preflight
or blocked stage and records the reason in the execution ledger.

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
MOONPAY_EXECUTION_MODE=live
```

For dry-run testing without live wallet actions:

```bash
MOONPAY_EXECUTION_MODE=simulated
```

## Confirmed local MoonPay wallet

The current local wallet confirmed through `mp wallet list` is:

- wallet name: `open-sentinel-demo`
- Base address: `0x1A28C3C6263f6f7B65458457081Eb57d20Cd3856`

This wallet is used for local MoonPay-backed testing and demo recording.
