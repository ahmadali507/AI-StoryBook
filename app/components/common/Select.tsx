"use client";

import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
    label?: string;
    error?: string;
    options: SelectOption[];
    size?: "sm" | "md" | "lg";
    placeholder?: string;
}

const sizeStyles = {
    sm: "py-2 text-sm",
    md: "py-3",
    lg: "py-4 text-lg",
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    (
        {
            label,
            error,
            options,
            size = "md",
            placeholder,
            className = "",
            id,
            ...props
        },
        ref
    ) => {
        const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-foreground mb-2"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={selectId}
                        className={`
                            w-full appearance-none rounded-xl border bg-surface text-foreground
                            focus:border-primary focus:ring-2 focus:ring-primary/20
                            transition-all outline-none cursor-pointer
                            pl-4 pr-10
                            ${sizeStyles[size]}
                            ${error ? "border-error" : "border-border"}
                            ${className}
                        `}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                </div>
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";

export default Select;
