import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();

  return (
    <div className="flex min-h-[calc(100dvh-12rem)] items-center justify-center py-8">
      <div className="relative isolate grid w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-surface/80 shadow-[0_24px_80px_rgba(0,0,0,0.3)] md:grid-cols-[1.1fr_0.9fr]">
        <div className="pointer-events-none absolute -left-24 -top-24 -z-10 size-72 rounded-full bg-accent/10 blur-3xl" />
        <section className="flex flex-col items-start justify-center p-7 sm:p-10 md:p-12">
          <p className="eyebrow flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-accent" />
            {t("shell.notFound.eyebrow")}
          </p>
          <h1 className="mt-5 max-w-lg text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            {t("shell.notFound.titlePrefix")}{" "}
            <span className="text-accent">{t("shell.notFound.titleAccent")}</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted">
            {t("shell.notFound.description")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className="btn btn-primary">
              {t("shell.notFound.backToOverview")}
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/search" className="btn btn-secondary">
              {t("shell.notFound.exploreDirectory")}
            </Link>
          </div>
          <p className="mt-8 text-xs text-faint">
            {t("shell.notFound.footer")}
          </p>
        </section>

        <div
          aria-hidden="true"
          className="relative flex min-h-72 items-center justify-center overflow-hidden border-t border-line bg-canvas/50 px-8 py-10 md:min-h-full md:border-l md:border-t-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(163,230,53,0.09),transparent_65%)]" />
          <span className="absolute right-7 top-5 font-mono text-sm tracking-[0.3em] text-faint/40">
            404
          </span>
          <span className="absolute bottom-7 left-7 size-2 rounded-full bg-accent/70" />
          <span className="absolute left-12 top-12 size-1.5 rounded-full bg-teal-300/70" />

          <div className="relative flex flex-col items-center">
            <div className="absolute -right-16 top-4 -rotate-6 rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-xs text-muted shadow-xl">
              {t("shell.notFound.bubble")}
              <span className="absolute -bottom-1.5 left-5 size-3 rotate-45 border-b border-r border-line bg-surface" />
            </div>
            <svg
              viewBox="0 0 160 160"
              fill="none"
              className="size-40 sm:size-48"
            >
              <path
                d="M80 13c9 0 14 5 21 7 8 2 15-1 22 5s6 14 11 21 13 10 14 19-4 15-4 24 4 16-1 24-14 9-20 15-9 15-18 18-16-2-25 0-16 9-25 6-12-12-20-17-17-5-22-13 0-16-2-25-9-15-7-24 10-13 13-21 1-17 8-23 16-4 24-8 14-8 31-8Z"
                fill="#172414"
                stroke="#A3E635"
                strokeOpacity=".75"
                strokeWidth="2"
              />
              <path
                d="M50 73c0-6 4-10 9-10s9 4 9 10-4 10-9 10-9-4-9-10Zm33 0c0-6 4-10 9-10s9 4 9 10-4 10-9 10-9-4-9-10Z"
                fill="#D9F99D"
              />
              <circle cx="62" cy="73" r="3" fill="#172414" />
              <circle cx="95" cy="73" r="3" fill="#172414" />
              <path
                d="M69 101c4 6 9 9 15 9s11-3 15-9"
                stroke="#D9F99D"
                strokeLinecap="round"
                strokeWidth="4"
              />
              <path
                d="m44 48 5-9m67 12 7-7"
                stroke="#5EEAD4"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <span className="mt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-faint">
              {t("shell.notFound.badge")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
