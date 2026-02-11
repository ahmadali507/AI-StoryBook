"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedStepProps {
    step: number;
    title: string;
    description: string;
    delay?: number;
}

export default function AnimatedStep({ step, title, description, delay = 0, isLast = false }: { step: number; title: string; description: string; delay?: number; isLast?: boolean }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            {
                threshold: 0.5, // Trigger when 50% visible
                rootMargin: "0px 0px -20% 0px" // Trigger slightly before center
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="relative flex gap-8 group">
            {/* Connecting Line */}
            {!isLast && (
                <div className="absolute left-6 top-14 bottom-0 w-0.5 -ml-px bg-slate-100 h-[calc(100%+2rem)]">
                    <div
                        className={cn(
                            "absolute top-0 left-0 w-full bg-indigo-300 transition-all duration-1000 ease-in-out",
                            isVisible ? "h-full" : "h-0"
                        )}
                    />
                </div>
            )}

            {/* Step Circle */}
            <div className={cn(
                "relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-all duration-500",
                isVisible
                    ? "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30"
                    : "bg-white border-slate-200 text-slate-300"
            )}>
                {step}
            </div>

            {/* Content */}
            <div className={cn(
                "pb-12 transition-all duration-700 transform",
                isVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-30 translate-x-10"
            )} style={{ transitionDelay: `${delay}ms` }}>
                <h3 className={cn(
                    "text-2xl font-bold mb-3 transition-colors duration-500",
                    isVisible ? "text-indigo-400" : "text-slate-400"
                )}>
                    {title}
                </h3>
                <p className="text-lg text-slate-400 leading-relaxed font-medium">
                    {description}4
                </p>
            </div>
        </div>
    );
}
