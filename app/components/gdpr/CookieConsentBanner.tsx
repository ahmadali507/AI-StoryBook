"use client";

import { useState } from "react";
import { Cookie, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { useTranslations } from "next-intl";

export default function CookieConsentBanner() {
    const { showBanner, acceptAll, rejectAll, saveCustom } = useCookieConsent();
    const [showDetails, setShowDetails] = useState(false);
    const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
    const [marketingEnabled, setMarketingEnabled] = useState(false);
    const t = useTranslations("cookie");

    if (!showBanner) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Cookie consent"
            className="fixed bottom-0 left-0 right-0 z-[100] animate-slide-up bg-white border-t border-gray-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
        >
            <div className="w-full px-4 sm:px-8 lg:px-12 py-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                            <Cookie className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 font-heading">{t("title")}</p>
                            <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                                {t("body")}{" "}
                                <a href="/privacy" className="text-primary hover:underline font-medium">{t("privacyPolicy")}</a>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary transition-colors px-3 py-2"
                        >
                            {t("managePrefs")}
                            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                            onClick={rejectAll}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            {t("rejectAll")}
                        </button>

                        {showDetails && (
                            <button
                                onClick={() => saveCustom(analyticsEnabled, marketingEnabled)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
                            >
                                {t("savePrefs")}
                            </button>
                        )}

                        <button
                            onClick={acceptAll}
                            className="px-6 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-primary-dark transition-colors shadow-sm shadow-primary/30"
                        >
                            {t("acceptAll")}
                        </button>
                    </div>
                </div>

                {showDetails && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-gray-100 pt-4">
                        <ConsentToggle
                            title={t("essential")}
                            description={t("essentialDesc")}
                            alwaysOnLabel={t("alwaysOn")}
                            enabled={true}
                            locked
                            onChange={() => { }}
                        />
                        <ConsentToggle
                            title={t("analytics")}
                            description={t("analyticsDesc")}
                            alwaysOnLabel={t("alwaysOn")}
                            enabled={analyticsEnabled}
                            onChange={setAnalyticsEnabled}
                        />
                        <ConsentToggle
                            title={t("marketing")}
                            description={t("marketingDesc")}
                            alwaysOnLabel={t("alwaysOn")}
                            enabled={marketingEnabled}
                            onChange={setMarketingEnabled}
                        />
                    </div>
                )}

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Shield className="w-3 h-3" />
                    <span>{t("gdprNote")}</span>
                </div>
            </div>
        </div>
    );
}

interface ConsentToggleProps {
    title: string;
    description: string;
    alwaysOnLabel: string;
    enabled: boolean;
    locked?: boolean;
    onChange: (val: boolean) => void;
}

function ConsentToggle({ title, description, alwaysOnLabel, enabled, locked, onChange }: ConsentToggleProps) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{title}</span>
                    {locked && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            {alwaysOnLabel}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <button
                role="switch"
                aria-checked={enabled}
                disabled={locked}
                onClick={() => !locked && onChange(!enabled)}
                className={`relative flex-shrink-0 w-10 h-5 rounded-full transition-colors duration-200 mt-0.5 ${enabled ? "bg-primary" : "bg-gray-200"} ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
        </div>
    );
}
