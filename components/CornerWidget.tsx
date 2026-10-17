"use client"
import { useStore } from '../store/store'
import { authClient } from '@/lib/auth-client'
import { useT } from "@/lib/i18n/use-t";
import { SignOutButton } from './SignOutButton'
import { VWrapper } from './ui/VWrapper'

export const CornerWidget = () => {
    const t = useT()

    const { data, isPending } = authClient.useSession()
    const isSignedIn = data != null;

    const { setModal } = useStore()

    if (isPending) return null;

    if (!isSignedIn) return (
        <div className="absolute top-0 right-0 flex items-center gap-3 fade">

            <VWrapper enableDefaultAnimations={true} as='button' onClick={() => setModal('sign-up')}>{t("shell.auth.signUpCaps")}</VWrapper>

            <button
                data-power="none" data-delay={0.7} data-direction="left"
                className="fade"
                style={{
                    padding: "8px 22px",
                    background: "linear-gradient(135deg, #a3e635 0%, #84cc16 100%)",
                    border: "1px solid rgba(163,230,53,0.4)",
                    color: "#1a2e05",
                    borderRadius: "10px",
                    fontWeight: 500,
                    fontSize: "13.5px",
                    letterSpacing: "0.03em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: "0 0 18px rgba(132,204,22,0.3)",
                }}
                onMouseEnter={e => {
                    const b = e.currentTarget
                    b.style.background = "linear-gradient(135deg, #bef264 0%, #a3e635 100%)"
                    b.style.boxShadow = "0 0 28px rgba(163,230,53,0.5)"
                }}
                onMouseLeave={e => {
                    const b = e.currentTarget
                    b.style.background = "linear-gradient(135deg, #a3e635 0%, #84cc16 100%)"
                    b.style.boxShadow = "0 0 18px rgba(132,204,22,0.3)"
                }}
                onMouseDown={e => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={e => (e.currentTarget.style.transform = "scale(1)")}
                onClick={() => setModal('sign-in')}
            >
                {t("shell.auth.signInCaps")}
            </button>
        </div>
    )

    return (
        <div className="absolute right-0 top-0 z-20 flex items-center gap-3 rounded-md border border-line bg-canvas/90 px-3 py-2 text-xs text-muted">
            <span className="max-w-44 truncate">{data.user.email}</span>
            <SignOutButton />
        </div>
    )
}
