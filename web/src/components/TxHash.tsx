import { explorerTx } from "@/lib/contracts";

export function TxHash({ hash }: { hash?: `0x${string}` }) {
  if (!hash) return null;
  return (
    <a
      href={explorerTx(hash)}
      target="_blank"
      rel="noreferrer"
      className="font-mono text-xs text-tie underline"
    >
      {hash.slice(0, 10)}…{hash.slice(-6)}
    </a>
  );
}
