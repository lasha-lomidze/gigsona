
import { auth } from './auth'
import { headers } from "next/headers";

export const authServer = {
    getSession: async () => await auth.api.getSession({
        headers: await headers()
    }),
    signOut: async () => await auth.api.signOut({
        headers: await headers()
    }),
}

