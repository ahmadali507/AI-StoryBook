"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const switchLocale = (newLocale: string) => {
        if (newLocale === locale) return;

        startTransition(() => {
            // Replace locale prefix in the current path
            // pathname will be like /en/about → /cs/about
            const segments = pathname.split("/");
            segments[1] = newLocale; // replace the locale segment
            const newPath = segments.join("/");
            router.push(newPath);
            router.refresh();
        });
    };

    return (
        <div className="flex items-center gap-1 text-sm font-semibold" aria-label="Language switcher">
            <button
                onClick={() => switchLocale("en")}
                disabled={isPending}
                className={`px-2 py-1 rounded-md transition-all duration-200 ${locale === "en"
                        ? "text-indigo-600 bg-indigo-50 border border-indigo-200"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                    }`}
                aria-label="Switch to English"
            >
                EN
            </button>
            <span className="text-slate-300 select-none">|</span>
            <button
                onClick={() => switchLocale("cs")}
                disabled={isPending}
                className={`px-2 py-1 rounded-md transition-all duration-200 ${locale === "cs"
                        ? "text-indigo-600 bg-indigo-50 border border-indigo-200"
                        : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                    }`}
                aria-label="Switch to Czech"
            >
                CS
            </button>
        </div>
    );
}
