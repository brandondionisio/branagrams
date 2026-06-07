import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
  headerVariant?: "home" | "page";
}

export function Layout({ children, headerVariant = "page" }: LayoutProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[1100px] flex-col bg-page-bg">
      <Header variant={headerVariant} />
      <main className="flex-1">{children}</main>
    </div>
  );
}

function Header({ variant }: { variant: "home" | "page" }) {
  return (
    <header className="flex items-baseline justify-between gap-4 px-4 py-7 sm:px-16">
      <Link
        to="/"
        className="font-display text-xl leading-none tracking-tight text-accent"
      >
        Bran
        <span className="font-display text-xl leading-none tracking-tight text-ink">
          agrams
        </span>
      </Link>

      {variant === "home" ? (
        <span className="text-xs leading-none tracking-widest text-text-secondary">
          created by{" "}
          <Link
            to="https://brandondionisio.com"
            className="text-text-secondary hover:text-ink underline underline-offset-4"
          >
            brandon
          </Link>
        </span>
      ) : (
        <nav className="flex items-baseline gap-6 text-sm leading-none">
          <NavLink
            to="/solver"
            className={({ isActive }) =>
              isActive
                ? "font-medium text-ink underline underline-offset-4"
                : "text-text-secondary transition hover:text-ink"
            }
          >
            Solver
          </NavLink>
          <NavLink
            to="/game"
            className={({ isActive }) =>
              isActive
                ? "font-medium text-ink underline underline-offset-4"
                : "text-text-secondary transition hover:text-ink"
            }
          >
            Game
          </NavLink>
          <NavLink
            to="/rank"
            className={({ isActive }) =>
              isActive
                ? "font-medium text-ink underline underline-offset-4"
                : "text-text-secondary transition hover:text-ink"
            }
          >
            Rank
          </NavLink>
        </nav>
      )}
    </header>
  );
}
