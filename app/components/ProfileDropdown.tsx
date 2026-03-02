"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown, Settings } from "lucide-react";
import { signOut } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface ProfileDropdownProps {
    user: {
        id: string;
        email: string;
        name?: string;
        avatarUrl?: string;
    };
}

export default function ProfileDropdown({ user }: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const t = useTranslations("profile.dropdown");

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        startTransition(async () => {
            const result = await signOut();
            if (result.success && result.redirectTo) {
                router.push(result.redirectTo);
                router.refresh();
            }
        });
    };

    const getInitials = () => {
        if (user.name) {
            return user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        }
        return user.email[0].toUpperCase();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-background/80 transition-all duration-200 cursor-pointer"
                aria-label="Profile menu"
            >
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || "Profile"} className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-medium">
                        {getInitials()}
                    </div>
                )}
                <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-border bg-background/50">
                        <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name || "Profile"} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium">
                                    {getInitials()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                {user.name && <p className="font-medium text-foreground truncate">{user.name}</p>}
                                <p className="text-sm text-text-muted truncate">{user.email}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <Link
                            href={`/profile/${user.id}`}
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-background transition-colors duration-150 text-text-muted hover:text-foreground cursor-pointer"
                        >
                            <Settings className="w-4 h-4" />
                            <span className="font-medium">{t("accountSettings")}</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            disabled={isPending}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-background transition-colors duration-150 text-text-muted hover:text-foreground cursor-pointer disabled:opacity-50"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">
                                {isPending ? t("loggingOut") : t("logout")}
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
