import Image from "next/image";
import Link from "next/link";
import { Sparkles, ChevronRight, MessageCircle, Wand2 } from "lucide-react";

export default function HeroSection() {
    return (
        <section className="pt-24 pb-16 lg:pt-32 lg:pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="text-center lg:text-left">
                        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                            Create Personalized Storybooks with{" "}
                            <span className="text-primary">AI</span>
                        </h1>
                        <p className="mt-6 text-lg text-text-muted max-w-xl mx-auto lg:mx-0">
                            Instantly generate unique, illustrated stories starring your child,
                            crafted with advanced artificial intelligence. Perfect for bedtime and gifts.
                        </p>

                        {/* Two Creation Options */}
                        <div className="mt-10 space-y-4">
                            <p className="text-sm font-medium text-text-muted uppercase tracking-wider">
                                Choose Your Creation Style
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                {/* Standard Flow Option */}
                                <Link
                                    href="/character-creator"
                                    className="group bg-gradient-to-br from-primary to-primary/80 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 flex flex-col items-center sm:items-start gap-2 cursor-pointer min-w-[200px]"
                                >
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="w-5 h-5" />
                                        <span>Story Builder</span>
                                    </div>
                                    <span className="text-xs font-normal text-white/80">
                                        Create characters → Choose theme → Generate
                                    </span>
                                </Link>

                                {/* Chat AI Option */}
                                <Link
                                    href="/story-chat"
                                    className="group bg-gradient-to-br from-secondary to-secondary/80 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-xl hover:shadow-secondary/25 transition-all duration-300 flex flex-col items-center sm:items-start gap-2 cursor-pointer min-w-[200px]"
                                >
                                    <div className="flex items-center gap-2">
                                        <MessageCircle className="w-5 h-5" />
                                        <span>Chat with AI</span>
                                    </div>
                                    <span className="text-xs font-normal text-white/80">
                                        Describe your story idea in conversation
                                    </span>
                                </Link>
                            </div>
                        </div>

                        {/* Secondary Action */}
                        <div className="mt-6 flex justify-center lg:justify-start">
                            <Link
                                href="/"
                                className="text-text-muted hover:text-primary transition-colors flex items-center gap-1 text-sm"
                            >
                                Watch Demo
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Illustration */}
                    <div className="relative">
                        <div className="relative w-full max-w-lg mx-auto">
                            {/* Decorative background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent rounded-3xl transform rotate-3"></div>

                            {/* Hero Image */}
                            <div className="relative">
                                <Image
                                    src="/hero-storybook.png"
                                    alt="Magical storybook with glowing pages and floating stars"
                                    width={500}
                                    height={500}
                                    className="w-full h-auto drop-shadow-2xl"
                                    priority
                                />
                            </div>

                            {/* Decorative elements */}
                            <div className="absolute -top-4 -right-4 w-12 h-12 bg-secondary/20 rounded-full animate-pulse"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/20 rounded-full animate-pulse delay-300"></div>
                            <div className="absolute top-1/4 -left-8 w-8 h-8 bg-primary/15 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
