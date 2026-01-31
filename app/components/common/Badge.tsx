import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "primary" | "secondary";
type BadgeSize = "sm" | "md";

interface BadgeProps {
    children: ReactNode;
    variant?: BadgeVariant;
    size?: BadgeSize;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-text-muted/10 text-text-muted",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    error: "bg-error/10 text-error",
    info: "bg-info/10 text-info",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
};

const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
};

export default function Badge({
    children,
    variant = "default",
    size = "md",
    className = "",
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center font-medium rounded-full whitespace-nowrap
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `}
        >
            {children}
        </span>
    );
}
