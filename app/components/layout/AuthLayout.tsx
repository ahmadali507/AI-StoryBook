import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    heroTitle: string;
    heroSubtitle: string;
}

export default function AuthLayout({
    children,
    title,
    subtitle,
    heroTitle,
    heroSubtitle,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Decorative */}
            <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-primary via-primary to-primary-light relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-32 h-32 border border-white rounded-full" />
                    <div className="absolute bottom-40 right-20 w-48 h-48 border border-white rounded-full" />
                    <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-white rounded-full" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
                    <h1
                        className="font-heading text-4xl font-bold text-white mb-4"
                        dangerouslySetInnerHTML={{ __html: heroTitle }}
                    />
                    <p className="text-white/80 text-lg max-w-sm mb-10">
                        {heroSubtitle}
                    </p>

                    {/* Illustration */}
                    <div className="w-72 h-72 relative">
                        <Image
                            src="/auth-illustration.png"
                            alt="Magical Book"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-heading text-2xl font-semibold text-foreground">
                            StoryMagic
                        </span>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                            {title}
                        </h2>
                        <p className="text-text-muted">{subtitle}</p>
                    </div>

                    {/* Form Content */}
                    {children}
                </div>
            </div>
        </div>
    );
}
