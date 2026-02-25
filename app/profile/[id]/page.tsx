import { redirect } from "next/navigation";
import { getProfileById, getProfile } from "@/actions/profile";
import { getCurrentUser } from "@/actions/auth";
import ProfileForm from "@/app/components/profile/ProfileForm";
import NavbarClient from "@/app/components/NavbarClient";
import { QueryProvider } from "@/providers/query-provider";

export const metadata = {
    title: "Account Settings — StoryMagic",
    description: "Manage your personal information and preferences",
};

export const dynamic = "force-dynamic";

interface ProfilePageProps {
    params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { id } = await params;

    // Fetch the profile for this user id
    const profile = await getProfileById(id);

    if (!profile) {
        redirect("/auth/login");
    }

    // Check if the viewer is the owner — only owner can edit
    const currentUser = await getCurrentUser();
    const isOwner = currentUser?.id === profile.id;

    return (
        <QueryProvider>
            <NavbarClient />
            <ProfileForm profile={profile} isOwner={isOwner} />
        </QueryProvider>
    );
}
