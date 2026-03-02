import type { Metadata } from "next";
import { Outfit, Inter, Cinzel_Decorative, Crimson_Text } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import { ToastProvider } from "@/providers/ToastProvider";
import { StoryGenerationProvider } from "@/providers/StoryGenerationProvider";
import StoryGenerationStatus from "@/app/components/story/StoryGenerationStatus";
import CookieConsentBanner from "@/app/components/gdpr/CookieConsentBanner";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import "../globals.css";

const outfit = Outfit({
    variable: "--font-outfit",
    subsets: ["latin", "latin-ext"],
    weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "500", "600"],
});

const cinzel = Cinzel_Decorative({
    variable: "--font-cinzel",
    subsets: ["latin"],
    weight: ["400", "700", "900"],
});

const crimson = Crimson_Text({
    variable: "--font-crimson",
    subsets: ["latin", "latin-ext"],
    weight: ["400", "600", "700"],
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'metadata' });
    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    setRequestLocale(locale);
    const messages = await getMessages();

    return (
        <html lang={locale}>
            <body
                className={`${outfit.variable} ${inter.variable} ${cinzel.variable} ${crimson.variable} font-sans antialiased bg-background text-foreground`}
            >
                <NextIntlClientProvider messages={messages}>
                    <QueryProvider>
                        <ToastProvider>
                            <StoryGenerationProvider>
                                {children}
                                <StoryGenerationStatus />
                            </StoryGenerationProvider>
                        </ToastProvider>
                        <CookieConsentBanner />
                    </QueryProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
