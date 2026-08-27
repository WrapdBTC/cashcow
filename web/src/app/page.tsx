import type { ReactNode } from "react";
import Link from "next/link";
import { GradePills, GradeTable } from "@/components/GradeTable";
import { MAX_PER_WALLET, MAX_SUPPLY } from "@/lib/chain";

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-5 lg:grid-cols-2 lg:py-16">
        <div>
          <p className="display text-sm text-tie">Holstein CFO · collection face</p>
          <h1 className="display mt-3 text-4xl leading-tight sm:text-5xl">
            The cows are the cash cows.
            <br />
            Milk Weight is the bit.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
            Clock in. They&apos;re already at work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/clock-in" className="btn btn-gold px-5 py-3 text-lg">
              Clock in
            </Link>
            <Link href="/mint" className="btn btn-tie px-5 py-3 text-lg">
              Mint
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            <Pill>{MAX_SUPPLY.toLocaleString("en-US")} cows</Pill>
            <Pill>Robinhood Chain</Pill>
            <Pill>Max {MAX_PER_WALLET} / wallet</Pill>
            <Pill>$MILK burns · 100%</Pill>
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="panel overflow-hidden bg-cream p-2">
            <img
              src="/hero.png"
              alt="Holstein CFO — shirt, blue tie, coffee mug"
              className="pixel mx-auto h-auto w-full bg-cream"
            />
          </div>
          <p className="mt-3 text-center font-mono text-xs text-ink-soft">
            Holstein CFO. The mug is the meeting.
          </p>
        </div>
      </section>

      <div className="ticker">
        <div className="ticker-track display text-sm">
          {Array.from({ length: 2 }).map((_, loop) => (
            <span key={loop} className="flex gap-10 px-6 py-2">
              <span>Skim 1.0× · 1111</span>
              <span>2% Milk 1.25× · 622</span>
              <span>Whole 1.6× · 311</span>
              <span>Extra Heavy 2.2× · 133</span>
              <span>Golden 3.5× · 34</span>
              <span>Sacred 5.0× · 11</span>
              <span>Milk Weight is the bit</span>
            </span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-5">
        <h2 className="display text-2xl sm:text-3xl">The floor</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Step n="01" title="Mint" href="/mint">
            Pay $MILK. It burns. No ETH mint. Max {MAX_PER_WALLET} per wallet.
          </Step>
          <Step n="02" title="Clock in" href="/clock-in">
            Stake the NFT. Milk weight counts. Sit out and your till share is 0.
          </Step>
          <Step n="03" title="The board" href="/leaderboard">
            Heaviest milk. Not a dollar board. Grades with counts.
          </Step>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-5 lg:grid-cols-2">
        <GradeTable />
        <div className="panel p-5">
          <h2 className="display text-xl">How the till actually moves</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Plumbing, not a pitch. 50% of the Pons creator payout plus the full
            5% secondary cut, split by milk weight among cows that are clocked
            in. Burn-mint does not feed the till.
          </p>
          <GradePills />
          <Link
            href="/collection"
            className="btn btn-paper mt-6 px-4 py-2 text-sm"
          >
            Meet the floor
          </Link>
        </div>
      </section>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <li className="display border-[3px] border-ink bg-paper px-2.5 py-1 text-xs">
      {children}
    </li>
  );
}

function Step({
  n,
  title,
  href,
  children,
}: {
  n: string;
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="panel block p-5 hover:bg-cream">
      <p className="font-mono text-xs text-tie">{n}</p>
      <h3 className="display mt-1 text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{children}</p>
    </Link>
  );
}
