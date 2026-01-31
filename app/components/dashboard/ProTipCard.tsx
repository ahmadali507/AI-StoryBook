import Link from "next/link";
import { Sparkles, TrendingUp } from "lucide-react";

export default function ProTipCard() {
    return (
        <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-8 text-white mt-8">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-heading text-xl font-semibold mb-2">
                        Pro Tip: Add More Characters!
                    </h3>
                    <p className="text-white/80 mb-4">
                        Stories with multiple characters are 3x more engaging. Create a friend for your hero!
                    </p>
                    <Link
                        href="/character-creator"
                        className="inline-flex items-center gap-2 bg-white text-primary px-5 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <Sparkles className="w-4 h-4" />
                        Create Character
                    </Link>
                </div>
            </div>
        </div>
    );
}
