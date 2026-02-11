"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    threshold?: number;
    delay?: number; // Delay in milliseconds
    duration?: number; // Duration in milliseconds
    direction?: "up" | "down" | "left" | "right"; // Direction to slide from
}

export default function ScrollReveal({
    children,
    className = "",
    threshold = 0.1,
    delay = 0,
    duration = 700,
    direction = "up",
}: ScrollRevealProps) {
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
                threshold,
                rootMargin: "0px 0px -50px 0px", // Trigger slightly before the element is fully in view
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    const getInitialTransform = () => {
        switch (direction) {
            case "up": return "translateY(40px)";
            case "down": return "translateY(-40px)";
            case "left": return "translateX(-40px)";
            case "right": return "translateX(40px)";
            default: return "translateY(40px)";
        }
    };

    const getFinalTransform = () => {
        switch (direction) {
            case "up": case "down": return "translateY(0)";
            case "left": case "right": return "translateX(0)";
            default: return "translateY(0)";
        }
    };

    return (
        <div
            ref={ref}
            className={`${className} transition-all ease-out`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? getFinalTransform() : getInitialTransform(),
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}
