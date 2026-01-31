import { Suspense } from "react";
import { AuthLayout } from "@/app/components/layout";
import { SignupForm } from "@/app/components/auth";
import { AuthSkeleton } from "@/app/components/skeletons";

export default function SignupPage() {
    return (
        <Suspense fallback={<AuthSkeleton />}>
            <AuthLayout
                title="Create Account"
                subtitle="Start your free personalized storybook today"
                heroTitle="Join the<br />StoryMagic Family"
                heroSubtitle="Create an account to start crafting magical stories starring your little ones."
            >
                <SignupForm />
            </AuthLayout>
        </Suspense>
    );
}
