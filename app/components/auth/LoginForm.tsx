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
import SocialLogin from "./SocialLogin";

export default function LoginForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const { mutate, isPending } = useMutation({
        mutationFn: signIn,
        onSuccess: (result) => {
            if (result.success && result.redirectTo) {
                router.push(result.redirectTo);
            } else if (result.error) {
                setServerError(result.error);
            }
        },
        onError: (error) => {
            setServerError(error.message || "An unexpected error occurred");
        },
    });

    const onSubmit = (data: LoginInput) => {
        setServerError(null);
        mutate(data);
    };

    return (
        <>
            {/* Server Error */}
            {serverError && (
                <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
                    {serverError}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email */}
                <Input
                    label="Email"
                    type="email"
                    placeholder="e.g., your@email.com"
                    leftIcon={<Mail className="w-5 h-5" />}
                    error={errors.email?.message}
                    {...register("email")}
                />

                {/* Password */}
                <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.password?.message}
                    {...register("password")}
                />

                {/* Forgot Password */}
                <div className="flex justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-primary hover:underline cursor-pointer"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-secondary text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-text-muted">or continue with</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social Login */}
            <SocialLogin />

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-text-muted">
                Don&apos;t have an account?{" "}
                <Link href="/auth/signup" className="text-primary font-medium hover:underline cursor-pointer">
                    Sign up
                </Link>
            </p>
        </>
    );
}
