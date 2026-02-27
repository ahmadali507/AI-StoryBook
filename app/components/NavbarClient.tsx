"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Wand2, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import ProfileDropdown from "@/app/components/ProfileDropdown";
import NavbarMobileMenu from "@/app/components/NavbarMobileMenu";

// MVP Navigation - simplified for gift-oriented experience
const navLinks = [
    { href: "/create", label: "Create Book", icon: "wand" },
    { href: "/create", label: "AI Chat", icon: "chat" },
];

export default function NavbarClient() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (error) {
                console.error("Failed to load user:", error);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 cursor-pointer">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-heading text-xl font-semibold text-foreground">
                            StoryMagic
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors duration-200 font-medium cursor-pointer"
                            >
                                {link.icon === "wand" && <Wand2 className="w-4 h-4" />}
                                {link.icon === "chat" && <MessageCircle className="w-4 h-4" />}
                                {link.label}
                            </Link>
                        ))}
                        {user && (
                            <Link
                                href="/orders"
                                className="flex items-center gap-2 text-text-muted hover:text-foreground transition-colors duration-200 font-medium cursor-pointer"
                            >
                                <BookOpen className="w-4 h-4" />
                                Orders
                            </Link>
                        )}
                    </div>

                    {/* Desktop CTA / Profile */}
                    <div className="hidden md:flex items-center gap-4">
                        {loading ? (
                            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        ) : user ? (
                            <ProfileDropdown user={user} />
                        ) : (
                            <>
                                <Link
                                    href="/auth/login"
                                    className="text-text-muted hover:text-foreground transition-colors duration-200 font-medium cursor-pointer"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/create"
                                    className="bg-gradient-to-r from-primary to-secondary text-white px-5 py-2 rounded-full font-medium hover:opacity-90 transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20"
                                >
                                    Create Your Book
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu */}
                    <NavbarMobileMenu
                        links={user ? [...navLinks, { href: "/orders", label: "Orders" }] : navLinks}
                        showAuth={true}
                        user={user}
                    />
                </div>
            </nav>
        </header>
    );
}
