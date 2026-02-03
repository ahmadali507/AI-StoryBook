import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function CTASection() {
    return (
        <section className="py-16 lg:py-24 bg-primary">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-6">
                    Start Creating Magic Today
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                    Join thousands of families creating unforgettable stories.
                    Your first story is free!
                </p>
                <Link
                    href="/story-chat"
                    className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                >
                    <Sparkles className="w-5 h-5" />
                    Create Your First Story
                </Link>
            </div>
        </section>
    );
}
