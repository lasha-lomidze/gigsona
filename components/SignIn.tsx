"use client"
import { Input } from './ui/Input'
import { useStore } from '../store/store'
import { useEffect, useState } from 'react'
import { authClient } from "@/lib/auth-client";
import { BottomUpNeonButton } from './ui/BottomUpNeonButton';

export const SignIn = () => {

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const { modalOpen } = useStore()

    const { data, isPending, error } = authClient.useSession()
    console.log('Session Data:', { data, isPending, error });

    if (!mounted) return null;

    const handleSignIn = async () => {
        const { data, error } = await authClient.signIn.email({
            email: 'lashalomidze380@gmail.com',
            password: '1234567890',
            rememberMe: true,
            callbackURL: `${window.location.origin}/`,
        })

        console.log('Sign In Response:', { data, error });
    }


    return (
        modalOpen === "sign-in" && (
            <form action={handleSignIn}
                className='sign-in-container fixed z-110 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-10 flex flex-col items-center gap-10'
            >
                <h1 className="text-white text-2xl font-light tracking-[0.2em] uppercase opacity-80">
                    Sign In
                </h1>

                <div className="w-full flex flex-col gap-8">
                    <Input label='Email' type='email' />
                    <Input label='Password' type='password' />
                </div>

                <BottomUpNeonButton text='Enter Academy' />

            </form>
        ))
}




// 1) 
//             <button
//                 className="
//     group relative w-full py-4 rounded-xl overflow-hidden
//     border border-lime-400/30 bg-lime-400/5
//     transition-all duration-500 ease-out text-sm
//     hover:border-lime-400 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]
// "
//             >
//                 {/* The Text - High Contrast */}
//                 <span className="relative z-10 text-lime-500  uppercase tracking-[0.2em] transition-colors duration-500 font-light group-hover:text-black">
//                     Enter Academy
//                 </span>

//                 {/* The Fill - Using transform instead of scale-x for smoother rendering */}
//                 <div className="absolute inset-0 bg-lime-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)]" />
//             </button>



// 2)
/* <button
              style={{
              width: "100%",3
              padding: "14px 20px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.8)",
              borderRadius: "12px",
              fontWeight: 400,
              fontSize: "14px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              backdropFilter: "blur(12px)",
              boxShadow: `
                  inset 0 1px 1px rgba(255,255,255,0.1), 
                  0 4px 15px rgba(0,0,0,0.4)
              `,
          }}
          className="hover:scale-[1.02] hover:border-lime-700/50 hover:text-white transition-all"
      >
          Enter Academy
      </button> */