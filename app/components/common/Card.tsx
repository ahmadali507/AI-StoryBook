import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    variant?: "default" | "interactive" | "highlight";
    padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

const variantStyles = {
    default: "bg-surface border border-border",
    interactive: "bg-surface border border-border hover:shadow-lg transition-shadow cursor-pointer",
    highlight: "bg-primary/5 border-2 border-primary",
};

export default function Card({
    children,
    variant = "default",
    padding = "none",
    className = "",
    ...props
}: CardProps) {
    return (
        <div
            className={`
                rounded-2xl
                ${variantStyles[variant]}
                ${paddingStyles[padding]}
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}
