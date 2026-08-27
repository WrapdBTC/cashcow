import Link from "next/link";
import { CHAIN_ID } from "@/lib/chain";

export function Footer() {
  return (
    <footer className="mt-16 border-t-[3px] border-ink bg-spot text-cream">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-5">
        <div>
          <p className="display text-lg text-gold-pale">Cash Cows</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream/80">
            The cows are the cash cows. Milk Weight is the bit. Robinhood Chain
            · {CHAIN_ID}. Supply 2,222.
          </p>
        </div>
        <div className="display grid gap-1 text-sm">
          <Link href="/mint" className="hover:text-gold-pale">
            Mint
          </Link>
          <Link href="/clock-in" className="hover:text-gold-pale">
            Clock in
          </Link>
          <Link href="/leaderboard" className="hover:text-gold-pale">
            Heaviest milk
          </Link>
          <Link href="/collection" className="hover:text-gold-pale">
            Collection
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-cream/70">
          Till plumbing (not a pitch): 50% of the Pons creator payout plus the
          full 5% secondary cut, split by milk weight among clocked-in cows.
          Burn-mint does not feed the till. Unstaked cows sit at 0.
        </p>
      </div>
      <div className="h-3 bg-brown" />
      <div className="h-3 bg-mug" />
    </footer>
  );
}
