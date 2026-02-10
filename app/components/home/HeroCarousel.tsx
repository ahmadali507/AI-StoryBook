"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const CAROUSEL_IMAGES = [
    {
        src: "/hero-space.png",
        title: "Timmy's Galactic\nSchool Adventure",
        color: "from-indigo-100 to-white",
        shadow: "shadow-indigo-500/20"
    },
    {
        src: "/hero-forest.png",
        title: "Lily's Magical\nForest Tea Party",
        color: "from-green-100 to-white",
        shadow: "shadow-green-500/20"
    },
    {
        src: "/hero-dino.png",
        title: "Max and the\nDinosaur Discovery",
        color: "from-orange-100 to-white",
        shadow: "shadow-orange-500/20"
    }
];

export default function HeroCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
        }, 4000); // Change every 4 seconds

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-[320px] sm:w-[400px] aspect-[4/5] mx-auto perspective-1000">
            {CAROUSEL_IMAGES.map((item, index) => {
                const isActive = index === currentIndex;
                // Calculate offset for stacking effect? Or just fade?
                // Let's do a pure fade/slide transition for simplicity and elegance

                return (
                    <div
                        key={item.src}
                        className={cn(
                            "absolute inset-0 transition-all duration-1000 ease-in-out transform",
                            isActive
                                ? "opacity-100 translate-x-0 rotate-0 z-10 scale-100"
                                : "opacity-0 translate-x-8 rotate-3 z-0 scale-95"
                        )}
                    >
                        <div className={cn(
                            "relative w-full h-full rounded-r-2xl shadow-2xl overflow-hidden border-l-[12px] border-l-slate-900",
                            item.shadow
                        )}>
                            <Image
                                src={item.src}
                                alt={item.title}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />

                            {/* Shine Effect Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-150%] animate-[shimmer_3s_infinite]"></div>
                        </div>
                    </div>
                );
            })}

            {/* Optional: Indicators */}
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2">
                {CAROUSEL_IMAGES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            idx === currentIndex ? "bg-indigo-600 w-6" : "bg-slate-300"
                        )}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
