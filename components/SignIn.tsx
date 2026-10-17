"use client"
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FiX } from 'react-icons/fi'
import { AnimatePresence, motion } from 'motion/react'
import { motionDuration, motionEase } from './ui/motion'
import { useStore } from '../store/store'
import { authClient } from "@/lib/auth-client";
import { useT } from '@/lib/i18n/use-t';

export const SignIn = () => {
    const { modalOpen, setModal } = useStore()
    const router = useRouter()
    const t = useT()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [pending, setPending] = useState(false)

    const translateSignInError = (rawMessage?: string) => {
        switch (rawMessage) {
            case 'Invalid email':
                return t('auth.error.invalidEmail')
            case 'Invalid email or password':
                return t('auth.error.invalidEmailOrPassword')
            case 'Email and password is not enabled':
                return t('auth.error.emailPasswordDisabled')
            case 'Email not verified':
                return t('auth.error.emailNotVerified')
            default:
                return t('auth.error.signInFallback')
        }
    }

    const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setMessage('')
        setPending(true)
        try {
            const { error } = await authClient.signIn.email({
                email: email.trim(),
                password,
                rememberMe: true,
                callbackURL: window.location.pathname,
            })

            if (error) {
                setMessage(translateSignInError(error.message))
                return
            }

            setPassword('')
            setModal(null)
            router.refresh()
        } catch {
            setMessage(t('auth.error.serviceUnavailable'))
        } finally {
            setPending(false)
        }
    }

    return (
        <AnimatePresence>
            {modalOpen === "sign-in" && (
                <motion.form
                    key="sign-in-modal"
                    onSubmit={handleSignIn}
                    initial={{ opacity: 0, scale: 0.98, y: "-48%", x: "-50%" }}
                    animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.98, y: "-48%", x: "-50%" }}
                    transition={{ duration: motionDuration.standard, ease: motionEase }}
                    className='modal-card fixed z-110 left-1/2 top-1/2 flex w-[calc(100%-2rem)] max-w-md flex-col gap-7 p-6 sm:p-10'
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="eyebrow">{t('auth.signIn.welcomeBack')}</p>
                            <h1 className="mt-2 text-2xl font-semibold text-ink">{t('auth.signIn.title')}</h1>
                        </div>
                        <button type="button" onClick={() => setModal(null)} aria-label={t('auth.signIn.closeAriaLabel')} title={t('auth.common.close')} className="rounded-md p-2 text-faint transition hover:bg-white/5 hover:text-ink">
                            <FiX aria-hidden="true" />
                        </button>
                    </div>
                    <label className="block text-xs font-medium text-muted">
                        {t('auth.common.email')}
                        <input type="email" name="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field mt-1.5" />
                    </label>
                    <label className="block text-xs font-medium text-muted">
                        {t('auth.common.password')}
                        <input type="password" name="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="field mt-1.5" />
                    </label>
                    {message && <p role="alert" className="text-sm text-danger">{message}</p>}
                    <button type="submit" disabled={pending} className="btn btn-primary h-11">
                        {pending ? t('auth.signIn.pending') : t('auth.signIn.submit')}
                    </button>
                    <p className="text-center text-sm text-faint">
                        {t('auth.signIn.newHere')} <button type="button" onClick={() => setModal('sign-up')} className="font-medium text-accent hover:text-lime-200">{t('auth.signIn.createAccount')}</button>
                    </p>
                </motion.form>
            )}
        </AnimatePresence>
    )
}
