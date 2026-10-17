import type { ReactNode } from "react";
import { getT } from "@/lib/i18n/server";

export type PageLoadingVariant =
    | "overview"
    | "history"
    | "manage"
    | "profile"
    | "directoryProfile"
    | "search"
    | "admin"
    | "settings"
    | "resetPassword"
    | "generic";

function Block({ className }: { className: string }) {
    return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

function PageHeading() {
    return (
        <div aria-hidden="true" className="mb-6 flex flex-col gap-2">
            <Block className="h-8 w-56 max-w-full" />
            <Block className="h-4 w-80 max-w-full" />
        </div>
    );
}

function Panel({ className = "", children }: { className?: string; children: ReactNode }) {
    return <div aria-hidden="true" className={`rounded-xl border border-line bg-surface/20 ${className}`}>{children}</div>;
}

function Rows({ count, className = "h-12" }: { count: number; className?: string }) {
    return Array.from({ length: count }, (_, index) => <Block key={index} className={className} />);
}

function GridRows({ count, columns, cells = 8, className = "" }: { count: number; columns: string; cells?: number; className?: string }) {
    return Array.from({ length: count }, (_, row) => (
        <div key={row} aria-hidden="true" className={`grid items-center gap-3 border-b border-line/40 py-2 ${columns} ${className}`}>
            {Array.from({ length: cells }, (_, cell) => (
                <Block key={cell} className={`h-4 ${cell === 0 ? "w-4/5" : "w-1/2"}`} />
            ))}
        </div>
    ));
}

function OverviewSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeading />
            <section className="flex flex-col gap-4">
                <Block className="h-7 w-64 max-w-full" />
                <div className="flex flex-wrap items-center gap-2">
                    <Block className="h-9 w-36" />
                    <Block className="h-9 w-36" />
                    <Block className="ml-auto h-9 w-40" />
                </div>
            </section>
            <div className="flex flex-col gap-4">
                {[0, 1].map((group) => (
                    <Panel key={group} className="overflow-hidden p-5 sm:px-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-1 flex-col gap-2">
                                <Block className="h-6 w-44 max-w-full" />
                                <Block className="h-3 w-32 max-w-full" />
                                <Block className="mt-1 h-4 w-56 max-w-full" />
                            </div>
                            <Block className="size-6 shrink-0 rounded-full" />
                        </div>
                        <div className="mt-5 border-t border-line/60 pt-3">
                            <div className="mb-2 grid grid-cols-[2rem_minmax(5rem,1fr)_minmax(3rem,0.5fr)] gap-3 lg:grid-cols-[2rem_minmax(8rem,1fr)_repeat(6,minmax(2.5rem,0.5fr))_minmax(3.5rem,0.5fr)]">
                                <Block className="h-4" />
                                <Block className="h-4" />
                                {Array.from({ length: 6 }, (_, item) => (
                                    <div key={item} className="hidden lg:block"><Block className="h-4" /></div>
                                ))}
                                <Block className="h-4" />
                            </div>
                            {Array.from({ length: 3 }, (_, row) => (
                                <div key={row} aria-hidden="true" className="grid items-center gap-3 border-b border-line/40 py-2 grid-cols-[2rem_minmax(5rem,1fr)_minmax(3rem,0.5fr)] lg:grid-cols-[2rem_minmax(8rem,1fr)_repeat(6,minmax(2.5rem,0.5fr))_minmax(3.5rem,0.5fr)]">
                                    <Block className="size-7 rounded-full" />
                                    <Block className="h-4 w-3/4" />
                                    {Array.from({ length: 6 }, (_, item) => (
                                        <div key={item} className="hidden lg:block"><Block className="ml-auto h-4 w-8" /></div>
                                    ))}
                                    <Block className="ml-auto h-5 w-10" />
                                </div>
                            ))}
                        </div>
                    </Panel>
                ))}
            </div>
        </div>
    );
}

function HistorySkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeading />
            <div className="flex gap-2 overflow-hidden">
                {[0, 1, 2, 3].map((item) => <Block key={item} className="h-9 w-28 shrink-0 rounded-full" />)}
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <Block className="size-9" />
                <Block className="h-6 w-52 max-w-[45vw]" />
                <Block className="size-9" />
                <Block className="ml-auto h-9 w-36" />
            </div>
            <div className="flex gap-2 overflow-hidden">
                {[0, 1, 2, 3, 4, 5].map((item) => <Block key={item} className="h-7 w-16 shrink-0 rounded-full" />)}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((item) => (
                    <Panel key={item} className="flex flex-col gap-2 p-4">
                        <Block className="h-3 w-24 max-w-full" />
                        <Block className="h-6 w-32 max-w-full" />
                    </Panel>
                ))}
            </div>
            <Panel className="overflow-hidden p-4">
                <div className="mb-4 flex justify-between gap-3 border-b border-line pb-3">
                    <Block className="h-4 w-32" />
                    <Block className="h-4 w-28" />
                </div>
                <div className="overflow-x-auto">
                    <div className="mb-2 grid min-w-[720px] grid-cols-[minmax(8rem,1fr)_repeat(6,minmax(2.5rem,0.5fr))_minmax(3.5rem,0.5fr)] gap-3">
                        {Array.from({ length: 8 }, (_, item) => <Block key={item} className="h-4" />)}
                    </div>
                    <GridRows count={5} columns="min-w-[720px] grid-cols-[minmax(8rem,1fr)_repeat(6,minmax(2.5rem,0.5fr))_minmax(3.5rem,0.5fr)]" />
                </div>
            </Panel>
        </div>
    );
}

function ManageSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeading />
            <section className="border-y border-line py-4">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <Block className="h-3 w-28" />
                        <Block className="h-6 w-48 max-w-full" />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Block className="h-9 w-36" />
                        <Block className="h-4 w-20" />
                        <Block className="h-4 w-24" />
                        <Block className="size-9" />
                    </div>
                </div>
                <div className="mt-4 flex gap-2 overflow-hidden">
                    {[0, 1, 2, 3].map((item) => <Block key={item} className="h-8 w-24 shrink-0 rounded-full" />)}
                </div>
            </section>
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
                <Panel className="overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-line p-4 sm:px-5">
                        <div className="flex flex-col gap-2">
                            <Block className="h-4 w-32" />
                            <Block className="h-3 w-48 max-w-full" />
                        </div>
                        <Block className="h-8 w-32" />
                    </div>
                    <div className="overflow-x-auto p-4">
                        <div className="mb-3 grid min-w-[620px] grid-cols-[minmax(8rem,1.2fr)_repeat(6,minmax(2.8rem,0.8fr))] gap-2">
                            {Array.from({ length: 7 }, (_, item) => <Block key={item} className="h-4" />)}
                        </div>
                        <GridRows count={7} cells={7} columns="min-w-[620px] grid-cols-[minmax(8rem,1.2fr)_repeat(6,minmax(2.8rem,0.8fr))]" />
                    </div>
                </Panel>
                <Panel className="flex flex-col gap-3 p-4">
                    <Block className="h-5 w-36" />
                    <Block className="h-10 w-full" />
                    <Rows count={5} className="h-11" />
                </Panel>
            </div>
        </div>
    );
}

function ProfileSkeleton({ directory = false }: { directory?: boolean }) {
    return (
        <div className="flex flex-col gap-6">
            <PageHeading />
            {directory && <Block className="h-4 w-32" />}
            <Panel className="flex flex-wrap items-center gap-5 border-y border-x-0 bg-transparent p-5 sm:gap-6">
                <Block className="size-20 shrink-0 rounded-full sm:size-24" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Block className="h-3 w-24" />
                    <Block className="h-7 w-56 max-w-full" />
                    <Block className="h-4 w-64 max-w-full" />
                    <div className="mt-1 flex gap-2"><Block className="h-5 w-20" /><Block className="h-5 w-20" /></div>
                </div>
                <Block className="h-16 w-28" />
            </Panel>
            <div className="grid gap-8 lg:grid-cols-2">
                {directory ? (
                    <>
                        <section className="flex flex-col gap-4">
                            <Block className="h-5 w-32" />
                            <Panel className="flex flex-col gap-3 p-4"><Block className="h-5 w-40" /><Rows count={3} className="h-10" /></Panel>
                        </section>
                        <section className="flex flex-col gap-4">
                            <Block className="h-5 w-36" />
                            <Panel className="h-56 p-4"><Block className="h-full w-full rounded-lg" /></Panel>
                        </section>
                    </>
                ) : (
                    <>
                        <Panel className="flex flex-col gap-4 p-5">
                            <Block className="h-5 w-40" />
                            <Block className="h-10 w-full" />
                            <Block className="h-20 w-full" />
                            <Block className="h-5 w-32" />
                            <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">{Array.from({ length: 16 }, (_, item) => <Block key={item} className="aspect-square" />)}</div>
                            <Block className="h-10 w-32" />
                        </Panel>
                        <div className="flex flex-col gap-4">
                            <Panel className="flex flex-col gap-3 p-5">
                                <Block className="h-5 w-36" />
                                <div className="grid grid-cols-2 gap-3"><Block className="h-32" /><Block className="h-32" /></div>
                            </Panel>
                            <Panel className="h-48 p-5"><Block className="h-full w-full" /></Panel>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function SearchSkeleton() {
    return (
        <div className="flex min-h-[calc(100dvh-18rem)] flex-col justify-center pb-8">
            <PageHeading />
            <Block className="mb-5 h-12 w-full rounded-lg" />
            <Panel className="overflow-hidden divide-y divide-line">
                <div className="flex items-center justify-between gap-4 p-4"><Block className="h-5 w-32" /><Block className="h-4 w-20" /></div>
                <div className="flex items-center justify-between gap-4 p-4"><Block className="h-5 w-36" /><Block className="h-4 w-20" /></div>
                <Rows count={4} className="h-16 rounded-none" />
            </Panel>
        </div>
    );
}

function AdminSkeleton() {
    return (
        <div className="flex flex-col gap-7">
            <PageHeading />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((item) => <Panel key={item} className="flex flex-col gap-3 p-4"><Block className="h-4 w-28 max-w-full" /><Block className="h-8 w-16" /><Block className="h-3 w-24" /></Panel>)}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-2">
                <div className="flex gap-3">{[0, 1, 2, 3].map((item) => <Block key={item} className="h-9 w-20" />)}</div>
                <Block className="h-10 w-64 max-w-full" />
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(270px,0.78fr)_minmax(0,1.35fr)]">
                <Panel className="flex flex-col gap-4 p-5">
                    <Block className="h-5 w-40" />
                    <Block className="h-4 w-full" />
                    <Block className="h-10 w-full" />
                    <Rows count={3} className="h-10" />
                    <Block className="h-10 w-32" />
                </Panel>
                <Panel className="flex flex-col gap-3 p-4">
                    <div className="flex justify-between gap-3"><Block className="h-5 w-44" /><Block className="h-8 w-24" /></div>
                    <Rows count={6} className="h-14" />
                </Panel>
            </div>
            <Panel className="h-64 p-5"><Block className="h-5 w-48" /><Block className="mt-5 h-40 w-full" /></Panel>
        </div>
    );
}

function SettingsSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeading />
            {[0, 1, 2].map((item) => (
                <Panel key={item} className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="flex flex-col gap-2"><Block className="h-5 w-40" /><Block className="h-4 w-64 max-w-full" /></div>
                    <Block className="h-10 w-40" />
                </Panel>
            ))}
            <Panel className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex flex-col gap-2"><Block className="h-5 w-36" /><Block className="h-4 w-56 max-w-full" /></div>
                <Block className="h-10 w-28" />
            </Panel>
        </div>
    );
}

function ResetPasswordSkeleton() {
    return (
        <div className="mx-auto w-full max-w-2xl py-10">
            <PageHeading />
            <Block className="h-4 w-full max-w-lg" />
            <Block className="mt-6 h-10 w-44" />
        </div>
    );
}

function GenericSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeading />
            <Panel className="flex flex-col gap-3 p-5"><Block className="h-5 w-40" /><Rows count={4} /></Panel>
        </div>
    );
}

export default async function PageLoading({ variant = "generic" }: { variant?: PageLoadingVariant }) {
    const t = await getT();
    const content = {
        overview: <OverviewSkeleton />,
        history: <HistorySkeleton />,
        manage: <ManageSkeleton />,
        profile: <ProfileSkeleton />,
        directoryProfile: <ProfileSkeleton directory />,
        search: <SearchSkeleton />,
        admin: <AdminSkeleton />,
        settings: <SettingsSkeleton />,
        resetPassword: <ResetPasswordSkeleton />,
        generic: <GenericSkeleton />,
    }[variant];

    return (
        <main aria-busy="true" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
            <div role="status" aria-live="polite">
                <span className="sr-only">{t("shell.loading.workspace")}</span>
                {content}
            </div>
        </main>
    );
}
