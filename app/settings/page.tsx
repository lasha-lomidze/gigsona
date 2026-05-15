import { PageTitle } from "../../components/ui/PageTitle"
import { authServer } from "@/lib/auth-server";
import { SignOutButton } from "@/components/SignOutButton";

const page = async () => {

    const session = await authServer.getSession();
    console.log('Session in Settings Page:', session?.user);

    return (
        <div>
            <PageTitle title="Settings" description="Configure your preferences" />
            {session && <SignOutButton />}
        </div>
    )
}

export default page