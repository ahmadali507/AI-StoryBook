"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedStepProps {
    step: number;
    title: string;
    description: string;
    delay?: number;
}

export default function AnimatedStep({ step, title, description, delay = 0 }: AnimatedStepProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Only animate once
                }
            },
            {
                threshold: 0.2, // Trigger when 20% visible
                rootMargin: "0px 0px -50px 0px" // Slightly before bottom of screen
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={cn(
                "flex gap-6 group transition-all duration-1000 ease-out transform",
                isVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-20"
            )}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-xl font-bold text-indigo-600 border border-indigo-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                {step}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-lg text-slate-600 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
