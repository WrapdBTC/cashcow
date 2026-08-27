# Cash Cows

Mint site for Cash Cows on Robinhood Chain (chainId 4663).

The cows are the cash cows. Milk Weight is the bit.

## Stack

- Next.js App Router, TypeScript, Tailwind
- wagmi + viem for wallet connect

## Run

Copy `.env.example` to `.env.local`.

From this `web` folder:

    cp .env.example .env.local
    npm install
    npm run dev

Open http://localhost:3000

Production:

    npm run build
    npm start


Production: run the Next.js production build, then start.

See package.json scripts: `dev`, `build`, `start`.

## Env

See `.env.example`.

- NEXT_PUBLIC_CHAIN_ID=4663
- NEXT_PUBLIC_RPC_URL — placeholder public RPC
- NEXT_PUBLIC_EXPLORER_URL — placeholder explorer
- NEXT_PUBLIC_NFT_ADDRESS
- NEXT_PUBLIC_MILK_ADDRESS
- NEXT_PUBLIC_CLOCK_ADDRESS
- NEXT_PUBLIC_MINT_OPENS_AT — unix seconds; empty or 0 = mint closed
- NEXT_PUBLIC_MINT_PRICE_MILK — optional fallback
- NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID — optional

Mint is a feature flag. Closed by default. No ETH mint. Pay in $MILK, 100% burn, max 3 per wallet.

## Pages

- / Home (Holstein CFO, CLOCK IN)
- /mint $MILK burn mint
- /clock-in stake/unstake, milk weight
- /leaderboard heaviest milk
- /collection 12 titles

## Grades (census 2222)

Skim 1.0x 1111, 2% Milk 1.25x 622, Whole 1.6x 311, Extra Heavy 2.2x 133, Golden 3.5x 34, Sacred 5.0x 11.

Till plumbing (not a pitch): 50% of the Pons creator payout plus the full 5% secondary cut, split by milk weight among clocked-in cows. Burn-mint does not feed the till.
