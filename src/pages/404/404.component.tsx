import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../../components/Layout";

const REDIRECT_MS = 2500;

export function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(
      () => navigate("/", { replace: true }),
      REDIRECT_MS,
    );
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Layout>
      <section className="px-4 pb-20 pt-10 sm:px-16">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-secondary">
          / 404
        </p>
        <h1 className="mb-6 text-5xl tracking-tight text-ink sm:text-6xl">
          Page not found
        </h1>
        <p className="mb-8 max-w-md text-lg text-text-secondary">
          That URL doesn&apos;t exist. You&apos;ll be redirected home in a few
          seconds.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-page-bg transition hover:opacity-90"
        >
          Go home now <span aria-hidden>→</span>
        </Link>
      </section>
    </Layout>
  );
}
