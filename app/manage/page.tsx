
import { PageTitle } from "@/components/ui/PageTitle"
import { db } from "@/lib/db"
import { groups, students } from "@/lib/schema"
import { Manage } from "@/components/Manage"

const page = async () => {

    const [allStudents, allGroups] = await Promise.all([
        db.select().from(students),
        db.select().from(groups),
    ]);

    return (
        <>
            <PageTitle title="Manage" description="score and control your students" />
            <Manage allStudents={allStudents} allGroups={allGroups} />
        </>
    )
}

export default page