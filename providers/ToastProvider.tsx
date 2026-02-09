"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Toast, { ToastType } from "@/app/components/common/Toast";

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextValue {
    showToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 5;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(
        (type: ToastType, message: string, duration?: number) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newToast: ToastItem = { id, type, message, duration };

            setToasts((prev) => {
                // Keep only the latest MAX_TOASTS - 1 toasts, then add the new one
                const updated = [...prev.slice(-(MAX_TOASTS - 1)), newToast];
                return updated;
            });
        },
        []
    );

    const success = useCallback(
        (message: string, duration?: number) => showToast("success", message, duration),
        [showToast]
    );

    const error = useCallback(
        (message: string, duration?: number) => showToast("error", message, duration),
        [showToast]
    );

    const warning = useCallback(
        (message: string, duration?: number) => showToast("warning", message, duration),
        [showToast]
    );

    const info = useCallback(
        (message: string, duration?: number) => showToast("info", message, duration),
        [showToast]
    );

    return (
        <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
            {children}

            {/* Toast Container - Fixed position bottom-right */}
            <div
                className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
                aria-live="polite"
                aria-label="Notifications"
            >
                {toasts.map((toast) => (
                    <div key={toast.id} className="pointer-events-auto">
                        <Toast
                            id={toast.id}
                            type={toast.type}
                            message={toast.message}
                            duration={toast.duration}
                            onClose={removeToast}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
