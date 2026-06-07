import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
  SOLVER_PREFILL_LETTERS_KEY,
  SOLVER_RESULTS_VIEWS,
  cleanSolverLetters,
  solverPathForLetters,
  type SolverResultsView,
} from "./Solver.config";
import { SolverResultsByLengthTable, SolverWordChip } from "./Solver.utils";

export function Solver() {
  const lettersInputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { letters: lettersParam } = useParams();
  const ready = useDictionary();
  const [input, setInput] = useState("");
  const [minLen, setMinLen] = useState(3);
  const [resultsView, setResultsView] =
    useState<SolverResultsView>("word-list");
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);

  const solvedLetters = lettersParam
    ? cleanSolverLetters(decodeURIComponent(lettersParam))
    : "";

  useEffect(() => {
    setInput(solvedLetters);
  }, [solvedLetters]);

  useEffect(() => {
    const raw = (location.state as Record<string, unknown> | null)?.[
      SOLVER_PREFILL_LETTERS_KEY
    ];
    if (typeof raw !== "string" || !raw) return;
    navigate(solverPathForLetters(raw), { replace: true, state: {} });
  }, [location.state, navigate]);

  const results = useMemo(
    () => (ready && solvedLetters ? findAnagrams(solvedLetters, minLen) : []),
    [ready, solvedLetters, minLen],
  );

  useEffect(() => {
    if (ready && solvedLetters) {
      setRankInfo(getRankOfWord(solvedLetters));
    } else {
      setRankInfo(null);
    }
  }, [ready, solvedLetters]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (results.length === 0) return;

      const target = e.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      e.preventDefault();
      const ids = SOLVER_RESULTS_VIEWS.map((v) => v.id);
      const idx = ids.indexOf(resultsView);
      const delta = e.key === "ArrowRight" ? 1 : -1;
      setResultsView(ids[(idx + delta + ids.length) % ids.length]);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [results.length, resultsView]);

  const groupedByLength = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const w of results) {
      if (!m.has(w.length)) m.set(w.length, []);
      m.get(w.length)!.push(w);
    }
    for (const [, ws] of m) ws.sort((a, b) => a.localeCompare(b));
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [results]);

  function submitLetters() {
    const cleaned = cleanSolverLetters(input);
    if (!cleaned) return;
    navigate(solverPathForLetters(cleaned));
  }

  function clearLetters() {
    setInput("");
    navigate("/solver");
    lettersInputRef.current?.focus();
  }

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
                    Press{" "}
                    <span className="font-mono text-text-secondary">Enter</span>{" "}
                    to solve and open a shareable URL for the letters you type.
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
            <div className="relative border-b-2 border-border-subtle transition focus-within:border-accent">
              <input
                ref={lettersInputRef}
                id="solver-letters"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitLetters();
                  }
                }}
                placeholder="type some letters…"
                className="block w-full overflow-visible bg-transparent py-0 pb-4 pr-14 font-display text-3xl lowercase leading-normal tracking-wide text-ink outline-none sm:text-4xl"
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              {input.length > 0 && (
                <button
                  type="button"
                  onClick={clearLetters}
                  aria-label="Clear letters"
                  className="absolute right-0 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-accent font-mono text-2xl leading-none text-white transition hover:opacity-90"
                >
                  ×
                </button>
              )}
            </div>
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

        {solvedLetters && (
          <>
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
                      {groupWordsByLetterMultiset(ws).map(
                        (cluster, clusterIdx) => {
                          const sig = letterMultisetKey(cluster[0]);
                          const fill = groupPastelAtIndex(clusterIdx);
                          return (
                            <div
                              key={sig}
                              className="inline-flex flex-wrap gap-1.5"
                            >
                              {cluster.map((w) => (
                                <SolverWordChip key={w} word={w} fill={fill} />
                              ))}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SolverResultsByLengthTable
                groupedByLength={groupedByLength}
                sortMode={
                  resultsView === "combo-table" ? "multiset" : "alphabetical"
                }
              />
            )}
          </>
        )}
      </section>
    </Layout>
  );
}
