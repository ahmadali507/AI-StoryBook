"use client";

import { useState, useEffect, useCallback } from "react";

const CONSENT_KEY = "ai_storybook_cookie_consent";
const CONSENT_VERSION = "1.0";

export interface CookieConsent {
    essential: true; // always true, can't be turned off
    analytics: boolean;
    marketing: boolean;
    timestamp: string;
    version: string;
}

type ConsentStatus = "pending" | "accepted" | "rejected" | "custom";

interface UseCookieConsentReturn {
    consent: CookieConsent | null;
    status: ConsentStatus;
    showBanner: boolean;
    acceptAll: () => void;
    rejectAll: () => void;
    saveCustom: (analytics: boolean, marketing: boolean) => void;
}

function buildConsent(analytics: boolean, marketing: boolean): CookieConsent {
    return {
        essential: true,
        analytics,
        marketing,
        timestamp: new Date().toISOString(),
        version: CONSENT_VERSION,
    };
}

export function useCookieConsent(): UseCookieConsentReturn {
    const [consent, setConsent] = useState<CookieConsent | null>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(CONSENT_KEY);
            if (stored) {
                const parsed: CookieConsent = JSON.parse(stored);
                setConsent(parsed);
                setShowBanner(false);
            } else {
                setShowBanner(true);
            }
        } catch {
            setShowBanner(true);
        }
    }, []);

    const save = useCallback((c: CookieConsent) => {
        localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
        setConsent(c);
        setShowBanner(false);
    }, []);

    const acceptAll = useCallback(() => {
        save(buildConsent(true, true));
    }, [save]);

    const rejectAll = useCallback(() => {
        save(buildConsent(false, false));
    }, [save]);

    const saveCustom = useCallback((analytics: boolean, marketing: boolean) => {
        save(buildConsent(analytics, marketing));
    }, [save]);

    const status: ConsentStatus = consent
        ? consent.analytics && consent.marketing
            ? "accepted"
            : !consent.analytics && !consent.marketing
                ? "rejected"
                : "custom"
        : "pending";

    return { consent, status, showBanner, acceptAll, rejectAll, saveCustom };
}
