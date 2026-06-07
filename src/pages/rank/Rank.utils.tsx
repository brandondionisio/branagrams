import { useNavigate } from "react-router-dom";
import {
  GAME_PREFILL_CUSTOM_LETTERS_KEY,
  solverPathForLetters,
} from "../solver/Solver.config";

export function RankWordEntry({ word }: { word: string }) {
  const navigate = useNavigate();

  return (
    <span className="group relative inline-block">
      <span className="cursor-default font-display text-xl lowercase tracking-wide text-ink">
        {word}
      </span>
      <div
        className="pointer-events-none invisible absolute bottom-full left-0 z-30 min-w-24 pb-2 opacity-0 transition-opacity duration-100 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100"
        role="menu"
        aria-label={`Use “${word}” in…`}
      >
        <div className="overflow-hidden rounded-md bg-page-bg-secondary shadow-md">
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition first:rounded-t-md last:rounded-b-md hover:bg-page-bg-tertiary"
            onClick={() => navigate(solverPathForLetters(word))}
          >
            Solver
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition first:rounded-t-md last:rounded-b-md hover:bg-page-bg-tertiary"
            onClick={() =>
              navigate("/game", {
                state: { [GAME_PREFILL_CUSTOM_LETTERS_KEY]: word },
              })
            }
          >
            Game
          </button>
        </div>
      </div>
    </span>
  );
}
