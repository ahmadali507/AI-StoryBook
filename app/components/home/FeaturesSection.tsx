import Link from "next/link";
import { Wand2, MessageCircle, Sparkles, Truck, Users, CheckCircle } from "lucide-react";

const creationModes = [
    {
        icon: Wand2,
        title: "Story Builder",
        subtitle: "Step-by-Step Creation",
        description: "Perfect for users who want full control over their story.",
        href: "/character-creator",
        gradient: "from-primary via-primary/90 to-primary/70",
        features: [
            "Design custom characters with detailed appearance",
            "Choose from 6 beautiful art styles",
            "Select story setting and theme",
            "Generate 5-15 illustrated chapters",
        ],
    },
    {
        icon: MessageCircle,
        title: "Chat with AI",
        subtitle: "Conversational Creation",
        description: "Perfect for users who prefer a natural, guided experience.",
        href: "/story-chat",
        gradient: "from-secondary via-secondary/90 to-secondary/70",
        features: [
            "Describe your story idea in conversation",
            "AI guides you through the process",
            "Quick and intuitive creation",
            "Great for spontaneous inspiration",
        ],
    },
];

const additionalFeatures = [
    {
        icon: Users,
        title: "Character Library",
        description: "Save and reuse characters across multiple stories for consistency.",
        color: "bg-primary/10 text-primary",
    },
    {
        icon: Sparkles,
        title: "AI Illustrations",
        description: "Beautiful, consistent artwork generated for every scene.",
        color: "bg-secondary/10 text-secondary",
    },
    {
        icon: Truck,
        title: "Print & Deliver",
        description: "Order high-quality printed books delivered to your door.",
        color: "bg-success/10 text-success",
    },
];

export default function FeaturesSection() {
    return (
        <section className="py-16 lg:py-24 bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">
                        Two Ways to Create Your Story
                    </h2>
                    <p className="mt-4 text-text-muted max-w-2xl mx-auto">
                        Choose the creation style that works best for you
                    </p>
                </div>

                {/* Creation Modes */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {creationModes.map((mode) => {
                        const Icon = mode.icon;
                        return (
                            <Link
                                key={mode.title}
                                href={mode.href}
                                className={`relative overflow-hidden bg-gradient-to-br ${mode.gradient} rounded-3xl p-8 text-white hover:shadow-2xl transition-all group cursor-pointer`}
                            >
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform -translate-x-8 translate-y-8"></div>

                                <div className="relative">
                                    {/* Icon */}
                                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Icon className="w-8 h-8" />
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-heading text-2xl font-bold mb-1">
                                        {mode.title}
                                    </h3>
                                    <p className="text-white/70 text-sm mb-4">{mode.subtitle}</p>
                                    <p className="text-white/90 mb-6">{mode.description}</p>

                                    {/* Features */}
                                    <ul className="space-y-2">
                                        {mode.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-white/80">
                                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium group-hover:bg-white/30 transition-colors">
                                        Get Started →
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Additional Features */}
                <div className="text-center mb-8">
                    <h3 className="font-heading text-xl font-semibold text-foreground">
                        Included in Both Modes
                    </h3>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {additionalFeatures.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="bg-background border border-border rounded-2xl p-6 text-center hover:shadow-lg transition-shadow"
                            >
                                <div
                                    className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 ${feature.color}`}
                                >
                                    <Icon className="w-6 h-6" />
                                </div>
                                <h4 className="font-heading font-semibold text-foreground mb-2">
                                    {feature.title}
                                </h4>
                                <p className="text-sm text-text-muted">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
