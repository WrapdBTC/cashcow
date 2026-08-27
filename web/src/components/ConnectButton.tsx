"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "@/lib/chain";
import { shortAddress } from "@/lib/format";

export function ConnectButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  const wrongChain = isConnected && chainId !== CHAIN_ID;

  if (isConnected && address && wrongChain) {
    return (
      <button
        type="button"
        className="btn btn-gold px-3 py-2 text-sm"
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        disabled={isSwitching}
      >
        {isSwitching ? "Switching…" : "Robinhood Chain"}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        type="button"
        className="btn btn-paper px-3 py-2 font-mono text-sm"
        onClick={() => disconnect()}
        title="Disconnect"
      >
        {shortAddress(address)}
      </button>
    );
  }

  const unique = connectors.filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
  );

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-tie px-3 py-2 text-sm"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
      >
        {isPending ? "Connecting…" : compact ? "Connect" : "Connect wallet"}
      </button>
      {open && (
        <div className="panel absolute right-0 z-40 mt-2 min-w-52 p-2">
          {unique.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm font-medium hover:bg-cream"
              onClick={() => {
                connect({ connector });
                setOpen(false);
              }}
            >
              {connector.name === "Injected" ? "Browser wallet" : connector.name}
            </button>
          ))}
          {error && (
            <p className="mt-2 px-2 text-xs text-brown">{error.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
