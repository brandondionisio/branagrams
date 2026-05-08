import type { ReactNode } from "react";

export function pointsForWordLength(length: number): number {
  switch (length) {
    case 2:
      return 50;
    case 3:
      return 100;
    case 4:
      return 400;
    case 5:
      return 1200;
    case 6:
      return 2000;
    default:
      if (length >= 7) return 2000 + (length - 6) * 1000;
      return 0;
  }
}

export function scramble(word: string): string {
  if (word.length < 2) return word;
  const arr = word.split("");
  for (let attempt = 0; attempt < 5; attempt++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const out = arr.join("");
    if (out !== word) return out;
  }
  return arr.join("");
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </p>
      {children}
    </div>
  );
}

export function Chip({
  active,
  onClick,
  children,
  size = "md",
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: "sm" | "md";
}) {
  const sizing =
    size === "sm" ? "h-9 min-w-9 px-3 text-sm" : "h-10 px-4 text-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full font-mono transition ${sizing} ${
        active
          ? "bg-ink text-page-bg"
          : "bg-page-bg-tertiary text-ink hover:bg-border-subtle"
      }`}
    >
      {children}
    </button>
  );
}
