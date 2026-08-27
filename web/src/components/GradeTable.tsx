import { GRADES } from "@/lib/grades";

export function GradeTable({ compact = false }: { compact?: boolean }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b-[3px] border-ink bg-cream px-4 py-3">
        <h2 className="display text-xl">Milk grades</h2>
        {!compact && (
          <p className="mt-1 text-sm text-ink-soft">
            Heaviest milk. Counts are the census, not a dollar board.
          </p>
        )}
      </div>
      <div className="divide-y-[3px] divide-ink">
        {GRADES.map((g) => (
          <div
            key={g.name}
            className="flex items-center gap-3 px-4 py-2.5"
            style={{ background: `${g.fill}33` }}
          >
            <span
              className="display inline-flex min-w-28 items-center justify-center border-[3px] border-ink px-2 py-1 text-sm"
              style={{ background: g.fill, color: g.ink }}
            >
              {g.name}
            </span>
            <span className="font-mono text-sm font-medium">{g.multLabel}</span>
            <span className="ml-auto font-mono text-sm tabular-nums">
              {g.count.toLocaleString("en-US")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GradePills() {
  return (
    <div className="flex flex-wrap gap-2">
      {GRADES.map((g) => (
        <span
          key={g.name}
          className="display border-[3px] border-ink px-2 py-1 text-xs"
          style={{ background: g.fill, color: g.ink }}
        >
          {g.name} {g.multLabel} · {g.count}
        </span>
      ))}
    </div>
  );
}
