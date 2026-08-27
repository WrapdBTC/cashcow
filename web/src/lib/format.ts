import { formatUnits } from "viem";

export function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatMilk(value: bigint | undefined, decimals = 18) {
  if (value === undefined) return "—";
  const n = Number(formatUnits(value, decimals));
  if (!Number.isFinite(n)) return formatUnits(value, decimals);
  if (n === 0) return "0";
  if (n >= 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (n >= 1) return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
}

export function formatWeight(value: bigint | number | undefined) {
  if (value === undefined) return "—";
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function formatMultiplier(m: number) {
  return `${m.toFixed(2).replace(/0$/, "").replace(/\.0$/, ".0")}×`;
}
