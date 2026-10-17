"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from "@/lib/auth-client";
import { useRegion } from "@/components/RegionSetting";
import { useT } from "@/lib/i18n/use-t";

import { Button } from "@/components/ui/Button";

export const SignOutButton = () => {
    const router = useRouter()
    const [pending, setPending] = useState(false)
    const [message, setMessage] = useState('')
    const { locale } = useRegion()
    const t = useT()

    const handleSignOut = async () => {
        setMessage('')
        setPending(true)
        try {
            const { error } = await authClient.signOut()
            if (error) {
                setMessage(locale === "ka-GE" ? t("shell.auth.signOutError") : error.message || t("shell.auth.signOutError"))
                setPending(false)
                return
            }

            router.replace('/')
            router.refresh()
        } catch {
            setMessage(t("shell.auth.signOutServiceError"))
            setPending(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            {message && <span role="alert" className="text-[11px] text-danger">{message}</span>}
            <Button variant="secondary" size="sm" onClick={handleSignOut} disabled={pending}>
                {pending ? t("shell.auth.signingOut") : t("shell.auth.signOut")}
            </Button>
        </div>
    )
}
