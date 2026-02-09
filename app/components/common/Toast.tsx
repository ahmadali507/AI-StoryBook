"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
    success: {
        bg: "bg-green-50",
        border: "border-green-200",
        icon: "text-green-500",
        text: "text-green-800",
    },
    error: {
        bg: "bg-red-50",
        border: "border-red-200",
        icon: "text-red-500",
        text: "text-red-800",
    },
    warning: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        icon: "text-amber-500",
        text: "text-amber-800",
    },
    info: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        icon: "text-blue-500",
        text: "text-blue-800",
    },
};

const icons: Record<ToastType, React.ElementType> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

export default function Toast({ id, type, message, duration = 5000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [progress, setProgress] = useState(100);

    const styles = toastStyles[type];
    const Icon = icons[type];

    useEffect(() => {
        // Trigger enter animation
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        // Progress bar animation
        const startTime = Date.now();
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
        }, 50);

        // Auto dismiss
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [duration]);

    const handleClose = () => {
        setIsLeaving(true);
        setTimeout(() => {
            onClose(id);
        }, 300);
    };

    return (
        <div
            className={`
                relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm
                transform transition-all duration-300 ease-out
                ${styles.bg} ${styles.border}
                ${isVisible && !isLeaving ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
            `}
            role="alert"
        >
            <div className="flex items-start gap-3 p-4 pr-10">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
                <p className={`text-sm font-medium ${styles.text}`}>{message}</p>
            </div>

            {/* Close button */}
            <button
                onClick={handleClose}
                className={`
                    absolute top-3 right-3 p-1 rounded-full
                    hover:bg-black/5 transition-colors
                    ${styles.text}
                `}
                aria-label="Close notification"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5">
                <div
                    className={`h-full transition-all duration-50 ${styles.icon.replace("text-", "bg-")}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
