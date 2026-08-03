import {
  useEffect,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  groupWordsByLetterMultiset,
  letterMultisetKey,
  groupPastelAtIndex,
} from "../../lib/utils/anagramGroups";
import type { MobileInputMode, BoardQuality } from "./Game.config";
import { BOARD_QUALITIES, boardQualityLabel } from "./Game.config";

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

export function useMaxMd(): boolean {
  const [maxMd, setMaxMd] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMaxMd(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return maxMd;
}

function tileGridStyle(count: number): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
  };
}

const tileButtonClass =
  "flex aspect-square w-full items-center justify-center touch-manipulation rounded-xl border-2 border-border-subtle bg-page-bg-secondary font-display text-[1.75rem] font-semibold uppercase leading-none text-ink shadow-[0_3px_0_0_var(--color-border-subtle)] outline-none transition active:scale-95 hover:border-ink/25 hover:bg-page-bg";

const tileEmptyClass =
  "aspect-square w-full rounded-xl border-2 border-border-subtle/70 bg-page-bg-tertiary/60";

export function GuessUnderlineInput({
  slotCount,
  displayLetters,
  guess,
  pickedIndices,
  flash,
  inputRef,
  onReturn,
  onGuessKeyDown,
  variant = "inline",
  isMobile = false,
  mobileInputMode = "tiles",
}: {
  slotCount: number;
  displayLetters: string;
  guess: string;
  pickedIndices: number[];
  flash: "ok" | "bad" | "dup" | null;
  inputRef: RefObject<HTMLInputElement | null>;
  onReturn: (slotIndex: number) => void;
  onGuessKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  variant?: "inline" | "dock";
  isMobile?: boolean;
  mobileInputMode?: MobileInputMode;
}) {
  const inDock = variant === "dock";
  const keyboardMode = !isMobile || mobileInputMode === "keyboard";
  const activeSlot = Math.min(guess.length, slotCount - 1);

  const slotCellClass = "relative z-10 aspect-square w-full";

  function focusInput() {
    inputRef.current?.focus({ preventScroll: true });
  }

  return (
    <div
      role="group"
      aria-label="Enter your guess"
      className={`relative grid gap-1 rounded-2xl transition-colors ${
        inDock ? "px-0 py-2" : "mb-4 px-2 py-4"
      } ${keyboardMode ? "cursor-text" : ""} ${
        flash === "ok"
          ? "bg-success/15"
          : flash === "bad"
            ? "bg-destructive/15"
            : flash === "dup"
              ? "bg-orange-300/20"
              : "bg-page-bg-tertiary/50"
      }`}
      style={tileGridStyle(slotCount)}
      onPointerDown={keyboardMode ? focusInput : undefined}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode={keyboardMode ? "text" : "none"}
        enterKeyHint="go"
        value={guess}
        tabIndex={keyboardMode ? 0 : -1}
        onChange={() => {}}
        onKeyDown={onGuessKeyDown}
        onPaste={(e) => e.preventDefault()}
        aria-label="Type letters for your guess"
        aria-hidden={!keyboardMode}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className="pointer-events-none absolute -inset-y-1 inset-x-0 min-h-full w-full border-0 bg-transparent text-base opacity-0 outline-none"
      />
      {Array.from({ length: slotCount }, (_, slotIndex) => {
        const tileIndex = pickedIndices[slotIndex];
        const letter =
          tileIndex !== undefined ? displayLetters[tileIndex] : null;
        const isActive = !letter && slotIndex === activeSlot;

        return (
          <div
            key={slotIndex}
            className={`${slotCellClass}${
              !keyboardMode && !letter ? " pointer-events-none" : ""
            }`}
          >
            {letter ? (
              <div
                role="button"
                tabIndex={-1}
                key={`slot-${slotIndex}-${tileIndex}`}
                aria-label={`Return ${letter.toUpperCase()} to tiles`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  onReturn(slotIndex);
                }}
                className={`${tileButtonClass} aspect-auto min-h-0 animate-letter-enter-slot h-full`}
              >
                {letter}
              </div>
            ) : (
              <div
                className={`flex h-full w-full flex-col items-center justify-end ${
                  inDock ? "pb-1" : "pb-2"
                } ${keyboardMode ? "cursor-text" : ""}`}
                onPointerDown={keyboardMode ? focusInput : undefined}
              >
                <div className="w-full flex-1" aria-hidden />
                <div
                  className={`h-0.5 w-[85%] shrink-0 rounded-full transition-colors ${
                    isActive ? "bg-ink" : "bg-border-subtle"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MobileLetterBank({
  tiles,
  pickedIndices,
  onPick,
}: {
  tiles: string;
  pickedIndices: number[];
  onPick: (index: number) => void;
}) {
  const picked = new Set(pickedIndices);
  const count = tiles.length;

  return (
    <div className="grid gap-1" style={tileGridStyle(count)}>
      {tiles.split("").map((letter, index) => {
        const used = picked.has(index);
        if (used) {
          return <div key={`empty-${index}`} className={tileEmptyClass} />;
        }
        return (
          <div
            key={`tile-${index}-${letter}`}
            role="button"
            tabIndex={-1}
            aria-label={`Add ${letter.toUpperCase()} to your guess`}
            onPointerDown={(e) => {
              e.preventDefault();
              onPick(index);
            }}
            className={`${tileButtonClass} animate-letter-return-bank`}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

export function MobileEnterButton({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        onSubmit();
      }}
      className="mb-4 w-full touch-manipulation select-none rounded-2xl border border-border-subtle bg-page-bg-secondary py-7 font-mono text-sm font-semibold uppercase tracking-[0.25em] text-ink shadow-sm transition hover:border-ink/30 hover:bg-page-bg disabled:cursor-not-allowed disabled:opacity-40"
    >
      Enter
    </button>
  );
}

export function MobileLetterDock({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 touch-manipulation border-t border-border-subtle/60 bg-page-bg/95 px-0.5 pt-2 pb-[calc(20px+env(safe-area-inset-bottom))] backdrop-blur-sm overscroll-none md:hidden">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        {children}
      </div>
    </div>
  );
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

export function BoardQualityDial({
  value,
  onChange,
}: {
  value: BoardQuality;
  onChange: (value: BoardQuality) => void;
}) {
  const index = BOARD_QUALITIES.indexOf(value);
  const safeIndex = index < 0 ? 0 : index;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="font-display text-2xl tracking-tight text-ink">
          {boardQualityLabel(value)}
        </span>
        <span className="font-mono text-xs text-text-secondary">
          {value === null
            ? "any dictionary word"
            : `top ${value} boards`}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={BOARD_QUALITIES.length - 1}
        step={1}
        value={safeIndex}
        onChange={(e) => {
          const next = BOARD_QUALITIES[Number(e.target.value)];
          if (next !== undefined) onChange(next);
        }}
        aria-label="Board quality"
        className="board-quality-dial w-full cursor-pointer"
      />

      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-text-secondary">
        <span>Any</span>
        <span>Top 10</span>
      </div>
    </div>
  );
}

export function MobileInputModeSwitch({
  mode,
  onChange,
}: {
  mode: MobileInputMode;
  onChange: (mode: MobileInputMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip
        active={mode === "tiles"}
        onClick={() => onChange("tiles")}
        size="sm"
      >
        Tiles
      </Chip>
      <Chip
        active={mode === "keyboard"}
        onClick={() => onChange("keyboard")}
        size="sm"
      >
        Keyboard
      </Chip>
    </div>
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
