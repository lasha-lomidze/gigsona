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
    }
});





