import Link from "next/link";
import { forwardRef } from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    children: ReactNode;
    className?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    isLoading?: boolean;
    fullWidth?: boolean;
}

interface ButtonAsButton extends ButtonBaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
    href?: never;
}

interface ButtonAsLink extends ButtonBaseProps {
    href: string;
    disabled?: boolean;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-primary text-white hover:opacity-90",
    secondary: "bg-secondary text-white hover:opacity-90",
    outline: "bg-transparent border-2 border-border text-foreground hover:border-primary hover:text-primary",
    ghost: "bg-transparent text-text-muted hover:text-foreground hover:bg-background",
    danger: "bg-error text-white hover:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            children,
            className = "",
            leftIcon,
            rightIcon,
            isLoading = false,
            fullWidth = false,
            href,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = `
            inline-flex items-center justify-center gap-2
            rounded-full font-semibold
            transition-all duration-200
            cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
        `;

        const combinedStyles = `
            ${baseStyles}
            ${variantStyles[variant]}
            ${sizeStyles[size]}
            ${fullWidth ? "w-full" : ""}
            ${className}
        `.trim();

        const content = (
            <>
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    leftIcon
                )}
                {children}
                {!isLoading && rightIcon}
            </>
        );

        if (href) {
            return (
                <Link href={href} className={combinedStyles}>
                    {content}
                </Link>
            );
        }

        return (
            <button
                ref={ref}
                className={combinedStyles}
                disabled={disabled || isLoading}
                {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
            >
                {content}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
