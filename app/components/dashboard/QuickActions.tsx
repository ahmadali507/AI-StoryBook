import Link from "next/link";
import { Wand2, MessageCircle, BookOpen, Users, Printer, ArrowRight } from "lucide-react";

const creationModes = [
    {
        icon: Wand2,
        label: "Story Builder",
        description: "Create characters, choose theme, generate story step-by-step",
        href: "/story-generator",
        gradient: "from-primary to-primary/70",
        featured: true,
    },
    {
        icon: Users,
        label: "Character Creator",
        description: "Design unique characters for your stories",
        href: "/character-creator",
        gradient: "from-pink-500 to-pink-600",
        featured: true,
    },
    {
        icon: MessageCircle,
        label: "Chat with AI",
        description: "Describe your story idea in a natural conversation",
        href: "/story-chat",
        gradient: "from-secondary to-secondary/70",
        featured: true,
    },
];

const quickLinks = [
    {
        icon: Users,
        label: "My Characters",
        description: "Manage your characters",
        href: "/character-creator",
        color: "bg-primary/10 text-primary",
    },
    {
        icon: BookOpen,
        label: "My Library",
        description: "View your stories",
        href: "/library",
        color: "bg-success/10 text-success",
    },
    {
        icon: Printer,
        label: "Order Prints",
        description: "Get physical copies",
        href: "/order",
        color: "bg-warning/10 text-warning",
    },
];

export default function QuickActions() {
    return (
        <div className="mb-10">
            {/* Story Creation Options */}
            <div className="mb-8">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
                    Create a New Story
                </h2>
                <p className="text-sm text-text-muted mb-6">
                    Choose how you want to create your story
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                    {creationModes.map((mode) => {
                        const Icon = mode.icon;
                        return (
                            <Link
                                key={mode.label}
                                href={mode.href}
                                className={`relative overflow-hidden bg-gradient-to-br ${mode.gradient} rounded-2xl p-6 text-white hover:shadow-xl transition-all group cursor-pointer`}
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-heading font-semibold text-lg mb-1">
                                        {mode.label}
                                    </h3>
                                    <p className="text-sm text-white/80 mb-3">{mode.description}</p>
                                    <div className="flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all">
                                        Get Started
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Quick Links */}
            <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                Quick Links
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
                {quickLinks.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link
                            key={action.label}
                            href={action.href}
                            className="bg-surface border border-border rounded-2xl p-5 hover:shadow-lg transition-all group cursor-pointer"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <h3 className="font-heading font-semibold text-foreground text-sm mb-1">
                                {action.label}
                            </h3>
                            <p className="text-xs text-text-muted">{action.description}</p>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
