import { Suspense } from "react";
import { AuthLayout } from "@/app/components/layout";
import { SignupForm } from "@/app/components/auth";
import { AuthSkeleton } from "@/app/components/skeletons";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("auth.signup");

    return (
        <Suspense fallback={<AuthSkeleton />}>
            <AuthLayout
                title={t("pageTitle")}
                subtitle={t("pageSubtitle")}
                heroTitle={t("heroTitle")}
                heroSubtitle={t("heroSubtitle")}
            >
                <SignupForm />
            </AuthLayout>
        </Suspense>
    );
}
