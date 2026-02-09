"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { signupSchema, type SignupInput } from "@/schemas/auth";
import { signUp } from "@/actions/auth";
import { Input } from "@/app/components/common";
import { useToast } from "@/providers/ToastProvider";
import SocialLogin from "./SocialLogin";
import PasswordStrength from "./PasswordStrength";

// Convert technical error messages to user-friendly ones
function getFriendlySignupErrorMessage(error: string): string {
    const errorLower = error.toLowerCase();

    if (errorLower.includes("already registered") || errorLower.includes("already exists")) {
        return "This email is already registered. Try signing in instead.";
    }
    if (errorLower.includes("password") && errorLower.includes("weak")) {
        return "Please choose a stronger password with letters, numbers, and symbols.";
    }
    if (errorLower.includes("invalid email") || errorLower.includes("email format")) {
        return "Please enter a valid email address.";
    }
    if (errorLower.includes("rate limit") || errorLower.includes("too many")) {
        return "Too many attempts. Please wait a moment and try again.";
    }
    if (errorLower.includes("network") || errorLower.includes("fetch")) {
        return "Connection issue. Please check your internet and try again.";
    }

    return "Something went wrong. Please try again.";
}

export default function SignupForm() {
    const router = useRouter();
    const toast = useToast();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const password = watch("password");

    const { mutate, isPending } = useMutation({
        mutationFn: signUp,
        onSuccess: (result) => {
            if (result.success && result.redirectTo) {
                toast.success("Account created! Welcome to StoryMagic ✨");
                router.push(result.redirectTo);
            } else if (result.error) {
                const friendlyMessage = getFriendlySignupErrorMessage(result.error);
                toast.error(friendlyMessage);
                setServerError(friendlyMessage);
            }
        },
        onError: () => {
            const message = "Something went wrong. Please try again.";
            toast.error(message);
            setServerError(message);
        },
    });

    const onSubmit = (data: SignupInput) => {
        setServerError(null);
        mutate({
            email: data.email,
            password: data.password,
            name: data.name,
        });
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Full Name */}
                <Input
                    label="Full Name"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    leftIcon={<User className="w-5 h-5" />}
                    error={errors.name?.message}
                    {...register("name")}
                />

                {/* Email */}
                <Input
                    label="Email"
                    type="email"
                    placeholder="e.g. jane@example.com"
                    leftIcon={<Mail className="w-5 h-5" />}
                    error={errors.email?.message}
                    {...register("email")}
                />

                {/* Password */}
                <div>
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        leftIcon={<Lock className="w-5 h-5" />}
                        error={errors.password?.message}
                        {...register("password")}
                    />
                    <PasswordStrength password={password} />
                </div>

                {/* Confirm Password */}
                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="w-5 h-5" />}
                    error={errors.confirmPassword?.message}
                    {...register("confirmPassword")}
                />

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-secondary text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        "Create Account"
                    )}
                </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-text-muted">or sign up with</span>
                <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social Signup */}
            <SocialLogin />

            {/* Sign In Link */}
            <p className="mt-8 text-center text-text-muted">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary font-medium hover:underline cursor-pointer">
                    Sign in
                </Link>
            </p>
        </>
    );
}
