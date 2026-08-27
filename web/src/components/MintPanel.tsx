"use client";

import { useMemo, useState } from "react";
import { maxUint256 } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { erc20Abi, nftAbi } from "@/lib/abis";
import { MAX_PER_WALLET, MAX_SUPPLY } from "@/lib/chain";
import {
  FALLBACK_MINT_PRICE,
  MILK_ADDRESS,
  NFT_ADDRESS,
} from "@/lib/contracts";
import { formatMilk } from "@/lib/format";
import { isMintOpen, mintOpenLabel } from "@/lib/mintOpen";
import { ConnectButton } from "./ConnectButton";
import { TxHash } from "./TxHash";

export function MintPanel() {
  const { address, isConnected } = useAccount();
  const [qty, setQty] = useState(1);
  const open = isMintOpen();

  const { data: totalSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: "totalSupply",
    query: { enabled: !!NFT_ADDRESS },
  });

  const { data: maxSupply } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: "maxSupply",
    query: { enabled: !!NFT_ADDRESS },
  });

  const { data: onchainPrice } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: "mintPrice",
    query: { enabled: !!NFT_ADDRESS },
  });

  const { data: minted } = useReadContract({
    address: NFT_ADDRESS,
    abi: nftAbi,
    functionName: "minted",
    args: address ? [address] : undefined,
    query: { enabled: !!NFT_ADDRESS && !!address },
  });

  const { data: decimals } = useReadContract({
    address: MILK_ADDRESS,
    abi: erc20Abi,
    functionName: "decimals",
    query: { enabled: !!MILK_ADDRESS },
  });

  const { data: milkBal } = useReadContract({
    address: MILK_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!MILK_ADDRESS && !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MILK_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && NFT_ADDRESS ? [address, NFT_ADDRESS] : undefined,
    query: { enabled: !!MILK_ADDRESS && !!NFT_ADDRESS && !!address },
  });

  const price = onchainPrice ?? FALLBACK_MINT_PRICE;
  const dec = decimals ?? 18;
  const mintedN = minted !== undefined ? Number(minted) : 0;
  const remainingWallet = Math.max(0, MAX_PER_WALLET - mintedN);
  const supply = totalSupply ?? 0n;
  const cap = maxSupply ?? BigInt(MAX_SUPPLY);
  const cost = price !== undefined ? price * BigInt(qty) : undefined;
  const needsApprove =
    !!cost && allowance !== undefined && allowance < cost;
  const enoughMilk = !!cost && milkBal !== undefined && milkBal >= cost;
  const canMint =
    open &&
    isConnected &&
    !!NFT_ADDRESS &&
    !!MILK_ADDRESS &&
    remainingWallet >= qty &&
    supply + BigInt(qty) <= cap &&
    enoughMilk &&
    !needsApprove;

  const { writeContractAsync, data: hash, isPending, error, reset } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const status = useMemo(() => {
    if (isPending) return "Confirm in wallet…";
    if (isConfirming) return "On chain…";
    if (isSuccess) return "Clocked through. They're on the floor.";
    return null;
  }, [isPending, isConfirming, isSuccess]);

  async function onApprove() {
    if (!MILK_ADDRESS || !NFT_ADDRESS) return;
    reset();
    await writeContractAsync({
      address: MILK_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [NFT_ADDRESS, maxUint256],
    });
    await refetchAllowance();
  }

  async function onMint() {
    if (!NFT_ADDRESS) return;
    reset();
    await writeContractAsync({
      address: NFT_ADDRESS,
      abi: nftAbi,
      functionName: "mint",
      args: [BigInt(qty)],
    });
  }

  return (
    <div className="panel">
      <div className="border-b-[3px] border-ink bg-cream px-5 py-4">
        <h1 className="display text-2xl sm:text-3xl">Mint</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Pay $MILK. It burns. 100%. Max {MAX_PER_WALLET} per wallet. No ETH
          mint.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="panel-flat bg-cream px-3 py-2 text-sm">
          {mintOpenLabel()}
        </div>

        <div className="h-3 border-[3px] border-ink bg-cream-dark">
          <div
            className="h-full bg-tie"
            style={{
              width: `${Math.min(100, (Number(supply) / Number(cap)) * 100)}%`,
            }}
          />
        </div>
        <p className="font-mono text-sm">
          {Number(supply).toLocaleString("en-US")} / {Number(cap).toLocaleString("en-US")} minted
        </p>

        {!NFT_ADDRESS || !MILK_ADDRESS ? (
          <p className="text-sm text-ink-soft">
            Contract addresses are not set. The floor is built; the till is
            waiting on deploy.
          </p>
        ) : null}

        {!isConnected ? (
          <ConnectButton />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="$MILK" value={formatMilk(milkBal, dec)} />
            <Stat
              label="Your mints"
              value={`${mintedN} / ${MAX_PER_WALLET}`}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-paper h-11 w-11 text-xl"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            −
          </button>
          <span className="display w-10 text-center text-2xl">{qty}</span>
          <button
            type="button"
            className="btn btn-paper h-11 w-11 text-xl"
            onClick={() =>
              setQty((q) => Math.min(Math.max(1, remainingWallet), q + 1))
            }
            disabled={qty >= Math.max(1, remainingWallet) || remainingWallet === 0}
          >
            +
          </button>
          <span className="ml-2 font-mono text-sm">
            = {cost !== undefined ? formatMilk(cost, dec) : "—"} $MILK burned
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {needsApprove ? (
            <button
              type="button"
              className="btn btn-gold px-5 py-3"
              disabled={!open || isPending || isConfirming || !isConnected}
              onClick={() => void onApprove()}
            >
              Approve $MILK
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-tie px-5 py-3"
              disabled={!canMint || isPending || isConfirming}
              onClick={() => void onMint()}
            >
              {open ? "Mint" : "Closed"}
            </button>
          )}
        </div>

        {cost !== undefined && milkBal !== undefined && !enoughMilk && isConnected && (
          <p className="text-sm text-brown">Not enough $MILK for this clock-in.</p>
        )}
        {status && <p className="text-sm">{status}</p>}
        <TxHash hash={hash} />
        {error && (
          <p className="text-sm text-brown">
            {error.message.replace(/Version: viem.*$/s, "").trim()}
          </p>
        )}

        <p className="text-xs text-ink-soft">
          Clock in. They&apos;re already at work. Burn-mint does not feed the
          till.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-flat px-3 py-3">
      <p className="display text-xs text-ink-soft">{label}</p>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  );
}
