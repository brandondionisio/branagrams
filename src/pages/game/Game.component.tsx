import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";
import {
  findAnagrams,
  getRankOfWord,
  randomWord,
  useDictionary,
  type RankInfo,
} from "../../lib/utils/anagrams";
import {
  type Phase,
  type Duration,
  type LetterSource,
  type CustomLetterOrder,
  type MobileInputMode,
  type BoardQuality,
  DURATIONS,
  RANDOM_LENGTHS,
  MIN_LENGTHS,
  DEFAULT_BOARD_QUALITY,
  GAME_PREFILL_CUSTOM_LETTERS_KEY,
} from "./Game.config";
import {
  scramble,
  animateNumber,
  pointsForWordLength,
  Field,
  Chip,
  BoardQualityDial,
  AnswersByLengthSection,
  GuessUnderlineInput,
  MobileLetterBank,
  MobileEnterButton,
  MobileInputModeSwitch,
  MobileLetterDock,
  useMaxMd,
} from "./Game.utils";

export function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const ready = useDictionary();
  const isMobile = useMaxMd();
  const [phase, setPhase] = useState<Phase>("setup");
  const [duration, setDuration] = useState<Duration>(60);
  const [source, setSource] = useState<LetterSource>("random");
  const [randomLen, setRandomLen] = useState(6);
  const [boardQuality, setBoardQuality] = useState<BoardQuality>(
    DEFAULT_BOARD_QUALITY,
  );
  const [customLetters, setCustomLetters] = useState("");
  const [customLetterOrder, setCustomLetterOrder] =
    useState<CustomLetterOrder>("random");
  const [minLen, setMinLen] = useState(3);

  const [letters, setLetters] = useState("");
  const [displayLetters, setDisplayLetters] = useState("");
  const [rankInfo, setRankInfo] = useState<RankInfo | null>(null);
  const [answers, setAnswers] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<string[]>([]);
  const [guess, setGuess] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [flash, setFlash] = useState<"ok" | "bad" | "dup" | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const guessRef = useRef("");
  const cancelPointsAnim = useRef<(() => void) | null>(null);
  const [displayedPoints, setDisplayedPoints] = useState(0);
  const [pointsAnimating, setPointsAnimating] = useState(false);
  const [pickedTileIndices, setPickedTileIndices] = useState<number[]>([]);
  const [mobileInputMode, setMobileInputMode] =
    useState<MobileInputMode>("tiles");
  useEffect(() => {
    guessRef.current = guess;
  }, [guess]);

  function syncGuessFromPicks(indices: number[]) {
    setGuess(indices.map((i) => displayLetters[i] ?? "").join(""));
  }

  function pickTile(index: number) {
    if (pickedTileIndices.includes(index)) return;
    if (pickedTileIndices.length >= letters.length) return;
    const next = [...pickedTileIndices, index];
    setPickedTileIndices(next);
    syncGuessFromPicks(next);
    if (!isMobile || mobileInputMode === "keyboard") {
      queueMicrotask(() => inputRef.current?.focus({ preventScroll: true }));
    }
  }

  function appendTypedLetter(letter: string) {
    for (let i = 0; i < displayLetters.length; i++) {
      if (!pickedTileIndices.includes(i) && displayLetters[i] === letter) {
        pickTile(i);
        return;
      }
    }
  }

  function handleGuessKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        setPhase("ended");
        return;
      }
      if (guess.trim()) formRef.current?.requestSubmit();
      return;
    }
    if (e.shiftKey && (e.key === "h" || e.key === "H")) {
      e.preventDefault();
      setShowHelp((v) => !v);
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      removeLastLetter();
      return;
    }
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      appendTypedLetter(e.key.toLowerCase());
    }
  }

  function returnFromSlot(slotIndex: number) {
    if (slotIndex >= pickedTileIndices.length) return;
    const next = pickedTileIndices.filter((_, i) => i !== slotIndex);
    setPickedTileIndices(next);
    syncGuessFromPicks(next);
  }

  function removeLastLetter() {
    const next = pickedTileIndices.slice(0, -1);
    setPickedTileIndices(next);
    syncGuessFromPicks(next);
  }

  useEffect(() => {
    if (phase !== "playing") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      if (target === inputRef.current) return;

      if (target instanceof HTMLTextAreaElement) return;

      if (target instanceof HTMLInputElement) {
        if (target.type === "checkbox" && e.key === " ") return;
        if (
          target.type === "text" ||
          target.type === "search" ||
          target.type === "url" ||
          target.type === "email" ||
          target.type === "password"
        ) {
          return;
        }
      }

      if (e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        setPhase("ended");
        return;
      }

      if (e.shiftKey && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        setShowHelp((v) => !v);
        return;
      }

      if (e.key === "Enter") {
        if (guessRef.current.trim()) {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        removeLastLetter();
        if (!isMobile || mobileInputMode === "keyboard") {
          queueMicrotask(() =>
            inputRef.current?.focus({ preventScroll: true }),
          );
        }
        return;
      }

      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        appendTypedLetter(e.key.toLowerCase());
        if (!isMobile || mobileInputMode === "keyboard") {
          queueMicrotask(() =>
            inputRef.current?.focus({ preventScroll: true }),
          );
        }
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [phase, displayLetters, pickedTileIndices, isMobile, mobileInputMode]);

  useEffect(() => {
    if (phase !== "ended") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (e.shiftKey) start();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    phase,
    source,
    randomLen,
    boardQuality,
    customLetters,
    customLetterOrder,
    minLen,
    duration,
    isMobile,
  ]);

  useEffect(() => {
    if (phase !== "setup") return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== "Enter" || e.shiftKey) return;

      const target = e.target;
      if (target instanceof HTMLTextAreaElement) return;
      if (
        target instanceof HTMLInputElement &&
        (target.type === "text" ||
          target.type === "search" ||
          target.type === "url" ||
          target.type === "email" ||
          target.type === "password")
      ) {
        return;
      }

      if (!ready) return;
      if (
        source === "custom" &&
        customLetters.replace(/[^a-zA-Z]/g, "").length < 3
      ) {
        return;
      }

      e.preventDefault();
      start();
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [
    phase,
    ready,
    source,
    customLetters,
    customLetterOrder,
    randomLen,
    boardQuality,
    minLen,
    duration,
    isMobile,
  ]);

  useEffect(() => {
    if (phase !== "setup") return;
    const raw = (location.state as Record<string, unknown> | null)?.[
      GAME_PREFILL_CUSTOM_LETTERS_KEY
    ];
    if (typeof raw !== "string" || !raw) return;
    const cleaned = raw.toLowerCase().replace(/[^a-z]/g, "");
    if (cleaned.length >= 3) {
      setSource("custom");
      setCustomLetters(cleaned);
    }

    navigate(location.pathname, { replace: true, state: {} });
  }, [phase, location.pathname, location.state, navigate]);

  useEffect(() => () => cancelPointsAnim.current?.(), []);

  function foundPoints(words: string[]) {
    return words.reduce((s, w) => s + pointsForWordLength(w.length), 0);
  }

  function animatePoints(from: number, to: number) {
    cancelPointsAnim.current?.();
    setPointsAnimating(true);
    cancelPointsAnim.current = animateNumber(from, to, setDisplayedPoints, {
      onDone: () => {
        setPointsAnimating(false);
        cancelPointsAnim.current = null;
      },
    });
  }

  function beginRound(word: string) {
    if (!word) return;
    const list = findAnagrams(word, minLen);
    cancelPointsAnim.current?.();
    cancelPointsAnim.current = null;
    setPointsAnimating(false);
    setLetters(word);
    const keepTypedOrder =
      source === "custom" && customLetterOrder === "as-typed";
    setDisplayLetters(keepTypedOrder ? word : scramble(word));
    setRankInfo(getRankOfWord(word));
    setAnswers(new Set(list));
    setFound([]);
    setDisplayedPoints(0);
    setPickedTileIndices([]);
    setGuess("");
    setShowHelp(false);
    setMobileInputMode("tiles");
    setTimeLeft(duration);
    setPhase("playing");
    if (!isMobile) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function start() {
    const word =
      source === "random"
        ? randomWord(randomLen, boardQuality)
        : customLetters.toLowerCase().replace(/[^a-z]/g, "");
    beginRound(word);
  }

  function replaySet() {
    if (!letters) return;
    beginRound(letters);
  }

  function changeMobileInputMode(mode: MobileInputMode) {
    setMobileInputMode(mode);
    if (mode === "tiles") {
      inputRef.current?.blur();
    } else {
      queueMicrotask(() => inputRef.current?.focus({ preventScroll: true }));
    }
  }

  useEffect(() => {
    if (phase !== "playing" || duration === 0) return;
    if (timeLeft <= 0) {
      setPhase("ended");
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, duration]);

  useEffect(() => {
    if (
      phase === "playing" &&
      answers.size > 0 &&
      found.length === answers.size
    ) {
      setPhase("ended");
    }
  }, [found, answers, phase]);

  useEffect(() => {
    if (phase !== "playing" || !isMobile || mobileInputMode !== "tiles") {
      return;
    }
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevOverscroll = body.style.overscrollBehavior;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevOverscroll;
    };
  }, [phase, isMobile, mobileInputMode]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const g = guess.toLowerCase().trim();
    if (!g) return;
    let flashMs = 400;
    if (found.includes(g)) {
      setFlash("dup");
    } else if (answers.has(g)) {
      const from = foundPoints(found);
      const to = from + pointsForWordLength(g.length);
      setFound((f) => [g, ...f]);
      setFlash("ok");
      animatePoints(from, to);
      flashMs = 500;
    } else {
      setFlash("bad");
    }
    setGuess("");
    setPickedTileIndices([]);
    setTimeout(() => setFlash(null), flashMs);
  }

  const sortedAnswers = useMemo(
    () =>
      Array.from(answers).sort(
        (a, b) => b.length - a.length || a.localeCompare(b),
      ),
    [answers],
  );

  const groupedAllByLength = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const w of sortedAnswers) {
      if (!m.has(w.length)) m.set(w.length, []);
      m.get(w.length)!.push(w);
    }
    for (const [, ws] of m) ws.sort((a, b) => a.localeCompare(b));
    return Array.from(m.entries()).sort((a, b) => b[0] - a[0]);
  }, [sortedAnswers]);

  const foundSet = useMemo(() => new Set(found), [found]);

  const endedTotalPoints = useMemo(() => foundPoints(found), [found]);

  const endedMaxPoints = useMemo(
    () => sortedAnswers.reduce((s, w) => s + pointsForWordLength(w.length), 0),
    [sortedAnswers],
  );

  const customInvalid =
    source === "custom" && customLetters.replace(/[^a-zA-Z]/g, "").length < 3;
  const startDisabled = !ready || customInvalid;

  return (
    <Layout>
      <section
        className={`px-4 sm:px-16 ${
          phase === "playing" ? "max-md:py-0" : "pb-20 pt-10"
        }`}
      >
        {phase === "setup" && (
          <>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
              / game
            </p>
            <h1 className="mb-12 text-5xl tracking-tight text-ink sm:text-6xl">
              Time yourself
            </h1>

            <div className="max-w-xl space-y-7">
              <Field label="Time">
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <Chip
                      key={d}
                      active={duration === d}
                      onClick={() => setDuration(d)}
                    >
                      {d === 0 ? "∞" : `${d}s`}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Field label="Letters">
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={source === "random"}
                    onClick={() => setSource("random")}
                  >
                    Random
                  </Chip>
                  <Chip
                    active={source === "custom"}
                    onClick={() => setSource("custom")}
                  >
                    Custom
                  </Chip>
                </div>
              </Field>

              {source === "random" ? (
                <>
                  <Field label="Length">
                    <div className="flex flex-wrap gap-1.5">
                      {RANDOM_LENGTHS.map((n) => (
                        <Chip
                          key={n}
                          size="sm"
                          active={randomLen === n}
                          onClick={() => setRandomLen(n)}
                        >
                          {n}
                        </Chip>
                      ))}
                    </div>
                  </Field>

                  <Field label="Board quality">
                    <BoardQualityDial
                      value={boardQuality}
                      onChange={setBoardQuality}
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Custom letters">
                    <input
                      type="text"
                      value={customLetters}
                      onChange={(e) => setCustomLetters(e.target.value)}
                      placeholder="enter letters…"
                      className="w-full border-b border-border-subtle bg-transparent pb-2 font-display text-2xl lowercase text-ink outline-none transition focus:border-accent"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </Field>

                  <Field label="Letter order">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        active={customLetterOrder === "random"}
                        onClick={() => setCustomLetterOrder("random")}
                      >
                        Random
                      </Chip>
                      <Chip
                        active={customLetterOrder === "as-typed"}
                        onClick={() => setCustomLetterOrder("as-typed")}
                      >
                        As typed
                      </Chip>
                    </div>
                  </Field>
                </>
              )}

              <Field label="Min answer length">
                <div className="flex flex-wrap gap-1.5">
                  {MIN_LENGTHS.map((n) => (
                    <Chip
                      key={n}
                      size="sm"
                      active={minLen === n}
                      onClick={() => setMinLen(n)}
                    >
                      {n}+
                    </Chip>
                  ))}
                </div>
              </Field>

              <div className="flex items-center gap-4">
                <button
                  onClick={start}
                  disabled={startDisabled}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-sm font-medium text-page-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Start <span aria-hidden>→</span>
                </button>
                {!ready && (
                  <span className="font-mono text-xs text-text-secondary">
                    loading dictionary…
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        {phase === "playing" && (
          <div
            className={`mx-auto max-w-2xl ${
              isMobile && mobileInputMode === "tiles" ? "max-md:pb-80" : ""
            }`}
          >
            <div className="mb-6 flex items-end justify-between max-md:mb-4">
              <div>
                <div className="mb-2 flex flex-row items-center text-xs text-text-secondary">
                  <span className="font-mono uppercase tracking-[0.2em]">
                    your letters
                  </span>
                  {rankInfo && (
                    <div className="text-sm">
                      <span className="mx-3" aria-hidden>
                        ·
                      </span>
                      <span>
                        rank #{rankInfo.rank.toLocaleString()} of{" "}
                        {rankInfo.total.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="font-display text-5xl tracking-[0.15em] text-ink">
                  {displayLetters.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
                  time
                </p>
                <p
                  className={`font-display text-5xl tabular-nums ${
                    duration !== 0 && timeLeft <= 10
                      ? "text-destructive"
                      : "text-ink"
                  }`}
                >
                  {duration === 0 ? "∞" : timeLeft}
                </p>
              </div>
            </div>

            <form ref={formRef} onSubmit={submit}>
              {(!isMobile || mobileInputMode === "keyboard") && (
                <GuessUnderlineInput
                  slotCount={letters.length}
                  displayLetters={displayLetters}
                  guess={guess}
                  pickedIndices={pickedTileIndices}
                  flash={flash}
                  inputRef={inputRef}
                  onReturn={returnFromSlot}
                  onGuessKeyDown={handleGuessKeyDown}
                  isMobile={isMobile}
                  mobileInputMode={mobileInputMode}
                />
              )}

              {isMobile && (
                <div className="mb-4 max-md:mb-3">
                  <MobileInputModeSwitch
                    mode={mobileInputMode}
                    onChange={changeMobileInputMode}
                  />
                </div>
              )}

              <div className="mt-4 mb-4 flex gap-3 flex-row items-baseline justify-between max-md:mt-3 max-md:mb-3">
                <p className="flex flex-col sm:flex-row font-mono text-sm">
                  <div>
                    <span className="text-ink">{found.length}</span>
                    <span className="text-text-secondary">
                      {" "}
                      / {answers.size} found
                    </span>
                  </div>
                  <div>
                    <span
                      className={`tabular-nums transition-colors duration-200 ${
                        flash === "ok" || pointsAnimating
                          ? "text-success"
                          : flash === "bad"
                            ? "text-destructive"
                            : "text-text-secondary"
                      }`}
                    >
                      <span className="mx-3 hidden sm:inline" aria-hidden>
                        ·
                      </span>
                      {displayedPoints.toLocaleString()} pts
                    </span>
                  </div>
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
                  <label className="inline-flex w-fit cursor-pointer items-center gap-2 font-mono text-sm text-text-secondary select-none">
                    <input
                      type="checkbox"
                      checked={showHelp}
                      onChange={(e) => setShowHelp(e.target.checked)}
                      className="size-4 shrink-0 rounded border-border-subtle accent-ink"
                    />
                    help
                  </label>
                  <span
                    className="hidden h-8 w-px shrink-0 bg-border-subtle sm:mx-4 sm:block"
                    aria-hidden
                  />
                  <button
                    type="button"
                    onClick={() => setPhase("ended")}
                    className="w-fit font-mono text-sm text-text-secondary underline decoration-border-subtle underline-offset-4 transition hover:text-ink hover:decoration-ink/40"
                  >
                    give up
                  </button>
                </div>
              </div>
            </form>

            {showHelp ? (
              <AnswersByLengthSection
                groupedAllByLength={groupedAllByLength}
                foundSet={foundSet}
                hintUnfound
              />
            ) : (
              found.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {found.map((w) => (
                    <span
                      key={w}
                      className="rounded-md bg-success/10 px-2.5 py-1 font-mono text-sm text-success"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )
            )}

            {isMobile && mobileInputMode === "tiles" && (
              <MobileLetterDock>
                <MobileEnterButton
                  disabled={guess.trim().length === 0}
                  onSubmit={() => formRef.current?.requestSubmit()}
                />
                <GuessUnderlineInput
                  variant="dock"
                  slotCount={letters.length}
                  displayLetters={displayLetters}
                  guess={guess}
                  pickedIndices={pickedTileIndices}
                  flash={flash}
                  inputRef={inputRef}
                  onReturn={returnFromSlot}
                  onGuessKeyDown={handleGuessKeyDown}
                  isMobile
                  mobileInputMode="tiles"
                />
                <MobileLetterBank
                  tiles={displayLetters}
                  pickedIndices={pickedTileIndices}
                  onPick={pickTile}
                />
              </MobileLetterDock>
            )}
          </div>
        )}

        {phase === "ended" && (
          <div>
            <div className="mb-10 sm:mb-12">
              <div className="flex flex-row items-start justify-between gap-3 sm:gap-6">
                <div className="flex min-w-0 flex-col items-start">
                  <div className="mb-1 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
                    / results
                  </div>
                  <h1 className="m-0 whitespace-nowrap font-display text-[clamp(1.5rem,5.2vw,3.75rem)] tabular-nums leading-none tracking-tight text-ink">
                    {found.length} / {answers.size}{" "}
                    <span className="font-mono text-[0.55em] font-normal tracking-normal text-text-secondary">
                      words
                    </span>
                  </h1>
                </div>
                <div className="flex shrink-0 flex-col items-end text-right">
                  <div className="mb-1 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
                    total points
                  </div>
                  <div className="mb-4 sm:mb-6 whitespace-nowrap font-display text-[clamp(1.5rem,5.2vw,3.75rem)] tabular-nums leading-none tracking-tight text-ink">
                    {endedTotalPoints.toLocaleString()} /{" "}
                    {endedMaxPoints.toLocaleString()}{" "}
                    <span className="font-mono text-[0.55em] font-normal tracking-normal text-text-secondary">
                      pts
                    </span>
                  </div>
                </div>
              </div>
              <p className="mb-6 text-text-secondary sm:mb-8">
                from{" "}
                <span className="font-mono text-ink">
                  {letters.toUpperCase()}
                </span>
                {rankInfo && (
                  <span className="text-text-secondary">
                    <span className="mx-3" aria-hidden>
                      ·
                    </span>
                    rank #{rankInfo.rank.toLocaleString()} of{" "}
                    {rankInfo.total.toLocaleString()}
                  </span>
                )}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPhase("setup")}
                  className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-page-bg transition hover:opacity-90"
                >
                  New game
                </button>
                <button
                  type="button"
                  onClick={start}
                  className="rounded-full border border-border-subtle bg-page-bg-secondary px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
                >
                  Play again
                </button>
                {source === "random" && (
                  <button
                    type="button"
                    onClick={replaySet}
                    className="rounded-full border border-border-subtle bg-page-bg-secondary px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
                  >
                    Replay set
                  </button>
                )}
              </div>
            </div>

            <AnswersByLengthSection
              groupedAllByLength={groupedAllByLength}
              foundSet={foundSet}
              hintUnfound={false}
            />
          </div>
        )}
      </section>
    </Layout>
  );
}
