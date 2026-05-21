import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Layout } from "../../components/Layout";
import {
  groupPastelAtIndex,
  groupWordsByLetterMultiset,
  letterMultisetKey,
} from "../../lib/utils/anagramGroups";
import {
  findAnagrams,
  getRankOfWord,
  useDictionary,
  type RankInfo,
} from "../../lib/utils/anagrams";

import {
  MIN_LENGTHS,
  SOLVER_RESULTS_VIEWS,
  type SolverResultsView,
} from "./Solver.config";
import { SolverResultsByLengthTable, SolverWordChip } from "./Solver.utils";

export function Solver() {
  const lettersInputRef = useRef<HTMLInputElement>(null);
  const ready = useDictionary();
  const [input, setInput] = useState("");
  const [minLen, setMinLen] = useState(3);
  const [resultsView, setResultsView] =
    useState<SolverResultsView>("word-list");
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);

  const deferredInput = useDeferredValue(input);
  const results = useMemo(
    () => (ready ? findAnagrams(deferredInput, minLen) : []),
    [deferredInput, minLen, ready],
  );

  useEffect(() => {
    if (ready && deferredInput.length > 0) {
      setRankInfo(getRankOfWord(deferredInput));
    } else {
      setRankInfo(null);
    }
  }, [ready, deferredInput]);

  const groupedByLength = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const w of results) {
      if (!m.has(w.length)) m.set(w.length, []);
      m.get(w.length)!.push(w);
    }
    for (const [, ws] of m) ws.sort((a, b) => a.localeCompare(b));
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [results]);

  return (
    <Layout>
      <section className="px-4 pb-20 pt-10 sm:px-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          / solver
        </p>
        <h1 className="mb-12 text-5xl tracking-tight text-ink sm:text-6xl">
          Reveal anagrams
        </h1>

        <div className="space-y-8">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="solver-letters"
                className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary"
              >
                Letters
              </label>
              <div className="group relative shrink-0">
                <button
                  type="button"
                  aria-describedby="solver-help-tip"
                  className="relative z-10 flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-text-secondary/35 bg-page-bg text-[11px] font-semibold leading-none text-text-secondary transition hover:border-accent/50 hover:text-accent focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-6 sm:w-6 sm:text-xs"
                  aria-label="How Solver letters work"
                >
                  i
                </button>
                <div
                  id="solver-help-tip"
                  role="tooltip"
                  className="pointer-events-none invisible absolute bottom-[calc(100%+0.5rem)] right-0 z-20 w-[min(19rem,calc(100vw-6rem))] rounded-md border border-border-subtle bg-page-bg-secondary px-3 py-2.5 text-left text-xs leading-snug text-ink opacity-0 shadow-md transition-opacity duration-100 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                >
                  <p>
                    Results list dictionary words made from the letters you
                    type.
                  </p>
                  <p className="mt-1">
                    <span className="font-mono text-text-secondary">?</span> is
                    a wildcard letter: each one can stand for any possible
                    letter.
                  </p>
                  <p className="mt-1">
                    Use{" "}
                    <span className="font-mono text-text-secondary">
                      Min length
                    </span>{" "}
                    to omit short words from the list.
                  </p>
                </div>
              </div>
            </div>
            <input
              ref={lettersInputRef}
              id="solver-letters"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="type some letters…"
              className="block w-full overflow-visible border-b-2 border-border-subtle bg-transparent pb-4 font-display text-3xl lowercase leading-normal tracking-wide text-ink outline-none transition focus:border-accent sm:text-4xl"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
                Min length
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MIN_LENGTHS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMinLen(n)}
                    className={`h-9 min-w-9 rounded-md px-2.5 font-mono text-sm transition ${
                      minLen === n
                        ? "bg-ink text-page-bg"
                        : "bg-page-bg-tertiary text-ink hover:bg-border-subtle"
                    }`}
                  >
                    {n}+
                  </button>
                ))}
              </div>
            </div>
            {results.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {SOLVER_RESULTS_VIEWS.map(({ id, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setResultsView(id)}
                      className={`h-9 rounded-md px-2.5 font-mono text-xs transition ${
                        resultsView === id
                          ? "bg-ink text-page-bg"
                          : "bg-page-bg-tertiary text-ink hover:bg-border-subtle"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16 border-b border-border-subtle mb-6">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl text-ink">Results</h2>
            <span className="font-mono text-sm text-text-secondary">
              {rankInfo && (
                <span>
                  rank #{rankInfo.rank.toLocaleString()} of{" "}
                  {rankInfo.total.toLocaleString()}
                  {" · "}
                </span>
              )}
              {results.length} words
            </span>
          </div>
        </div>

        {!ready ? (
          <p className="font-mono text-sm text-text-secondary">
            loading dictionary…
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-text-secondary">No words found.</p>
        ) : resultsView === "word-list" ? (
          <div className="space-y-8">
            {groupedByLength.map(([len, ws]) => (
              <div key={len}>
                <p className="mb-3 font-mono text-xs lowercase text-accent">
                  {len} letters · {ws.length}
                </p>
                <div className="flex flex-wrap items-start gap-x-1.5 gap-y-2">
                  {groupWordsByLetterMultiset(ws).map((cluster, clusterIdx) => {
                    const sig = letterMultisetKey(cluster[0]);
                    const fill = groupPastelAtIndex(clusterIdx);
                    return (
                      <div key={sig} className="inline-flex flex-wrap gap-1.5">
                        {cluster.map((w) => (
                          <SolverWordChip
                            key={w}
                            word={w}
                            fill={fill}
                            onUseInSolver={(picked) => {
                              setInput(picked);
                              lettersInputRef.current?.focus();
                              lettersInputRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SolverResultsByLengthTable
            groupedByLength={groupedByLength}
            sortMode={
              resultsView === "grouped-table" ? "multiset" : "alphabetical"
            }
          />
        )}
      </section>
    </Layout>
  );
}
