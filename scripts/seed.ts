import { auth } from '../lib/auth'
import { db } from '../lib/db'
import { users } from '../lib/schema'
import { eq } from "drizzle-orm"

const mentors = [
    { name: "Lasha Lomidze", email: "lashalomidze380@gmail.com", password: "1234567890" },
]

const seed = async () => {
    for (const mentor of mentors) {
        const existing = await db.select().from(users).where(eq(users.email, mentor.email))

        if (existing.length > 0) {
            console.log(`Skipping ${mentor.email} — already exists`)
            continue
        }

        await auth.api.signUpEmail({
            body: {
                name: mentor.name,
                email: mentor.email,
                password: mentor.password,
            }
        })

        await db.update(users)
            .set({ role: "mentor" })
            .where(eq(users.email, mentor.email))

        console.log(`Created mentor: ${mentor.email}`)
    }
}

seed()