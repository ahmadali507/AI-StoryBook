import { redirect } from "next/navigation";
import { getProfileById } from "@/actions/profile";
import { getCurrentUser } from "@/actions/auth";
import ProfileForm from "@/app/components/profile/ProfileForm";
import NavbarClient from "@/app/components/NavbarClient";
import { QueryProvider } from "@/providers/query-provider";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

interface ProfilePageProps {
    params: Promise<{ id: string; locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { id, locale } = await params;
    setRequestLocale(locale);

    const profile = await getProfileById(id);

    if (!profile) {
        redirect(`/${locale}/auth/login`);
    }

    const currentUser = await getCurrentUser();
    const isOwner = currentUser?.id === profile.id;

    return (
        <QueryProvider>
            <NavbarClient />
            <ProfileForm profile={profile} isOwner={isOwner} />
        </QueryProvider>
    );
}
