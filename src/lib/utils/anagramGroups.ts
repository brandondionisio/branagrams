export function letterMultisetKey(word: string): string {
  return [...word].sort().join("");
}

export function groupWordsByLetterMultiset(words: string[]): string[][] {
  const m = new Map<string, string[]>();
  for (const w of words) {
    const k = letterMultisetKey(w);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(w);
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.localeCompare(b));
  }
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, arr]) => arr);
}

export const ANAGRAM_GROUP_PASTELS = [
  "hsl(200 50% 92%)",
  "hsl(280 40% 93%)",
  "hsl(150 40% 92%)",
  "hsl(40 52% 92%)",
  "hsl(340 45% 93%)",
  "hsl(175 42% 92%)",
  "hsl(265 38% 93%)",
  "hsl(95 42% 92%)",
  "hsl(25 48% 93%)",
  "hsl(220 45% 92%)",
  "hsl(310 38% 93%)",
  "hsl(130 35% 92%)",
] as const;

export function groupPastelAtIndex(i: number): string {
  return ANAGRAM_GROUP_PASTELS[i % ANAGRAM_GROUP_PASTELS.length]!;
}
