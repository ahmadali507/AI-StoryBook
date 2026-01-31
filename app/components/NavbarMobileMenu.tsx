"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import ProfileDropdown from "@/app/components/ProfileDropdown";

interface NavLink {
    href: string;
    label: string;
}

interface NavbarMobileMenuProps {
    links: NavLink[];
    showAuth: boolean;
    user: {
        id: string;
        email: string;
        name?: string;
        avatarUrl?: string;
    } | null;
}

export default function NavbarMobileMenu({ links, showAuth, user }: NavbarMobileMenuProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <>
            {/* Mobile menu button */}
            <button
                type="button"
                className="md:hidden p-2 rounded-lg hover:bg-background transition-colors cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
            >
                {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-foreground" />
                ) : (
                    <Menu className="w-6 h-6 text-foreground" />
                )}
            </button>

            {/* Mobile menu dropdown */}
            {mobileMenuOpen && (
                <div className="absolute top-16 left-0 right-0 md:hidden bg-surface border-b border-border">
                    <div className="px-4 py-4">
                        <div className="flex flex-col gap-4">
                            {links.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="text-text-muted hover:text-foreground transition-colors duration-200 font-medium py-2 cursor-pointer"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {showAuth && (
                                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                                    {user ? (
                                        <div className="py-2">
                                            <ProfileDropdown user={user} />
                                        </div>
                                    ) : (
                                        <>
                                            <Link
                                                href="/auth/login"
                                                className="text-text-muted hover:text-foreground transition-colors duration-200 font-medium py-2 cursor-pointer"
                                            >
                                                Login
                                            </Link>
                                            <Link
                                                href="/create"
                                                className="bg-secondary text-white px-5 py-2.5 rounded-full font-medium text-center hover:opacity-90 transition-all duration-200 cursor-pointer"
                                            >
                                                Get Started
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
