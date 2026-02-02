import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import ProfileDropdown from "@/app/components/ProfileDropdown";
import NavbarMobileMenu from "@/app/components/NavbarMobileMenu";

const navLinks = [
    { href: "/", label: "Features" },
    { href: "/", label: "Pricing" },
    { href: "/", label: "About" },
];

export default async function Navbar() {
    const user = await getCurrentUser();

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
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-text-muted hover:text-foreground transition-colors duration-200 font-medium cursor-pointer"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop CTA / Profile */}
                    <div className="hidden md:flex items-center gap-4">
                        {user ? (
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
                                    href="/story-generator"
                                    className="bg-secondary text-white px-5 py-2 rounded-full font-medium hover:opacity-90 transition-all duration-200 cursor-pointer"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu */}
                    <NavbarMobileMenu links={navLinks} showAuth={true} user={user} />
                </div>
            </nav>
        </header>
    );
}
