"use client"
import { useStore } from '../store/store'
import { authClient } from '@/lib/auth-client'
import { Loading } from './Loading'
import { VWrapper } from './ui/VWrapper'

export const CornerWidget = () => {

    const { data, isPending, error } = authClient.useSession()
    console.log('Session Data:', { data, isPending, error });
    const isSignedIn = data != null;

    const { setModal } = useStore()

    if (isPending) return null;

    if (!isSignedIn) return (
        <div className="absolute top-0 right-0 flex items-center gap-3 fade">

            <VWrapper enableDefaultAnimations={true} as='button' onClick={() => setModal('sign-up')}>Sign Up</VWrapper>

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
                Sign In
            </button>
        </div>
    )

    return (
        <div className="absolute fade opacity-0 top-0 right-0 m-4 p-2 bg-lime-500 text-lime-900 rounded shadow-2xl">
            Welcome, {data.user.email}!
        </div>
    )
}

