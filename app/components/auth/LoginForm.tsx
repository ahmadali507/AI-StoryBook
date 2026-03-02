"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, Lock, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/schemas/auth";
import { signIn } from "@/actions/auth";
import { Input } from "@/app/components/common";
import { useToast } from "@/providers/ToastProvider";
import { useTranslations, useLocale } from "next-intl";
import SocialLogin from "./SocialLogin";

export default function LoginForm() {
    const router = useRouter();
    const toast = useToast();
    const t = useTranslations("auth.login");
    const locale = useLocale();
    const tErr = useTranslations("auth.errors");
    const [serverError, setServerError] = useState<string | null>(null);

    // Convert technical error messages to user-friendly translated ones
    function getFriendlyErrorMessage(error: string): string {
        const errorLower = error.toLowerCase();
        if (errorLower.includes("invalid login credentials") || errorLower.includes("invalid password")) return tErr("invalidCredentials");
        if (errorLower.includes("email not confirmed")) return tErr("emailNotConfirmed");
        if (errorLower.includes("user not found") || errorLower.includes("no user")) return tErr("userNotFound");
        if (errorLower.includes("rate limit") || errorLower.includes("too many")) return tErr("rateLimit");
        if (errorLower.includes("network") || errorLower.includes("fetch")) return tErr("network");
        return tErr("generic");
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: signIn,
        onSuccess: (result) => {
            if (result.success && result.redirectTo) {
                toast.success(t("welcomeBack"));
                router.push(result.redirectTo);
            } else if (result.error) {
                const friendlyMessage = getFriendlyErrorMessage(result.error);
                toast.error(friendlyMessage);
                setServerError(friendlyMessage);
            }
        },
        onError: () => {
            const message = tErr("generic");
            toast.error(message);
            setServerError(message);
        },
    });

    const onSubmit = (data: LoginInput) => {
        setServerError(null);
        mutate(data);
    };

    return (
        <>
            {serverError && (
                <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <Input
                    label={t("emailLabel")}
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    leftIcon={<Mail className="w-5 h-5" />}
                    error={errors.email?.message}
                    {...register("email")}
                />
                <Input
                    label={t("passwordLabel")}
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.password?.message}
                    {...register("password")}
                />
                <div className="flex justify-end">
                    <Link href={`/${locale}/forgot-password`} className="text-sm text-primary hover:underline cursor-pointer">
                        {t("forgotPassword")}
                    </Link>
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-secondary text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t("signingIn")}
                        </>
                    ) : (
                        t("signInBtn")
                    )}
                </button>
            </form>

            <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-text-muted">{t("divider")}</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            <SocialLogin />

            <p className="mt-8 text-center text-text-muted">
                {t("noAccount")}{" "}
                <Link href={`/${locale}/auth/signup`} className="text-primary font-medium hover:underline cursor-pointer">
                    {t("signUp")}
                </Link>
            </p>
        </>
    );
}
