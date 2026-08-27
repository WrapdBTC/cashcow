"use client";

import { useMemo } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { clockAbi, nftAbi } from "@/lib/abis";
import { CLOCK_ADDRESS, NFT_ADDRESS } from "@/lib/contracts";
import { formatWeight } from "@/lib/format";
import { gradeById } from "@/lib/grades";
import { asset } from "@/lib/paths";

const TOP_N = 25;

export function LeaderboardBoard() {
  const { data: top } = useReadContract({
    address: CLOCK_ADDRESS,
    abi: clockAbi,
    functionName: "topByWeight",
    args: [BigInt(TOP_N)],
    query: { enabled: !!CLOCK_ADDRESS },
  });

  const { data: clockedSupply } = useReadContract({
    address: CLOCK_ADDRESS,
    abi: clockAbi,
    functionName: "clockedSupply",
    query: { enabled: !!CLOCK_ADDRESS && !top },
  });

  const fallbackN = Math.min(TOP_N, Number(clockedSupply ?? 0));

  const indexReads = useReadContracts({
    contracts:
      CLOCK_ADDRESS && fallbackN > 0 && !top
        ? Array.from({ length: fallbackN }, (_, i) => ({
            address: CLOCK_ADDRESS,
            abi: clockAbi,
            functionName: "clockedTokenAt" as const,
            args: [BigInt(i)] as const,
          }))
        : [],
    query: { enabled: !!CLOCK_ADDRESS && fallbackN > 0 && !top },
  });

  const tokenIds = useMemo(() => {
    if (Array.isArray(top)) return top as bigint[];
    if (!indexReads.data) return [] as bigint[];
    return indexReads.data
      .map((r) => (r.status === "success" ? (r.result as bigint) : null))
      .filter((x): x is bigint => x !== null);
  }, [top, indexReads.data]);

  const details = useReadContracts({
    contracts: tokenIds.flatMap((id) => [
      {
        address: NFT_ADDRESS!,
        abi: nftAbi,
        functionName: "milkWeight" as const,
        args: [id] as const,
      },
      {
        address: NFT_ADDRESS!,
        abi: nftAbi,
        functionName: "gradeOf" as const,
        args: [id] as const,
      },
    ]),
    query: { enabled: tokenIds.length > 0 && !!NFT_ADDRESS },
  });

  const rows = useMemo(() => {
    const list = tokenIds.map((id, i) => {
      const w = details.data?.[i * 2];
      const g = details.data?.[i * 2 + 1];
      const weight = w?.status === "success" ? (w.result as bigint) : 0n;
      const grade = g?.status === "success" ? Number(g.result as number) : 0;
      return { id, weight, grade };
    });
    return list.sort((a, b) => (a.weight === b.weight ? 0 : a.weight > b.weight ? -1 : 1));
  }, [tokenIds, details.data]);

  if (!CLOCK_ADDRESS || !NFT_ADDRESS) {
    return (
      <p className="text-sm text-ink-soft">
        The board fills when cows clock in. Contracts are not set yet.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Nobody is on shift. Clock in and milk weight shows here — not dollars.
      </p>
    );
  }

  const max = rows[0]?.weight ?? 1n;

  return (
    <ol className="divide-y-[3px] divide-ink border-[3px] border-ink bg-paper">
      {rows.map((row, i) => {
        const grade = gradeById(row.grade);
        const pct =
          max === 0n ? 0 : Number((row.weight * 1000n) / max) / 10;
        return (
          <li key={row.id.toString()} className="flex items-center gap-3 px-3 py-3">
            <span className="display w-8 text-right text-sm">{i + 1}</span>
            <img
              src={asset("/logo.png")}
              alt=""
              className="pixel h-9 w-9 border-[3px] border-ink object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="display truncate text-sm">Cow #{row.id.toString()}</p>
              <p className="text-xs text-ink-soft">
                {grade.name} {grade.multLabel}
              </p>
              <div className="mt-1 h-2 border-[2px] border-ink bg-cream">
                <div
                  className="h-full bg-tie"
                  style={{ width: `${Math.max(4, pct)}%` }}
                />
              </div>
            </div>
            <span className="font-mono text-sm tabular-nums">
              {formatWeight(row.weight)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
