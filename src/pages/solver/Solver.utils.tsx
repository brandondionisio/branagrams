import { useNavigate } from "react-router-dom";
import {
  groupPastelAtIndex,
  groupWordsByLetterMultiset,
  letterMultisetKey,
} from "../../lib/utils/anagramGroups";
import { pointsForWordLength } from "../game/Game.utils";
import {
  GAME_PREFILL_CUSTOM_LETTERS_KEY,
  solverPathForLetters,
} from "./Solver.config";

export function SolverWordChip({
  word,
  fill,
}: {
  word: string;
  fill: string;
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
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 min-w-24 -translate-x-1/2 pb-2 opacity-0 transition-opacity duration-100 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100"
        role="menu"
        aria-label={`Use “${word}” in…`}
      >
        <div className="overflow-hidden rounded-md bg-page-bg-secondary shadow-md">
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition first:rounded-t-md last:rounded-b-md hover:bg-page-bg-tertiary"
            onClick={() => navigate(solverPathForLetters(word))}
          >
            Solver
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition first:rounded-t-md last:rounded-b-md hover:bg-page-bg-tertiary"
            onClick={() =>
              navigate("/game", {
                state: { [GAME_PREFILL_CUSTOM_LETTERS_KEY]: word },
              })
            }
          >
            Game
          </button>
        </div>
      </div>
    </span>
  );
}

export function SolverResultsByLengthTable({
  groupedByLength,
  sortMode,
}: {
  groupedByLength: [number, string[]][];
  sortMode: "multiset" | "alphabetical";
}) {
  if (groupedByLength.length === 0) return null;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
      {groupedByLength.map(([len, ws], columnIdx) => {
        const ptsEach = pointsForWordLength(len);
        const lengthColor = groupPastelAtIndex(columnIdx);
        return (
          <div
            key={len}
            className="rounded-lg border border-border-subtle bg-page-bg-secondary px-2 py-1.5 shadow-sm"
          >
            <p className="mb-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-secondary">
              {len} letters
            </p>
            <p className="mb-1 border-b border-border-subtle/80 pb-1 font-mono text-[10px] font-semibold tabular-nums text-ink">
              {ptsEach.toLocaleString()} pts
            </p>
            <div className="flex min-w-0 flex-col gap-1.5">
              {sortMode === "multiset"
                ? groupWordsByLetterMultiset(ws).map((cluster, clusterIdx) => {
                    const sig = letterMultisetKey(cluster[0]);
                    const groupColor = groupPastelAtIndex(clusterIdx);
                    return (
                      <div
                        key={sig}
                        className="relative flex min-w-0 flex-col gap-0.5 pr-2.5"
                      >
                        <div
                          aria-hidden
                          className="pointer-events-none absolute top-0 right-0 bottom-0 z-1 flex w-2 flex-col items-center"
                        >
                          <div
                            className="h-0.5 w-2 shrink-0 rounded-sm"
                            style={{ backgroundColor: groupColor }}
                          />
                          <div className="flex min-h-0 w-full min-w-0 flex-1 justify-center">
                            <div
                              className="h-full w-0.5"
                              style={{ backgroundColor: groupColor }}
                            />
                          </div>
                          <div
                            className="h-0.5 w-2 shrink-0 rounded-sm"
                            style={{ backgroundColor: groupColor }}
                          />
                        </div>
                        {cluster.map((w) => (
                          <SolverTableWordRow
                            key={w}
                            word={w}
                            fill={groupColor}
                          />
                        ))}
                      </div>
                    );
                  })
                : ws.map((w) => (
                    <SolverTableWordRow key={w} word={w} fill={lengthColor} />
                  ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SolverTableWordRow({ word, fill }: { word: string; fill: string }) {
  return (
    <span
      title={word}
      className="block min-w-0 truncate rounded-r py-0.5 pl-2 pr-2 font-mono text-[11px] leading-tight text-ink"
      style={{ backgroundColor: fill }}
    >
      {word}
    </span>
  );
}
