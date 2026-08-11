import { useEffect, useState } from "react";
import topWordsJson from "../data/topWords.json";

interface PrecomputedEntry {
  count: number;
  top: string[];
  rankTop: string[];
}

const PRECOMPUTED_TOP: Record<string, PrecomputedEntry> = topWordsJson;

const TOP_SIG_RANK = new Map<number, Map<string, number>>();

export interface RankInfo {
  rank: number;
  total: number;
}

let WORDS: string[] = [];
let DICT: Set<string> = new Set();
let WORD_COUNTS: Int8Array[] = [];
let SIG_TO_WORDS: Map<string, string[]> = new Map();
const SIG_SCORE = new Map<string, number>();
const SIG_RANK_SCORE = new Map<string, number>();
const TOP_BY_LENGTH = new Map<number, string[]>();
let loaded = false;
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const A = "a".charCodeAt(0);

export function loadDictionary(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = fetch(`${import.meta.env.BASE_URL}dictionary.txt`)
    .then((r) => {
      if (!r.ok) throw new Error(`Dictionary load failed: ${r.status}`);
      return r.text();
    })
    .then((text) => {
      const list = text
        .split(/\r?\n/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length >= 2 && /^[a-z]+$/.test(w));
      WORDS = list;
      DICT = new Set(list);
      const counts: Int8Array[] = new Array(list.length);
      const sigMap = new Map<string, string[]>();
      for (let i = 0; i < list.length; i++) {
        const w = list[i];
        const c = new Int8Array(26);
        for (let j = 0; j < w.length; j++) c[w.charCodeAt(j) - A]++;
        counts[i] = c;
        const sig = signatureOf(w);
        let arr = sigMap.get(sig);
        if (!arr) {
          arr = [];
          sigMap.set(sig, arr);
        }
        arr.push(w);
      }
      WORD_COUNTS = counts;
      SIG_TO_WORDS = sigMap;
      loaded = true;
      listeners.forEach((fn) => fn());
    });
  return loadPromise;
}

export function isDictionaryReady(): boolean {
  return loaded;
}

export function useDictionary(): boolean {
  const [ready, setReady] = useState(loaded);
  useEffect(() => {
    if (loaded) {
      setReady(true);
      return;
    }
    const onReady = () => setReady(true);
    listeners.add(onReady);
    loadDictionary();
    return () => {
      listeners.delete(onReady);
    };
  }, []);
  return ready;
}

function countsOf(s: string): Int8Array {
  const c = new Int8Array(26);
  for (let i = 0; i < s.length; i++) {
    const k = s.charCodeAt(i) - A;
    if (k >= 0 && k < 26) c[k]++;
  }
  return c;
}

function wordMatchesLettersAndWildcards(
  avail: Int8Array,
  wildcards: number,
  need: Int8Array,
): boolean {
  let w = wildcards;
  for (let k = 0; k < 26; k++) {
    const deficit = need[k] - avail[k];
    if (deficit <= 0) continue;
    if (deficit > w) return false;
    w -= deficit;
  }
  return true;
}

export function findAnagrams(input: string, minLen = 2): string[] {
  if (!loaded) return [];
  const raw = input.toLowerCase().replace(/[^a-z?]/g, "");
  let wildcards = 0;
  let letterBuf = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "?") wildcards++;
    else letterBuf += ch;
  }
  if (!letterBuf && wildcards === 0) return [];
  const avail = countsOf(letterBuf);
  const maxLen = letterBuf.length + wildcards;
  const results: string[] = [];
  for (let i = 0; i < WORDS.length; i++) {
    const w = WORDS[i];
    if (w.length < minLen || w.length > maxLen) continue;
    const c = WORD_COUNTS[i];
    if (wildcards === 0) {
      let ok = true;
      for (let k = 0; k < 26; k++) {
        if (c[k] > avail[k]) {
          ok = false;
          break;
        }
      }
      if (ok) results.push(w);
    } else if (wordMatchesLettersAndWildcards(avail, wildcards, c)) {
      results.push(w);
    }
  }
  return results.sort((a, b) => b.length - a.length || a.localeCompare(b));
}

export function isValidWord(w: string): boolean {
  return DICT.has(w.toLowerCase());
}

function signatureOf(w: string): string {
  return w.split("").sort().join("");
}

function pointsForLength(len: number): number {
  if (len < 3) return 0;
  switch (len) {
    case 3:
      return 100;
    case 4:
      return 400;
    case 5:
      return 1200;
    case 6:
      return 2000;
    case 7:
      return 3000;
    default:
      return 3000 + (len - 7) * 1000;
  }
}

function subSignatures(sig: string): string[] {
  const seen = new Set<string>();
  const stack: Array<[number, string]> = [[0, ""]];
  while (stack.length > 0) {
    const [idx, current] = stack.pop()!;
    if (idx === sig.length) {
      seen.add(current);
      continue;
    }
    stack.push([idx + 1, current]);
    stack.push([idx + 1, current + sig[idx]]);
  }
  return Array.from(seen);
}

function scoreOfSignature(sig: string): number {
  const cached = SIG_SCORE.get(sig);
  if (cached !== undefined) return cached;
  let total = 0;
  for (const sub of subSignatures(sig)) {
    if (sub.length < 3) continue;
    const words = SIG_TO_WORDS.get(sub);
    if (!words) continue;
    total += words.length * pointsForLength(sub.length);
  }
  SIG_SCORE.set(sig, total);
  return total;
}

function rankScoreOfSignature(sig: string): number {
  const cached = SIG_RANK_SCORE.get(sig);
  if (cached !== undefined) return cached;
  const minLen = Math.max(3, sig.length - 1);
  let total = 0;
  for (const sub of subSignatures(sig)) {
    if (sub.length < minLen) continue;
    const words = SIG_TO_WORDS.get(sub);
    if (!words) continue;
    total += words.length * pointsForLength(sub.length);
  }
  SIG_RANK_SCORE.set(sig, total);
  return total;
}

const TOP_POOL_SIZE = 1000;
const ALL_BY_LENGTH = new Map<number, string[]>();

function representativesOfLength(length: number): string[] {
  const cached = ALL_BY_LENGTH.get(length);
  if (cached) return cached;

  const reps = new Map<string, string>();
  for (const w of WORDS) {
    if (w.length !== length) continue;
    const sig = signatureOf(w);
    const existing = reps.get(sig);
    if (!existing || w < existing) reps.set(sig, w);
  }
  const list = Array.from(reps.values());
  ALL_BY_LENGTH.set(length, list);
  return list;
}

function computeTopScoringWords(length: number, limit: number): string[] {
  const scored: Array<[string, number]> = [];
  for (const w of representativesOfLength(length)) {
    scored.push([w, scoreOfSignature(signatureOf(w))]);
  }
  scored.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return scored.slice(0, limit).map(([w]) => w);
}

function topScoringWordsOfLength(
  length: number,
  minNeeded = TOP_POOL_SIZE,
): string[] {
  const cached = TOP_BY_LENGTH.get(length);
  if (cached && cached.length >= minNeeded) return cached;

  const precomputed = PRECOMPUTED_TOP[String(length)];
  if (precomputed && precomputed.top.length >= minNeeded) {
    TOP_BY_LENGTH.set(length, precomputed.top);
    return precomputed.top;
  }

  const resolved = computeTopScoringWords(
    length,
    Math.max(TOP_POOL_SIZE, minNeeded),
  );
  TOP_BY_LENGTH.set(length, resolved);
  return resolved;
}

export function randomWord(
  length: number,
  poolSize: number | null = TOP_POOL_SIZE,
): string {
  if (!loaded) return "";
  const pool =
    poolSize === null
      ? representativesOfLength(length)
      : topScoringWordsOfLength(length, poolSize).slice(0, poolSize);
  if (pool.length === 0) return "";
  return pool[Math.floor(Math.random() * pool.length)];
}

function getPrecomputedRankMap(length: number): Map<string, number> | null {
  const entry = PRECOMPUTED_TOP[String(length)];
  if (!entry?.rankTop) return null;
  const cached = TOP_SIG_RANK.get(length);
  if (cached) return cached;
  const map = new Map<string, number>();
  entry.rankTop.forEach((w, i) => {
    map.set(signatureOf(w), i + 1);
  });
  TOP_SIG_RANK.set(length, map);
  return map;
}

function computeRankDynamic(sig: string, length: number): RankInfo | null {
  if (!loaded) return null;
  const repBySig = new Map<string, string>();
  for (const w of WORDS) {
    if (w.length !== length) continue;
    const s = signatureOf(w);
    const existing = repBySig.get(s);
    if (!existing || w < existing) repBySig.set(s, w);
  }
  const targetRep = repBySig.get(sig);
  if (targetRep === undefined) return null;
  const targetScore = rankScoreOfSignature(sig);
  let higher = 0;
  let equalAndBefore = 0;
  for (const [s, rep] of repBySig) {
    if (s === sig) continue;
    const score = rankScoreOfSignature(s);
    if (score > targetScore) {
      higher++;
    } else if (score === targetScore && rep < targetRep) {
      equalAndBefore++;
    }
  }
  return { rank: higher + equalAndBefore + 1, total: repBySig.size };
}

export interface LeaderboardEntry {
  rank: number;
  word: string;
  score: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  total: number;
}

const LEADERBOARD_SORTED_CACHE = new Map<string, Array<[string, number]>>();

function pointsScoreOfSignature(sig: string, minSubLen: number): number {
  let total = 0;
  for (const sub of subSignatures(sig)) {
    if (sub.length < minSubLen) continue;
    const words = SIG_TO_WORDS.get(sub);
    if (!words) continue;
    total += words.length * pointsForLength(sub.length);
  }
  return total;
}

function getSortedLeaderboard(
  length: number,
  minSubLen: number,
): Array<[string, number]> {
  if (!loaded) return [];
  const cacheKey = `${length}-${minSubLen}`;
  const cached = LEADERBOARD_SORTED_CACHE.get(cacheKey);
  if (cached) return cached;

  const reps = new Map<string, string>();
  for (const w of WORDS) {
    if (w.length !== length) continue;
    const sig = signatureOf(w);
    const existing = reps.get(sig);
    if (!existing || w < existing) reps.set(sig, w);
  }

  const scored: Array<[string, number]> = [];
  for (const [sig, w] of reps) {
    scored.push([w, pointsScoreOfSignature(sig, minSubLen)]);
  }
  scored.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  LEADERBOARD_SORTED_CACHE.set(cacheKey, scored);
  return scored;
}

export function getLeaderboard(
  length: number,
  minSubLen: number,
  limit = 100,
  offset = 0,
): LeaderboardResult {
  const sorted = getSortedLeaderboard(length, minSubLen);
  const page = sorted.slice(offset, offset + limit);
  return {
    entries: page.map(([word, score], i) => ({
      rank: offset + i + 1,
      word,
      score,
    })),
    total: sorted.length,
  };
}

export function getRankOfWord(word: string): RankInfo | null {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return null;
  const length = cleaned.length;
  const sig = signatureOf(cleaned);

  const entry = PRECOMPUTED_TOP[String(length)];
  if (entry) {
    const rankMap = getPrecomputedRankMap(length)!;
    const rank = rankMap.get(sig);
    if (rank !== undefined) {
      return { rank, total: entry.count };
    }
  }

  return computeRankDynamic(sig, length);
}
