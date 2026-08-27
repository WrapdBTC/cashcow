# Cash Cows

2,222 pixel cows on Robinhood Chain. Milk Weight is the bit.

**Clock in. They're already at work.**

| | |
|---|---|
| Supply | 2,222 |
| Chain | Robinhood Chain (`4663`) |
| Token | `$MILK` (Pons). Mint burns 100%. Fuel, not payout. |
| Verb | CLOCK IN |

## Repo

- `web/` — Next.js mint site (Home, Mint, Clock in, Leaderboard, Collection)
- `contracts/` — Foundry: ERC721, Milk Weight, ClockIn, fee splitter

## Web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Mint stays closed until `NEXT_PUBLIC_MINT_OPENS_AT`. Fill contract addresses after deploy.

## Contracts

```bash
cd contracts
forge install
forge test
```

Chain 4663. See `contracts/README.md` for env (`MILK`, `ROYALTY_RECEIVER`, `OWNER`, `MINT_PRICE`, `MINT_OPEN`, `BASE_URI`).

## Copy lock

Do not use: earn, yield, APY, passive, “royalties to holders”, “your cow works for you”.
