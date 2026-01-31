import Link from "next/link";
import { BookOpen, Twitter, Instagram, Facebook } from "lucide-react";

interface FooterLink {
    href: string;
    label: string;
}

interface FooterSection {
    title: string;
    links: FooterLink[];
}

const defaultSections: FooterSection[] = [
    {
        title: "Product",
        links: [
            { href: "/", label: "Features" },
            { href: "/", label: "Pricing" },
            { href: "/library", label: "Examples" },
        ],
    },
    {
        title: "Company",
        links: [
            { href: "/", label: "About" },
            { href: "/", label: "Privacy" },
            { href: "/", label: "Terms" },
        ],
    },
];

export default function Footer({ sections = defaultSections }: { sections?: FooterSection[] }) {
    return (
        <footer className="bg-surface border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 cursor-pointer">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-heading text-xl font-semibold text-foreground">
                                StoryMagic
                            </span>
                        </Link>
                        <p className="mt-4 text-text-muted max-w-sm">
                            Create personalized AI-generated storybooks for your children.
                            Design characters, craft adventures, and print beautiful keepsakes.
                        </p>
                        <div className="flex gap-4 mt-6">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="font-heading font-semibold text-foreground mb-4">
                                {section.title}
                            </h3>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-text-muted hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-text-muted text-sm">
                        © 2026 StoryMagic. All rights reserved.
                    </p>
                    <p className="text-text-muted text-sm">
                        Made with ❤️ for families everywhere
                    </p>
                </div>
            </div>
        </footer>
    );
}
