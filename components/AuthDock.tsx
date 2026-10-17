"use client";

import { useStore } from "@/store/store";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/use-t";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/Button";

export function AuthDock({ compact = false }: { compact?: boolean }) {
    const { data, isPending } = authClient.useSession();
    const { setModal } = useStore();
    const t = useT();

    if (isPending) return null;

    if (!data) {
        return (
            <div className={compact ? "flex items-center gap-2" : "flex w-full flex-col gap-2"}>
                <Button variant="secondary" size="sm" className={compact ? undefined : "w-full"} onClick={() => setModal("sign-up")}>
                    {t("shell.auth.signUp")}
                </Button>
                <Button variant="primary" size="sm" className={compact ? undefined : "w-full"} onClick={() => setModal("sign-in")}>
                    {t("shell.auth.signIn")}
                </Button>
            </div>
        );
    }

    return (
        <div className={compact
            ? "flex max-w-56 items-center gap-2"
            : "flex w-full flex-col gap-2 border-t border-line pt-4"
        }>
            <p className="truncate text-xs text-muted">{data.user.email}</p>
            <SignOutButton />
        </div>
    );
}
