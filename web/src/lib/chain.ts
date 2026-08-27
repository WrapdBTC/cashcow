import { defineChain } from "viem";

export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || "4663");

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://rpc.mainnet.chain.robinhood.com";

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL ||
  "https://robinhoodchain.blockscout.com";

export const robinhoodChain = defineChain({
  id: CHAIN_ID,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: EXPLORER_URL },
  },
});

export const MAX_SUPPLY = 2222;
export const MAX_PER_WALLET = 3;
