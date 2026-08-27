/** Mint is closed unless NEXT_PUBLIC_MINT_OPENS_AT is a unix-seconds timestamp in the past. */
export function mintOpensAt(): number | null {
  const raw = process.env.NEXT_PUBLIC_MINT_OPENS_AT;
  if (!raw) return null;
  const ts = Number(raw);
  if (!Number.isFinite(ts) || ts <= 0) return null;
  return Math.floor(ts);
}

export function isMintOpen(nowMs = Date.now()): boolean {
  const ts = mintOpensAt();
  if (ts === null) return false;
  return nowMs >= ts * 1000;
}

export function mintOpenLabel(nowMs = Date.now()): string {
  const ts = mintOpensAt();
  if (ts === null) return "Mint is closed.";
  if (nowMs >= ts * 1000) return "Mint is open.";
  const when = new Date(ts * 1000);
  return `Mint opens ${when.toLocaleString("en-GB", {
    timeZone: "Europe/Zagreb",
    dateStyle: "medium",
    timeStyle: "short",
  })}.`;
}
