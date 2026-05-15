"use client"
import { authClient } from "@/lib/auth-client";

export const SignOutButton = () => {

    const handleSignOut = async () => {
        const { error } = await authClient.signOut();
        if (error) {
            console.error('Error signing out:', error);
        } else {
            console.log('Successfully signed out');
            window.location.href = '/'; // Redirect to home page after sign out
        }
    }

    return (
        <div onClick={handleSignOut}>Sign Out</div>
    )
}
