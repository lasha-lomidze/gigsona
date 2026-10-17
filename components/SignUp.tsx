"use client"
import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { FiX } from 'react-icons/fi'
import { AnimatePresence, motion } from 'motion/react'
import { motionDuration, motionEase } from './ui/motion'
import { useStore } from '../store/store'
import { authClient } from '@/lib/auth-client'
import { claimSignupProfile } from '@/actions/profile'
import { useT } from '@/lib/i18n/use-t'

export const SignUp = () => {
    const { modalOpen, setModal } = useStore()
    const router = useRouter()
    const t = useT()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [pending, setPending] = useState(false)
    const [accountCreated, setAccountCreated] = useState(false)

    const translateSignUpError = (rawMessage?: string) => {
        switch (rawMessage) {
            case 'Invalid email':
                return t('auth.error.invalidEmail')
            case 'Invalid password':
                return t('auth.error.invalidPassword')
            case 'Password is too short':
                return t('auth.error.passwordTooShort')
            case 'Password is too long':
                return t('auth.error.passwordTooLong')
            case 'User already exists. Use another email.':
                return t('auth.error.userAlreadyExists')
            case 'Email and password sign up is not enabled':
                return t('auth.error.signupDisabled')
            case 'Your session expired. Sign in and try again.':
                return t('auth.error.sessionExpired')
            case 'This academy profile is inactive. Contact a mentor to reactivate it.':
                return t('auth.error.profileInactive')
            case 'That reserved profile is linked to another account. Contact a mentor.':
                return t('auth.error.profileLinkedElsewhere')
            case 'Your account was created, but setup could not finish. Retry once or contact a mentor.':
                return t('auth.error.setupIncomplete')
            default:
                return t('auth.error.signUpFallback')
        }
    }

    const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setMessage('')
        setPending(true)
        try {
            if (!accountCreated) {
                const { error } = await authClient.signUp.email({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                })

                if (error) {
                    setMessage(translateSignUpError(error.message))
                    return
                }
                setAccountCreated(true)
            }

            const result = await claimSignupProfile()
            if (!result.ok) {
                setMessage(translateSignUpError(result.message))
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
            {modalOpen === "sign-up" && (
                <motion.form
                    key="sign-up-modal"
                    onSubmit={handleSignUp}
                    initial={{ opacity: 0, scale: 0.98, y: "-48%", x: "-50%" }}
                    animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                    exit={{ opacity: 0, scale: 0.98, y: "-48%", x: "-50%" }}
                    transition={{ duration: motionDuration.standard, ease: motionEase }}
                    className='modal-card fixed z-110 left-1/2 top-1/2 flex w-[calc(100%-2rem)] max-w-md flex-col gap-5 p-6 sm:p-10'
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="eyebrow">{t('auth.signUp.joinAcademy')}</p>
                            <h1 className="mt-2 text-2xl font-semibold text-ink">{t('auth.signUp.title')}</h1>
                        </div>
                        <button type="button" onClick={() => setModal(null)} aria-label={t('auth.signUp.closeAriaLabel')} title={t('auth.common.close')} className="rounded-md p-2 text-faint transition hover:bg-white/5 hover:text-ink">
                            <FiX aria-hidden="true" />
                        </button>
                    </div>
                    <label className="block text-xs font-medium text-muted">
                        {t('auth.common.name')}
                        <input type="text" name="name" required minLength={2} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} disabled={accountCreated} className="field mt-1.5 disabled:opacity-60" />
                    </label>
                    <label className="block text-xs font-medium text-muted">
                        {t('auth.common.email')}
                        <input type="email" name="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={accountCreated} className="field mt-1.5 disabled:opacity-60" />
                    </label>
                    <label className="block text-xs font-medium text-muted">
                        {t('auth.common.password')}
                        <input type="password" name="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={accountCreated} className="field mt-1.5 disabled:opacity-60" />
                        <span className="mt-1 block text-[11px] text-faint">{t('auth.signUp.passwordHint')}</span>
                    </label>
                    {message && <p role="alert" className="text-sm text-danger">{message}</p>}
                    <button type="submit" disabled={pending} className="btn btn-primary h-11">
                        {pending ? t('auth.signUp.pending') : accountCreated ? t('auth.signUp.finishSetup') : t('auth.signUp.title')}
                    </button>
                    <p className="text-center text-sm text-faint">
                        {t('auth.signUp.alreadyRegistered')} <button type="button" onClick={() => setModal('sign-in')} className="font-medium text-accent hover:text-lime-200">{t('auth.signIn.title')}</button>
                    </p>
                </motion.form>
            )}
        </AnimatePresence>
    )
}

