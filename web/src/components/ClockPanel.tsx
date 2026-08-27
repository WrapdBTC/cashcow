"use client";

import { useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { clockAbi, nftAbi } from "@/lib/abis";
import { CLOCK_ADDRESS, NFT_ADDRESS } from "@/lib/contracts";
import { formatWeight } from "@/lib/format";
import { gradeById } from "@/lib/grades";
import { ConnectButton } from "./ConnectButton";
import { TxHash } from "./TxHash";

export function ClockPanel() {
  const { address, isConnected } = useAccount();

  const { data: balance } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!NFT_ADDRESS && !!address },
  });

  const n = Number(balance ?? 0);

  const idReads = useReadContracts({
    contracts:
      address && NFT_ADDRESS
        ? Array.from({ length: n }, (_, i) => ({
            address: NFT_ADDRESS,
            abi: nftAbi,
            functionName: "tokenOfOwnerByIndex" as const,
            args: [address, BigInt(i)] as const,
          }))
        : [],
    query: { enabled: !!address && !!NFT_ADDRESS && n > 0 },
  });

  const tokenIds = useMemo(() => {
    if (!idReads.data) return [] as bigint[];
    return idReads.data
      .map((r) => (r.status === "success" ? (r.result as bigint) : null))
      .filter((x): x is bigint => x !== null);
  }, [idReads.data]);

  const detailReads = useReadContracts({
    contracts: tokenIds.flatMap((id) => {
      const nft = NFT_ADDRESS!;
      const clock = CLOCK_ADDRESS;
      return [
        {
          address: nft,
          abi: nftAbi,
          functionName: "milkWeight" as const,
          args: [id] as const,
        },
        {
          address: nft,
          abi: nftAbi,
          functionName: "gradeOf" as const,
          args: [id] as const,
        },
        ...(clock
          ? [
              {
                address: clock,
                abi: clockAbi,
                functionName: "isClockedIn" as const,
                args: [id] as const,
              },
              {
                address: clock,
                abi: clockAbi,
                functionName: "poolShareBps" as const,
                args: [id] as const,
              },
            ]
          : []),
      ];
    }),
    query: { enabled: tokenIds.length > 0 && !!NFT_ADDRESS },
  });

  const { data: approved } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: "isApprovedForAll",
    args: address && CLOCK_ADDRESS ? [address, CLOCK_ADDRESS] : undefined,
    query: { enabled: !!NFT_ADDRESS && !!CLOCK_ADDRESS && !!address },
  });

  const { writeContractAsync, data: hash, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const stride = CLOCK_ADDRESS ? 4 : 2;

  const rows = tokenIds.map((id, i) => {
    const base = i * stride;
    const w = detailReads.data?.[base];
    const g = detailReads.data?.[base + 1];
    const c = CLOCK_ADDRESS ? detailReads.data?.[base + 2] : undefined;
    const s = CLOCK_ADDRESS ? detailReads.data?.[base + 3] : undefined;
    const weight = w?.status === "success" ? (w.result as bigint) : undefined;
    const grade = g?.status === "success" ? Number(g.result as number) : 0;
    const clocked = c?.status === "success" ? Boolean(c.result) : false;
    const shareBps = s?.status === "success" ? (s.result as bigint) : 0n;
    return { id, weight, grade, clocked, shareBps };
  });

  async function approveDesk() {
    if (!NFT_ADDRESS || !CLOCK_ADDRESS) return;
    reset();
    await writeContractAsync({
      address: NFT_ADDRESS,
      abi: nftAbi,
      functionName: "setApprovalForAll",
      args: [CLOCK_ADDRESS, true],
    });
  }

  async function clock(id: bigint, inShift: boolean) {
    if (!CLOCK_ADDRESS) return;
    reset();
    await writeContractAsync({
      address: CLOCK_ADDRESS,
      abi: clockAbi,
      functionName: inShift ? "clockIn" : "clockOut",
      args: [id],
    });
  }

  return (
    <div className="panel">
      <div className="border-b-[3px] border-ink bg-cream px-5 py-4">
        <h1 className="display text-2xl sm:text-3xl">Clock in</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Stake the NFT. Milk weight counts on the board. Unstaked cows have 0
          till share.
        </p>
      </div>

      <div className="space-y-5 p-5">
        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm">Connect a wallet to see cows on this desk.</p>
            <ConnectButton />
          </div>
        ) : !NFT_ADDRESS ? (
          <p className="text-sm text-ink-soft">
            NFT address is not set. Clock-in waits on deploy.
          </p>
        ) : n === 0 ? (
          <p className="text-sm text-ink-soft">
            No cows on this wallet. Mint first, then clock in.
          </p>
        ) : (
          <>
            {CLOCK_ADDRESS && approved === false && (
              <button
                type="button"
                className="btn btn-gold px-4 py-3"
                disabled={isPending || isConfirming}
                onClick={() => void approveDesk()}
              >
                Approve desk
              </button>
            )}
            <ul className="space-y-3">
              {rows.map((row) => {
                const grade = gradeById(row.grade);
                const share =
                  row.clocked && row.shareBps > 0n
                    ? `${(Number(row.shareBps) / 100).toFixed(2)}% till`
                    : "0 till share";
                return (
                  <li
                    key={row.id.toString()}
                    className="panel-flat flex flex-wrap items-center gap-3 p-3"
                  >
                    <img
                      src="/logo.png"
                      alt=""
                      className="pixel h-12 w-12 border-[3px] border-ink object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="display text-base">
                        Cow #{row.id.toString()}
                      </p>
                      <p className="font-mono text-xs text-ink-soft">
                        Milk weight {formatWeight(row.weight)} · {grade.name}{" "}
                        {grade.multLabel}
                      </p>
                      <p className="text-xs text-ink-soft">
                        {row.clocked ? "On shift" : "Off the floor"} · {share}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={`btn px-3 py-2 text-sm ${
                        row.clocked ? "btn-paper" : "btn-tie"
                      }`}
                      disabled={
                        !CLOCK_ADDRESS ||
                        isPending ||
                        isConfirming ||
                        (!row.clocked && approved === false)
                      }
                      onClick={() => void clock(row.id, !row.clocked)}
                    >
                      {row.clocked ? "Clock out" : "Clock in"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {isPending && <p className="text-sm">Confirm in wallet…</p>}
        {isConfirming && <p className="text-sm">On chain…</p>}
        {isSuccess && <p className="text-sm">Shift updated.</p>}
        <TxHash hash={hash} />
        {error && (
          <p className="text-sm text-brown">
            {error.message.replace(/Version: viem.*$/s, "").trim()}
          </p>
        )}
      </div>
    </div>
  );
}
