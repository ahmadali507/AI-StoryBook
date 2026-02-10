import Link from "next/link";
import { BookOpen, Sparkles, Wand2 } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import ProfileDropdown from "@/app/components/ProfileDropdown";
import NavbarMobileMenu from "@/app/components/NavbarMobileMenu";

// Updated Navigation based on "Story Magician" design
const navLinks = [
    { href: "/create", label: "Create Story", icon: "wand" },
    { href: "/discover", label: "Discover", icon: "compass" },
    { href: "/pricing", label: "Pricing", icon: "credit-card" },
    { href: "/contact", label: "Contact Us", icon: "mail" },
];

export default async function Navbar() {
    const user = await getCurrentUser();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-indigo-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 cursor-pointer group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300 shadow-lg shadow-indigo-200">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-heading text-xl font-bold text-slate-800 tracking-tight">
                            STORY MAGICIAN
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors duration-200"
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
                            <Link
                                href="/create"
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-200 flex items-center gap-2 transform hover:-translate-y-0.5"
                            >
                                <Wand2 className="w-4 h-4" />
                                CREATE STORY
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu */}
                    <NavbarMobileMenu links={navLinks} showAuth={true} user={user} />
                </div>
            </nav>
        </header>
    );
}
