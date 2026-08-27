import { BREEDS } from "@/lib/breeds";

export const metadata = {
  title: "Collection · Cash Cows",
  description: "Twelve titles on the floor. Holstein CFO is the face.",
};

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5">
      <p className="display text-sm text-tie">Titles, not extra species</p>
      <h1 className="display mt-2 text-3xl sm:text-4xl">The floor</h1>
      <p className="mt-3 max-w-xl text-sm text-ink-soft">
        Twelve desks. Holstein CFO is the collection face — shirt, blue tie,
        coffee mug. 2,222 cows.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BREEDS.map((b, i) => (
          <article key={b.slug} className="panel p-4">
            <div className="flex items-start gap-3">
              <img
                src={i === 0 ? "/hero.png" : "/logo.png"}
                alt=""
                className="pixel h-16 w-16 border-[3px] border-ink bg-cream object-cover"
              />
              <div>
                <p className="font-mono text-[10px] text-tie">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="display text-lg leading-tight">{b.title}</h2>
                <p className="mt-1 text-xs font-medium text-ink-soft">{b.desk}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{b.line}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
