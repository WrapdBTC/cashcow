import { type Address, isAddress, zeroAddress } from "viem";

function readAddress(raw: string | undefined): Address | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (!isAddress(trimmed)) return undefined;
  if (trimmed.toLowerCase() === zeroAddress) return undefined;
  return trimmed as Address;
}

export const NFT_ADDRESS = readAddress(process.env.NEXT_PUBLIC_NFT_ADDRESS);
export const MILK_ADDRESS = readAddress(process.env.NEXT_PUBLIC_MILK_ADDRESS);
export const CLOCK_ADDRESS = readAddress(process.env.NEXT_PUBLIC_CLOCK_ADDRESS);

export const FALLBACK_MINT_PRICE = process.env.NEXT_PUBLIC_MINT_PRICE_MILK
  ? BigInt(process.env.NEXT_PUBLIC_MINT_PRICE_MILK)
  : undefined;

export function explorerToken(addr: Address) {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL ||
    "https://robinhoodchain.blockscout.com";
  return `${base.replace(/\/$/, "")}/token/${addr}`;
}

export function explorerTx(hash: string) {
  const base = process.env.NEXT_PUBLIC_EXPLORER_URL ||
    "https://robinhoodchain.blockscout.com";
  return `${base.replace(/\/$/, "")}/tx/${hash}`;
}
