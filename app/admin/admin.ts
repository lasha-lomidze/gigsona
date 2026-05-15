
import { db } from "@/lib/db"
import { groups, students, users } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import { auth } from "@/lib/auth"


export const createStudent = async (formData: FormData) => {
    "use server"
    const name = formData.get("name") as string
    const groupName = formData.get("groupName") as string

    const doesGroupExist = await db.select().from(groups).where(eq(groups.name, groupName))
    if (doesGroupExist.length === 0) {
        console.log(`Group ${groupName} does not exist.`)
        return
    }

    db.insert(students).values({
        userId: null,
        groupId: doesGroupExist[0].id,
        displayName: name,
    }).then(() => {
        console.log(`Created student: ${name}`)
    }).catch((error) => {
        console.error(`Error creating student: ${error}`)
    })

}


export const createAssistent = async (formData: FormData) => {
    "use server"
    // TODO: try catch and error handling, also add validation to the form, like check if the email is already taken, etc. altho demo is done and working
    const name = formData.get("name") as string
    const account = formData.get("account") as string
    const password = formData.get("password") as string

    auth.api.signUpEmail({
        body: {
            name: name || "Unnamed Assistent",
            email: account || "unnamed-assistent@placeholder.gigsona.com",
            password: password || "gigsona12345",
            role: "assistent",
        }
    })
    console.log(name, account)
}


export const createGroup = async (formData: FormData) => {
    "use server"
    // TODO: try catch and error handling, also add validation to the form, like check if the group name is already taken, check if the mentor exists and is a mentor, etc.
    const name = formData.get("name") as string
    const mentor = formData.get("mentor") as string

    const result = await db.select().from(users).where(and(eq(users.name, mentor), eq(users.role, "mentor")))

    if (result.length === 0) {
        throw new Error(`Mentor with name "${mentor}" does not exist.`)
    }

    const mentorId = result[0].id

    await db.insert(groups).values({
        name,
        mentorId,
    })
    console.log(`Created group: ${name} with mentor: ${mentor}`)
}


// export const statistics = async () => {
//     "use server"
//     const studentsCount = await db.select().from(studentProfiles).execute()
//     const assistentsCount = await db.select().from(users).where(eq(users.role, "assistent")).execute()
//     const groupsCount = await db.select().from(groups).execute()

//     return {
//         students: studentsCount.length,
//         assistents: assistentsCount.length,
//         groups: groupsCount.length,
//     }
// }