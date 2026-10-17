import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from './db';
import * as schema from './schema';

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
        usePlural: true,
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "guest",
            },
        },
    },
    // Serves getSession from a signed cookie so page loads and server actions
    // skip two session/user queries each. Sign-out in other browsers takes effect
    // within this window.
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5,
        },
    },
});





