// actions/actions.ts
"use server"

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from "next/headers"
import { db } from '@/lib/db'
import { students, auras } from '@/lib/schema'
import { eq } from 'drizzle-orm'


// ! NOT FINISHED
export const handleSignUp = async (formData: FormData) => {
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const student = (await db.select().from(students).where(eq(students.displayName, name)))[0];

    if (!student) return
    if (student.userId) return

    try {
        const res = await auth.api.signUpEmail({
            body: {
                name,
                email,
                password
            },
            headers: await headers()
        });

        await db.update(students).set({ userId: res.user.id }).where(eq(students.id, student.id));

        console.log("[Auth Success]:", res.user.email);

    } catch (error: any) {
        console.error("[Auth Error]:", error.message);
        // Without the hook, you might want to redirect to an error page 
        // or just log it for now.
        redirect('/')
    }
}


// export const auras = pgTable("auras", {
//     id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
//     giverId: text("giver_id").notNull().references(() => users.id, { onDelete: "set null" }),
//     receiverId: text("receiver_id").notNull().references(() => users.id, { onDelete: "cascade" }),
//     category: text("category").$type<AuraCategory>().notNull(),
//     aura: integer("aura").notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
// });


export const giveAura = async ({ id: receiverId, aura }: { id: number; aura: number }) => {
    // !! uncomment when done testing
    // // 1. Fetch the secure session on the server
    // const session = await auth.api.getSession({
    //     headers: await headers()
    // });

    // // 2. Block unauthorized access
    // if (!session || !session.user) {
    //     throw new Error("Unauthorized: You must be logged in.");
    // }

    // // 3. Optional: Block students from giving points if using roles
    // if (session.user.role !== "mentor" && session.user.role !== "admin") {
    //     throw new Error("Forbidden: Only mentors can give points.");
    // }

    // 4. Safely perform the insert using the server-validated user ID
    await db.insert(auras).values({
        aura,
        giverId: "YanXOqCpDZDa8wQEEtKCKHpZbrfizVvf", // Securely injected on the server via session.user.id but leave this like this now for testing
        receiverId,
        category: "activity"
    });
};



export const batchAura = async (data: { id: number, aura: number }[]) => {
    // logic here
}
