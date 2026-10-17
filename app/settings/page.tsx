import { PageTitle } from "@/components/ui/PageTitle";
import { SignOutButton } from "@/components/SignOutButton";
import { AuthDock } from "@/components/AuthDock";
import { authServer } from "@/lib/auth-server";
import { DisplayScaleSetting } from "@/components/DisplayScaleSetting";
import { RegionSetting } from "@/components/RegionSetting";
import { ThemeSetting } from "@/components/ThemeSetting";
import { getT } from "@/lib/i18n/server";

export default async function SettingsPage() {
    const session = await authServer.getSession();
    const t = await getT();

    return (
        <>
            <PageTitle title={t("settings.page.title")} description={t("settings.page.description")} />
            <ThemeSetting />
            <DisplayScaleSetting />
            <RegionSetting />
            {session?.user ? (
                <section className="panel max-w-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">{t("settings.account.signedInAs")}</p>
                            <p className="mt-1 truncate text-sm font-medium text-ink">{session.user.email}</p>
                            <p className="mt-1 text-xs text-faint">{t("settings.account.signOutHint")}</p>
                        </div>
                        <SignOutButton />
                    </div>
                </section>
            ) : (
                <section className="panel max-w-2xl space-y-4 p-5" aria-labelledby="account-access-title">
                    <div>
                        <h2 id="account-access-title" className="text-base font-semibold text-ink">{t("settings.account.accessTitle")}</h2>
                        <p className="mt-1 text-sm text-muted">{t("settings.account.accessDescription")}</p>
                    </div>
                    <AuthDock />
                </section>
            )}
        </>
    );
}