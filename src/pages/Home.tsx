import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";

export function Home() {
  return (
    <Layout headerVariant="home">
      <section className="px-8 pb-12 pt-12 sm:px-16 sm:pt-16 lg:px-0">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          — word tools
        </p>
        <h1 className="mb-6 max-w-[12ch] text-5xl leading-[1.05] tracking-tight text-ink sm:text-7xl font-display">
          It's time to start studying your anagrams ;)
        </h1>
        <p className="mb-10 max-w-md text-lg text-text-secondary">
          Expand and test your knowledge of anagrams through the finder and game
          modes.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/finder"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Open finder <span aria-hidden>→</span>
          </Link>
          <Link
            to="/game"
            className="inline-flex items-center rounded-full border border-border-subtle bg-page-bg-secondary px-6 py-3 text-sm font-medium text-black transition hover:border-ink/40"
          >
            Play game
          </Link>
        </div>
      </section>
    </Layout>
  );
}
