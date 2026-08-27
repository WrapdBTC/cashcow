import { GradeTable } from "@/components/GradeTable";
import { LeaderboardBoard } from "@/components/LeaderboardBoard";

export const metadata = {
  title: "Board \u00b7 Cash Cows",
  description: "Heaviest milk. Not a dollar board.",
};

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <h1 className="display text-3xl sm:text-4xl">Heaviest milk</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-soft">
        Ranked by milk weight of clocked-in cows. Unstaked is 0. This is not a
        dollar board.
      </p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <LeaderboardBoard />
        <GradeTable />
      </div>
    </div>
  );
}
