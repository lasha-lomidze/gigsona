import Link from "next/link";
import { PageTitle } from "@/components/ui/PageTitle";
import { getT } from "@/lib/i18n/server";

export default async function ResetPasswordPage() {
    const t = await getT();

    return (
        <main className="mx-auto max-w-2xl px-4 py-10">
            <PageTitle
                title={t("auth.resetPassword.title")}
                description={t("auth.resetPassword.description")}
            />
            <p className="text-sm text-muted">
                {t("auth.resetPassword.help")}
            </p>
            <Link href="/" className="btn btn-secondary mt-6">
                {t("auth.resetPassword.backToOverview")}
            </Link>
        </main>
    );
}