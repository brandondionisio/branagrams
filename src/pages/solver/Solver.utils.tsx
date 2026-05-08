import { GAME_PREFILL_CUSTOM_LETTERS_KEY } from "./Solver.config";
import { useNavigate } from "react-router-dom";

export function SolverWordChip({
  word,
  fill,
  onUseInSolver,
}: {
  word: string;
  fill: string;
  onUseInSolver: (w: string) => void;
}) {
  const navigate = useNavigate();

  return (
    <span className="group relative inline-block align-middle">
      <span
        className="block cursor-default rounded-md px-2.5 py-1.5 font-mono text-sm leading-normal text-ink ring-1 ring-ink/6"
        style={{ backgroundColor: fill }}
      >
        {word}
      </span>
      <div
        className="pointer-events-none invisible absolute left-0 top-[calc(100%-6px)] z-30 min-w-36 rounded-md border border-border-subtle bg-page-bg-secondary py-1 opacity-0 shadow-md transition-opacity duration-100 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100"
        role="menu"
        aria-label={`Use “${word}” in…`}
      >
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition hover:bg-page-bg-tertiary"
          onClick={() => onUseInSolver(word)}
        >
          Solver
        </button>
        <button
          type="button"
          role="menuitem"
          className="block w-full px-3 py-2 text-left font-mono text-xs text-ink transition hover:bg-page-bg-tertiary"
          onClick={() =>
            navigate("/game", {
              state: { [GAME_PREFILL_CUSTOM_LETTERS_KEY]: word },
            })
          }
        >
          Game
        </button>
      </div>
    </span>
  );
}
