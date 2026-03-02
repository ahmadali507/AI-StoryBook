import Link from "next/link";
import { BookOpen, Twitter, Instagram, Facebook } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";

export default async function Footer() {
    const t = await getTranslations("footer");
    const locale = await getLocale();

    return (
        <footer className="bg-surface border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href={`/${locale}`} className="flex items-center gap-2 cursor-pointer">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-heading text-xl font-semibold text-foreground">
                                StoryMagic
                            </span>
                        </Link>
                        <p className="mt-4 text-text-muted max-w-sm">
                            {t("brandDesc")}
                        </p>
                        <div className="flex gap-4 mt-6">
                            <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" aria-label="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-background flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" aria-label="Facebook">
                                <Facebook className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-heading font-semibold text-foreground mb-4">{t("product")}</h3>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-text-muted hover:text-foreground transition-colors cursor-pointer">{t("features")}</Link></li>
                            <li><Link href="/" className="text-text-muted hover:text-foreground transition-colors cursor-pointer">{t("pricing")}</Link></li>
                            <li><Link href={`/${locale}/create`} className="text-text-muted hover:text-foreground transition-colors cursor-pointer">{t("create")}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-heading font-semibold text-foreground mb-4">{t("company")}</h3>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-text-muted hover:text-foreground transition-colors cursor-pointer">{t("about")}</Link></li>
                            <li><Link href="/" className="text-text-muted hover:text-foreground transition-colors cursor-pointer">{t("privacy")}</Link></li>
                            <li><Link href="/" className="text-text-muted hover:text-foreground transition-colors cursor-pointer">{t("terms")}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-text-muted text-sm">{t("copyright")}</p>
                    <p className="text-text-muted text-sm">{t("madeWith")}</p>
                </div>
            </div>
        </footer>
    );
}
