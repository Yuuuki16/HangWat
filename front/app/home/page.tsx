import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center px-6 pb-16">
      <p className="absolute top-1/2 -translate-y-1/2 text-center text-xl tracking-[0.08em] text-foreground">
        新しい予定をつくってみましょう
      </p>

      <Link
        href="/events/new"
        className="mt-auto flex min-h-14 items-center justify-center rounded-base bg-primary px-5 py-3 text-3xl font-light text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0"
      >
        イベント作成
      </Link>
    </main>
  );
}
