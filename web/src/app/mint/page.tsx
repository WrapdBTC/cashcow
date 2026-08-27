import { MintPanel } from "@/components/MintPanel";
import { GradePills } from "@/components/GradeTable";
import { asset } from "@/lib/paths";

export const metadata = {
  title: "Mint · Cash Cows",
  description: "Clock in. They're already at work. Pay $MILK. It burns.",
};

export default function MintPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <MintPanel />
      <aside className="space-y-4">
        <div className="panel overflow-hidden p-3">
          <img
            src={asset("/hero.png")}
            alt="Holstein CFO"
            className="pixel w-full bg-cream"
          />
          <p className="mt-3 display text-sm">Holstein CFO</p>
          <p className="text-xs text-ink-soft">
            Clock in. They&apos;re already at work.
          </p>
        </div>
        <div className="panel p-4">
          <p className="display text-sm">Rules</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-ink-soft">
            <li>Pay $MILK. 100% burn.</li>
            <li>Max 3 per wallet.</li>
            <li>No ETH mint.</li>
            <li>2,222 cows. Robinhood Chain.</li>
          </ul>
        </div>
        <GradePills />
      </aside>
    </div>
  );
}
