"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    size?: "sm" | "md" | "lg";
}

const sizeStyles = {
    sm: "py-2 text-sm",
    md: "py-3",
    lg: "py-4 text-lg",
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            leftIcon,
            rightIcon,
            size = "md",
            type = "text",
            className = "",
            id,
            ...props
        },
        ref
    ) => {
        const [showPassword, setShowPassword] = useState(false);
        const isPassword = type === "password";
        const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-foreground mb-2"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                            {leftIcon}
                        </span>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        type={isPassword && showPassword ? "text" : type}
                        className={`
                            w-full rounded-xl border bg-background text-foreground
                            placeholder:text-text-muted
                            focus:border-primary focus:ring-2 focus:ring-primary/20
                            transition-all outline-none
                            ${sizeStyles[size]}
                            ${leftIcon ? "pl-12" : "pl-4"}
                            ${rightIcon || isPassword ? "pr-12" : "pr-4"}
                            ${error ? "border-error" : "border-border"}
                            ${className}
                        `}
                        {...props}
                    />
                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    )}
                    {rightIcon && !isPassword && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                            {rightIcon}
                        </span>
                    )}
                </div>
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
