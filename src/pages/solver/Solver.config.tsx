export const MIN_LENGTHS = [2, 3, 4, 5, 6, 7] as const;
export const GAME_PREFILL_CUSTOM_LETTERS_KEY = "prefillCustomLetters";

export const SOLVER_RESULTS_VIEWS = [
  { id: "word-list", label: "Word list" },
  { id: "combo-table", label: "Combo table" },
  { id: "alphabetical-table", label: "Alphabetical table" },
] as const;

export type SolverResultsView = (typeof SOLVER_RESULTS_VIEWS)[number]["id"];
