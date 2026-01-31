"use client";

import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, hint, className = "", id, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={textareaId}
                        className="block text-sm font-medium text-foreground mb-2"
                    >
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    className={`
                        w-full px-4 py-3 rounded-xl border bg-surface text-foreground
                        placeholder:text-text-muted
                        focus:border-primary focus:ring-2 focus:ring-primary/20
                        transition-all outline-none resize-none
                        ${error ? "border-error" : "border-border"}
                        ${className}
                    `}
                    {...props}
                />
                {hint && !error && (
                    <p className="mt-1 text-xs text-text-muted">{hint}</p>
                )}
                {error && (
                    <p className="mt-1 text-sm text-error">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = "Textarea";

export default Textarea;
