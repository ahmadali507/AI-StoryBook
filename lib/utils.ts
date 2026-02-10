// Minimal utility for merging class names (fallback implementation)
export function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(" ");
}

