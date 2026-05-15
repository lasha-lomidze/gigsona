"use client"
import { Input } from './ui/Input'
import { useStore } from '../store/store'
import { useEffect, useState } from 'react'
import { handleSignUp } from '@/actions/actions'
import { BottomUpNeonButton } from './ui/BottomUpNeonButton'
import { text } from 'drizzle-orm/pg-core';

export const SignUp = () => {

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);


    const { modalOpen } = useStore()

    if (!mounted) return null;

    return (
        modalOpen === "sign-up" && (
            <form action={handleSignUp}
                className='sign-in-container fixed z-110 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-10 flex flex-col items-center gap-10'
            >
                <h1 className="text-white text-2xl font-light tracking-[0.2em] uppercase opacity-80">
                    Sign Up
                </h1>

                <div className="w-full flex flex-col gap-8">
                    <Input label='Name' type='text' placeholder='Enter your name' name='name' />
                    <Input label='Email' type='email' name='email' />
                    <Input label='Password' type='password' name='password' />
                    {/* <Input label='Confirm Password' type='password' /> */}
                </div>

                <BottomUpNeonButton text="create account" />

            </form>
        ))
}



