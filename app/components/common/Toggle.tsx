"use client";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
    size?: "sm" | "md";
}

const sizeStyles = {
    sm: {
        track: "w-10 h-5",
        thumb: "w-4 h-4",
        translate: "translate-x-5",
    },
    md: {
        track: "w-12 h-6",
        thumb: "w-5 h-5",
        translate: "translate-x-6",
    },
};

export default function Toggle({
    checked,
    onChange,
    label,
    description,
    disabled = false,
    size = "md",
}: ToggleProps) {
    const styles = sizeStyles[size];

    return (
        <div className="flex items-center justify-between">
            {(label || description) && (
                <div className="flex-1 mr-4">
                    {label && (
                        <p className="font-medium text-foreground">{label}</p>
                    )}
                    {description && (
                        <p className="text-sm text-text-muted">{description}</p>
                    )}
                </div>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`
                    ${styles.track}
                    rounded-full transition-colors cursor-pointer
                    ${checked ? "bg-primary" : "bg-border"}
                    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
            >
                <div
                    className={`
                        ${styles.thumb}
                        bg-white rounded-full shadow transition-transform
                        ${checked ? styles.translate : "translate-x-0.5"}
                    `}
                />
            </button>
        </div>
    );
}
