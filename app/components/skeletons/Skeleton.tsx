interface SkeletonProps {
    className?: string;
    animate?: boolean;
}

export function Skeleton({ className = "", animate = true }: SkeletonProps) {
    return (
        <div
            className={`
                bg-border rounded-lg
                ${animate ? "animate-pulse" : ""}
                ${className}
            `}
        />
    );
}

export function SkeletonText({
    lines = 1,
    className = "",
}: {
    lines?: number;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
                />
            ))}
        </div>
    );
}

export function SkeletonCircle({
    size = "md",
    className = "",
}: {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}) {
    const sizes = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
    };

    return <Skeleton className={`${sizes[size]} rounded-full ${className}`} />;
}

export function SkeletonButton({ className = "" }: { className?: string }) {
    return <Skeleton className={`h-12 w-32 rounded-full ${className}`} />;
}
