import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="display text-4xl">Wrong desk</h1>
      <p className="mt-3 text-ink-soft">That hallway does not exist.</p>
      <Link href="/" className="btn btn-gold mt-6 px-5 py-3">
        Back to the floor
      </Link>
    </div>
  );
}
