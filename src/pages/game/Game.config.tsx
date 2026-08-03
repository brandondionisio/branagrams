export type Phase = "setup" | "playing" | "ended";
export type Duration = 30 | 60 | 90 | 0;
export type LetterSource = "random" | "custom";
export type MobileInputMode = "tiles" | "keyboard";
export type BoardQuality = null | 1000 | 500 | 250 | 100 | 50 | 25 | 10;

export const DURATIONS: Duration[] = [30, 60, 90, 0];
export const RANDOM_LENGTHS = [3, 4, 5, 6, 7, 8, 9, 10] as const;
export const MIN_LENGTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const BOARD_QUALITIES: BoardQuality[] = [
  null,
  1000,
  500,
  250,
  100,
  50,
  25,
  10,
];
export const DEFAULT_BOARD_QUALITY: BoardQuality = 250;
export const GAME_PREFILL_CUSTOM_LETTERS_KEY = "prefillCustomLetters";

export function boardQualityLabel(q: BoardQuality): string {
  return q === null ? "Any" : `Top ${q}`;
}
