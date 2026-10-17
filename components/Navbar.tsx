import { Logo } from "./ui/Logo";
import { FadeIn } from "./ui/motion";
import { AuthDock } from "./AuthDock";
import { NavLinks, type NavItem } from "./NavLinks";
import { authServer } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { profiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export const Navbar = async () => {
    const t = await getT();
    const session = await authServer.getSession();
    const [profile] = session?.user
        ? await db.select({ role: profiles.role, status: profiles.status })
            .from(profiles)
            .where(eq(profiles.userId, session.user.id))
        : [];
    const hasActiveProfile = profile?.status === "active";
    const canStaff = hasActiveProfile && (profile.role === "mentor" || profile.role === "assistant");
    const links: NavItem[] = [
        { href: "/", label: "shell.nav.overview", icon: "overview" },
        { href: "/history", label: "shell.nav.history", icon: "history" },
        { href: "/search", label: "shell.nav.search", icon: "search" },
        { href: "/settings", label: "shell.nav.settings", icon: "settings" },
    ];

    if (canStaff) {
        links.splice(3, 0, { href: "/manage", label: "shell.nav.manage", icon: "manage" });
    }

    if (session?.user) {
        links.splice(links.length - 1, 0, { href: "/profile", label: "shell.nav.profile", icon: "profile" });
    }

    if (canStaff) {
        links.splice(links.length - 1, 0, { href: "/admin", label: "shell.nav.admin", icon: "admin" });
    }

    return (
        <>
            <header className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-line bg-canvas/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
                <FadeIn direction="down" distance={8} duration={0.5}>
                    <Logo compact />
                </FadeIn>
                <FadeIn direction="down" distance={8} delay={0.3} duration={0.5}>
                    <AuthDock compact />
                </FadeIn>
            </header>

            <aside className="app-sidebar hidden w-64 shrink-0 flex-col border-r border-line bg-canvas px-5 py-6 md:flex">
                <div className="flex items-center px-1">
                    <FadeIn direction="left" distance={14} duration={0.6}>
                        <Logo />
                    </FadeIn>
                </div>
                <nav className="mt-8 flex-1" aria-label={t("shell.nav.primaryAriaLabel")}>
                    <NavLinks links={links} variant="rail" />
                </nav>
                <div className="pt-2">
                    <FadeIn direction="up" distance={10} delay={0.5} duration={0.5}>
                        <AuthDock />
                    </FadeIn>
                </div>
            </aside>

            <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label={t("shell.nav.primaryAriaLabel")}>
                <NavLinks links={links} variant="dock" />
            </nav>
        </>
    );
};
