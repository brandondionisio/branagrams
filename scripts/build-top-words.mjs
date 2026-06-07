import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DICT_PATH = resolve(ROOT, "public/dictionary.txt");
const OUT_PATH = resolve(ROOT, "src/lib/data/topWords.json");

const TOP_POOL_SIZE = 200;
const MIN_LENGTH = 2;
const MAX_LENGTH = 10;

function pointsForLength(len) {
  if (len < 3) return 0;
  switch (len) {
    case 3:
      return 100;
    case 4:
      return 400;
    case 5:
      return 800;
    case 6:
      return 1200;
    case 7:
      return 2000;
    default:
      return 2000 + (len - 7) * 1000;
  }
}

function signatureOf(w) {
  return w.split("").sort().join("");
}

function subSignatures(sig) {
  const seen = new Set();
  const stack = [[0, ""]];
  while (stack.length > 0) {
    const [idx, current] = stack.pop();
    if (idx === sig.length) {
      seen.add(current);
      continue;
    }
    stack.push([idx + 1, current]);
    stack.push([idx + 1, current + sig[idx]]);
  }
  return Array.from(seen);
}

function main() {
  console.log(`reading ${DICT_PATH}`);
  const text = readFileSync(DICT_PATH, "utf8");
  const words = text
    .split(/\r?\n/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length >= 2 && /^[a-z]+$/.test(w));
  console.log(`  ${words.length.toLocaleString()} dictionary entries`);

  const sigToWords = new Map();
  for (const w of words) {
    const sig = signatureOf(w);
    let arr = sigToWords.get(sig);
    if (!arr) {
      arr = [];
      sigToWords.set(sig, arr);
    }
    arr.push(w);
  }

  const sigScore = new Map();
  function scoreOfSignature(sig) {
    const cached = sigScore.get(sig);
    if (cached !== undefined) return cached;
    let total = 0;
    for (const sub of subSignatures(sig)) {
      if (sub.length < 3) continue;
      const ws = sigToWords.get(sub);
      if (!ws) continue;
      total += ws.length * pointsForLength(sub.length);
    }
    sigScore.set(sig, total);
    return total;
  }

  const sigRankScore = new Map();
  function rankScoreOfSignature(sig) {
    const cached = sigRankScore.get(sig);
    if (cached !== undefined) return cached;
    const minLen = Math.max(3, sig.length - 1);
    let total = 0;
    for (const sub of subSignatures(sig)) {
      if (sub.length < minLen) continue;
      const ws = sigToWords.get(sub);
      if (!ws) continue;
      total += ws.length * pointsForLength(sub.length);
    }
    sigRankScore.set(sig, total);
    return total;
  }

  /** @type {Record<string, { count: number; top: string[]; rankTop: string[] }>} */
  const result = {};
  for (let len = MIN_LENGTH; len <= MAX_LENGTH; len++) {
    const reps = new Map();
    for (const w of words) {
      if (w.length !== len) continue;
      const sig = signatureOf(w);
      const existing = reps.get(sig);
      if (!existing || w < existing) reps.set(sig, w);
    }
    const scored = [];
    const rankScored = [];
    for (const [sig, w] of reps) {
      scored.push([w, scoreOfSignature(sig)]);
      rankScored.push([w, rankScoreOfSignature(sig)]);
    }
    scored.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    rankScored.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const top = scored.slice(0, TOP_POOL_SIZE).map(([w]) => w);
    const rankTop = rankScored.slice(0, TOP_POOL_SIZE).map(([w]) => w);
    result[len] = { count: reps.size, top, rankTop };
    console.log(
      `  length ${len}: ${reps.size.toLocaleString()} signatures → top ${top.length}`,
    );
  }

  writeFileSync(OUT_PATH, JSON.stringify(result) + "\n");
  console.log(`wrote ${OUT_PATH}`);
}

main();
