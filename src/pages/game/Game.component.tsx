import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
  DURATIONS,
  RANDOM_LENGTHS,
  MIN_LENGTHS,
  GAME_PREFILL_CUSTOM_LETTERS_KEY,
} from "./Game.config";
import {
  scramble,
  pointsForWordLength,
  Field,
  Chip,
  AnswersByLengthSection,
} from "./Game.utils";

export function Game() {
  const location = useLocation();
  const navigate = useNavigate();
  const ready = useDictionary();
  const [phase, setPhase] = useState<Phase>("setup");
  const [duration, setDuration] = useState<Duration>(60);
  const [source, setSource] = useState<LetterSource>("random");
  const [randomLen, setRandomLen] = useState(6);
  const [customLetters, setCustomLetters] = useState("");
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

  useEffect(() => {
    guessRef.current = guess;
  }, [guess]);

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

      if (e.key === "Enter") {
        if (guessRef.current.trim()) {
          e.preventDefault();
          formRef.current?.requestSubmit();
        }
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        setGuess((g) => g.slice(0, -1));
        queueMicrotask(() => inputRef.current?.focus());
        return;
      }

      if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        e.preventDefault();
        setGuess((g) => g + e.key.toLowerCase());
        queueMicrotask(() => inputRef.current?.focus());
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [phase]);

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

  function start() {
    const word =
      source === "random"
        ? randomWord(randomLen)
        : customLetters.toLowerCase().replace(/[^a-z]/g, "");
    if (!word) return;
    const list = findAnagrams(word, minLen);
    setLetters(word);
    setDisplayLetters(scramble(word));
    setRankInfo(getRankOfWord(word));
    setAnswers(new Set(list));
    setFound([]);
    setGuess("");
    setShowHelp(false);
    setTimeLeft(duration);
    setPhase("playing");
    setTimeout(() => inputRef.current?.focus(), 50);
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

  function submit(e: FormEvent) {
    e.preventDefault();
    const g = guess.toLowerCase().trim();
    if (!g) return;
    if (found.includes(g)) {
      setFlash("dup");
    } else if (answers.has(g)) {
      setFound((f) => [g, ...f]);
      setFlash("ok");
    } else {
      setFlash("bad");
    }
    setGuess("");
    setTimeout(() => setFlash(null), 400);
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

  const endedTotalPoints = useMemo(
    () => found.reduce((s, w) => s + pointsForWordLength(w.length), 0),
    [found],
  );

  const endedMaxPoints = useMemo(
    () => sortedAnswers.reduce((s, w) => s + pointsForWordLength(w.length), 0),
    [sortedAnswers],
  );

  const customInvalid =
    source === "custom" && customLetters.replace(/[^a-zA-Z]/g, "").length < 3;
  const startDisabled = !ready || customInvalid;

  return (
    <Layout>
      <section className="px-8 pb-20 pt-10 sm:px-16 lg:px-0">
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
              ) : (
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
          <div className="mx-auto max-w-2xl">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
                  your letters
                </p>
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
              <input
                ref={inputRef}
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="type a word…"
                className={`w-full rounded-2xl border-2 bg-page-bg-tertiary px-6 py-5 font-mono text-2xl lowercase text-ink outline-none transition placeholder:text-text-secondary/60 ${
                  flash === "ok"
                    ? "border-success"
                    : flash === "bad"
                      ? "border-destructive"
                      : flash === "dup"
                        ? "border-accent"
                        : "border-transparent"
                }`}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </form>

            <div className="mt-5 mb-5 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
              <p className="flex flex-col sm:flex-row font-mono text-sm">
                <div>
                  <span className="text-ink">{found.length}</span>
                  <span className="text-text-secondary">
                    {" "}
                    / {answers.size} found
                  </span>
                </div>
                <div>
                  {rankInfo && (
                    <span className="text-text-secondary">
                      <span className="hidden whitespace-pre sm:inline">
                        {" · "}
                      </span>
                      rank #{rankInfo.rank.toLocaleString()} of{" "}
                      {rankInfo.total.toLocaleString()}
                    </span>
                  )}
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
                  Help
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

            {showHelp ? (
              <AnswersByLengthSection
                groupedAllByLength={groupedAllByLength}
                foundSet={foundSet}
                hintUnfound
              />
            ) : (
              found.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
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
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setPhase("setup")}
                  className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-page-bg transition hover:opacity-90"
                >
                  New game
                </button>
                <button
                  onClick={start}
                  className="rounded-full border border-border-subtle bg-page-bg-secondary px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/40"
                >
                  Play again
                </button>
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
