export type Phase = "setup" | "playing" | "ended";
export type Duration = 30 | 60 | 90 | 0;
export type LetterSource = "random" | "custom";

export const DURATIONS: Duration[] = [30, 60, 90, 0];
export const RANDOM_LENGTHS = [3, 4, 5, 6, 7, 8, 9, 10] as const;
export const MIN_LENGTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const GAME_PREFILL_CUSTOM_LETTERS_KEY = "prefillCustomLetters";
