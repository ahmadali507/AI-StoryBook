"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Globe, X } from "lucide-react";

export default function LanguagePopup() {
    const [show, setShow] = useState(false);
    const t = useTranslations("popup");

    useEffect(() => {
        // Check if NEXT_LOCALE cookie exists
        const hasCookie = document.cookie.split(';').some((item) => item.trim().startsWith('NEXT_LOCALE='));
        if (!hasCookie) {
            // Delay slightly to not overwhelm immediately
            const timer = setTimeout(() => {
                setShow(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSelect = (locale: string) => {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
        setShow(false);
        // Force reload to apply selected locale correctly to URL
        window.location.href = `/${locale}`;
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 max-w-xs animate-in slide-in-from-bottom-5 fade-in duration-500">
            <button
                onClick={() => setShow(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close"
            >
                <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                    <Globe className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{t("title")}</h3>
                    <p className="text-xs text-slate-500 mt-1">{t("description")}</p>
                </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
                <button
                    onClick={() => handleSelect("en")}
                    className="w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                    {t("english")}
                </button>
                <button
                    onClick={() => handleSelect("cs")}
                    className="w-full text-center py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                    {t("czech")}
                </button>
            </div>
        </div>
    );
}
