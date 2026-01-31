import { Suspense } from "react";
import { AuthLayout } from "@/app/components/layout";
import { LoginForm } from "@/app/components/auth";
import { AuthSkeleton } from "@/app/components/skeletons";

export default function LoginPage() {
    return (
        <Suspense fallback={<AuthSkeleton />}>
            <AuthLayout
                title="Welcome Back"
                subtitle="Sign in to continue your storytelling journey"
                heroTitle="Create Magical<br />Stories Together"
                heroSubtitle="Sign in to continue crafting unforgettable storybooks for your little ones."
            >
                <LoginForm />
            </AuthLayout>
        </Suspense>
    );
}
