import { useDeferredValue, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { GAME_PREFILL_CUSTOM_LETTERS_KEY } from "../locationStateKeys";
import {
  groupPastelAtIndex,
  groupWordsByLetterMultiset,
  letterMultisetKey,
} from "../lib/anagramGroups";
import { findAnagrams, useDictionary } from "../lib/anagrams";

const MIN_LENGTHS = [2, 3, 4, 5, 6, 7] as const;

function FinderWordChip({
  word,
  fill,
  onUseInFinder,
}: {
  word: string;
  fill: string;
  onUseInFinder: (w: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <span className="group relative inline-block align-middle">
      <span
        className="block cursor-default rounded-md px-2.5 py-1.5 font-mono text-sm leading-normal text-ink ring-1 ring-ink/6"
        style={{ backgroundColor: fill }}
      >
        {word}
      </span>
      <div
        className="pointer-events-none invisible absolute left-0 top-[calc(100%-6px)] z-30 min-w-36 rounded-md border border-border-subtle bg-page-bg-secondary py-1 opacity-0 shadow-md transition-opacity duration-100 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100"
        role="menu"
        aria-label={`Use “${word}” in…`}
      >
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition hover:bg-page-bg-tertiary"
          onClick={() => onUseInFinder(word)}
        >
          Finder
        </button>
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition hover:bg-page-bg-tertiary"
          onClick={() =>
            navigate("/game", {
              state: { [GAME_PREFILL_CUSTOM_LETTERS_KEY]: word },
            })
          }
        >
          Game
        </button>
      </div>
    </span>
  );
}

export function Finder() {
  const lettersInputRef = useRef<HTMLInputElement>(null);
  const ready = useDictionary();
  const [input, setInput] = useState("");
  const [minLen, setMinLen] = useState(3);

  const deferredInput = useDeferredValue(input);
  const results = useMemo(
    () => (ready ? findAnagrams(deferredInput, minLen) : []),
    [deferredInput, minLen, ready],
  );

  const grouped = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const w of results) {
      if (!m.has(w.length)) m.set(w.length, []);
      m.get(w.length)!.push(w);
    }
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [results]);

  return (
    <Layout>
      <section className="px-8 pb-20 pt-10 sm:px-16 lg:px-0">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          / finder
        </p>
        <h1 className="mb-12 text-5xl tracking-tight text-ink sm:text-6xl">
          Reveal anagrams
        </h1>

        <div className="space-y-8">
          <div>
            <label className="mb-3 block font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              Letters
            </label>
            <input
              ref={lettersInputRef}
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
        </div>

        <div className="mt-16 mb-6 flex items-baseline justify-between border-b border-border-subtle pb-3">
          <h2 className="text-2xl text-ink">Results</h2>
          <span className="font-mono text-sm text-text-secondary">
            {results.length} words
          </span>
        </div>

        {!ready ? (
          <p className="font-mono text-sm text-text-secondary">
            loading dictionary…
          </p>
        ) : results.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No words found. Try different letters.
          </p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([len, ws]) => (
              <div key={len}>
                <p className="mb-3 font-mono text-xs lowercase text-accent">
                  {len} letters · {ws.length}
                </p>
                <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                  {groupWordsByLetterMultiset(ws).map((cluster, clusterIdx) => {
                    const sig = letterMultisetKey(cluster[0]);
                    const fill = groupPastelAtIndex(clusterIdx);
                    return (
                      <div key={sig} className="inline-flex flex-wrap gap-1.5">
                        {cluster.map((w) => (
                          <FinderWordChip
                            key={w}
                            word={w}
                            fill={fill}
                            onUseInFinder={(picked) => {
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
        )}
      </section>
    </Layout>
  );
}
