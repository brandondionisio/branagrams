import type { ReactNode } from "react";
import {
  groupWordsByLetterMultiset,
  letterMultisetKey,
  groupPastelAtIndex,
} from "../../lib/utils/anagramGroups";

export function animateNumber(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  options?: { duration?: number; onDone?: () => void },
): () => void {
  const duration = options?.duration ?? 450;
  const start = performance.now();
  let frame = 0;

  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    onUpdate(Math.round(from + (to - from) * eased));
    if (t < 1) {
      frame = requestAnimationFrame(tick);
    } else {
      onUpdate(to);
      options?.onDone?.();
    }
  };

  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

export function pointsForWordLength(length: number): number {
  switch (length) {
    case 2:
      return 50;
    case 3:
      return 100;
    case 4:
      return 400;
    case 5:
      return 1200;
    case 6:
      return 2000;
    default:
      if (length >= 7) return 2000 + (length - 6) * 1000;
      return 0;
  }
}

export function scramble(word: string): string {
  if (word.length < 2) return word;
  const arr = word.split("");
  for (let attempt = 0; attempt < 5; attempt++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const out = arr.join("");
    if (out !== word) return out;
  }
  return arr.join("");
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </p>
      {children}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  const sizing =
    size === "sm" ? "h-9 min-w-9 px-3 text-sm" : "h-10 px-4 text-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full font-mono transition ${sizing} ${
        active
          ? "bg-ink text-page-bg"
          : "bg-page-bg-tertiary text-ink hover:bg-border-subtle"
      }`}
    >
      {children}
    </button>
  );
}

export function AnswersByLengthSection({
  groupedAllByLength,
  foundSet,
  hintUnfound,
}: {
  groupedAllByLength: [number, string[]][];
  foundSet: Set<string>;
  hintUnfound: boolean;
}) {
  if (groupedAllByLength.length === 0) return null;

  return (
    <section>
      <p className="mb-2 font-mono text-xs text-text-secondary">
        <span className="text-success">found {foundSet.size}</span>
        <span className="text-text-secondary"> · </span>
        <span className="text-destructive">
          missed{" "}
          {groupedAllByLength.reduce((n, [, ws]) => n + ws.length, 0) -
            foundSet.size}
        </span>
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-2">
        {groupedAllByLength.map(([len, ws]) => {
          const ptsEach = pointsForWordLength(len);
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
                {groupWordsByLetterMultiset(ws).map((cluster, clusterIdx) => {
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
                      {cluster.map((w) => {
                        const got = foundSet.has(w);
                        let row: ReactNode;
                        if (hintUnfound && !got) {
                          row = (
                            <span
                              key={w}
                              className="block min-h-4.5 min-w-0 rounded-r border-l-[3px] border-border-subtle bg-border-subtle/45"
                              aria-label={`Hidden word, ${w.length} letters`}
                            />
                          );
                        } else {
                          row = (
                            <span
                              key={w}
                              aria-label={got ? `${w}, found` : `${w}, missed`}
                              title={got ? "Found" : "Missed"}
                              className={`block min-w-0 truncate rounded-r py-0.5 pl-2 pr-2 font-mono text-[11px] leading-tight ${
                                got
                                  ? "border-l-[3px] border-success bg-success/20 font-semibold text-success"
                                  : "border-l-[3px] border-destructive/60 bg-destructive/11 font-normal text-text-secondary"
                              }`}
                            >
                              {w}
                            </span>
                          );
                        }
                        return row;
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
