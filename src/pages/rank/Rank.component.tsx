import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Layout } from "../../components/Layout";
import { getLeaderboard, useDictionary } from "../../lib/utils/anagrams";
import {
  LEADERBOARD_LIMIT,
  LETTER_LENGTHS,
  MIN_SUB_LENGTHS,
} from "./Rank.config";
import { RankWordEntry } from "./Rank.utils";

function CircleChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-full font-mono text-sm transition ${
        active
          ? "bg-ink text-page-bg"
          : "border border-border-subtle bg-page-bg-secondary text-ink hover:border-ink/30"
      }`}
    >
      {children}
    </button>
  );
}

export function Rank() {
  const ready = useDictionary();
  const [letterLength, setLetterLength] = useState(7);
  const [minSubLen, setMinSubLen] = useState(4);
  const [page, setPage] = useState(0);

  const validMinSubLen = Math.min(minSubLen, letterLength);
  const deferredLength = useDeferredValue(letterLength);
  const deferredMinSubLen = useDeferredValue(validMinSubLen);
  const deferredPage = useDeferredValue(page);

  useEffect(() => {
    if (minSubLen > letterLength) {
      setMinSubLen(letterLength);
    }
  }, [letterLength, minSubLen]);

  useEffect(() => {
    setPage(0);
  }, [letterLength, validMinSubLen]);

  const computing =
    ready &&
    (deferredLength !== letterLength ||
      deferredMinSubLen !== validMinSubLen ||
      deferredPage !== page);

  const { entries: leaderboard, total } = useMemo(
    () =>
      ready
        ? getLeaderboard(
            deferredLength,
            deferredMinSubLen,
            LEADERBOARD_LIMIT,
            deferredPage * LEADERBOARD_LIMIT,
          )
        : { entries: [], total: 0 },
    [ready, deferredLength, deferredMinSubLen, deferredPage],
  );

  const pageStart = page * LEADERBOARD_LIMIT + 1;
  const pageEnd = Math.min((page + 1) * LEADERBOARD_LIMIT, total);
  const hasPrev = page > 0;
  const hasNext = (page + 1) * LEADERBOARD_LIMIT < total;

  const minSubOptions = MIN_SUB_LENGTHS.filter((n) => n <= letterLength);

  return (
    <Layout>
      <section className="px-4 pb-20 pt-10 sm:px-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          / leaderboard
        </p>
        <h1 className="mb-4 text-5xl tracking-tight text-ink sm:text-6xl">
          Top scoring letter sets.
        </h1>
        <p className="mb-12 max-w-xl text-sm leading-relaxed text-text-secondary">
          A word&apos;s score is the sum of point values for every dictionary
          sub-anagram at or above the chosen minimum length.
        </p>

        <div className="mb-14 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Letter length
            </span>
            <div className="flex flex-wrap gap-2">
              {LETTER_LENGTHS.map((n) => (
                <CircleChip
                  key={n}
                  active={letterLength === n}
                  onClick={() => setLetterLength(n)}
                >
                  {n}
                </CircleChip>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Min sub-word length
            </span>
            <div className="flex flex-wrap gap-2">
              {minSubOptions.map((n) => (
                <CircleChip
                  key={n}
                  active={validMinSubLen === n}
                  onClick={() => setMinSubLen(n)}
                >
                  {n}
                </CircleChip>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border-subtle">
          <div className="flex items-baseline justify-between border-b border-border-subtle py-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Rank · Word
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Score
            </span>
          </div>

          {!ready || computing ? (
            <p className="py-10 font-mono text-sm text-text-secondary">
              {!ready ? "Loading dictionary…" : "Computing rankings…"}
            </p>
          ) : leaderboard.length === 0 ? (
            <p className="py-10 font-mono text-sm text-text-secondary">
              No results for this filter.
            </p>
          ) : (
            <>
              <ol>
                {leaderboard.map(({ rank, word, score }) => (
                  <li
                    key={word}
                    className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-4"
                  >
                    <div className="flex min-w-0 items-baseline gap-5">
                      <span className="w-7 shrink-0 font-mono text-sm tabular-nums text-text-secondary">
                        {String(rank).padStart(2, "0")}
                      </span>
                      <RankWordEntry word={word} />
                    </div>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-ink">
                      {score.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-8">
                <p className="font-mono text-sm text-text-secondary">
                  {pageStart.toLocaleString()}–{pageEnd.toLocaleString()} of{" "}
                  {total.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={!hasPrev}
                    className="rounded-full border border-border-subtle bg-page-bg-secondary px-5 py-2.5 font-mono text-sm text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasNext}
                    className="rounded-full border border-border-subtle bg-page-bg-secondary px-5 py-2.5 font-mono text-sm text-ink transition hover:border-ink/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
