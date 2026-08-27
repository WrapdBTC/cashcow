"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./ConnectButton";
import { asset } from "@/lib/paths";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/mint", label: "Mint" },
  { href: "/clock-in", label: "Clock in" },
  { href: "/leaderboard", label: "Board" },
  { href: "/collection", label: "Collection" },
];

export function Header() {
  const path = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <img
            src={asset("/logo.png")}
            alt="Cash Cows"
            width={40}
            height={40}
            className="pixel h-10 w-10 border-[3px] border-ink bg-cream object-cover"
          />
          <span className="display text-lg leading-none text-ink sm:text-xl">
            Cash Cows
          </span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`display px-2.5 py-1 text-sm ${
                  active
                    ? "border-[3px] border-ink bg-gold-pale"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:ml-2">
          <ConnectButton compact />
          <Link href="/clock-in" className="btn btn-gold px-3 py-2 text-sm">
            Clock in
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t-[3px] border-ink px-3 py-2 md:hidden">
        {LINKS.map((l) => {
          const active = path === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`display shrink-0 px-2 py-1 text-xs ${
                active ? "border-[3px] border-ink bg-gold-pale" : "text-ink-soft"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
