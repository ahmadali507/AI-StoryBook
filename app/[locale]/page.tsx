import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { Wand2, ArrowRight, Star, Sparkles, CheckCircle2 } from "lucide-react";
import AnimatedStep from "@/app/components/home/AnimatedStep";
import HeroCarousel from "@/app/components/home/HeroCarousel";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CharacterCarousel from "@/components/home/CharacterCarousel";
import LanguagePopup from "@/app/components/home/LanguagePopup";
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('home');
    const nav = await getTranslations('nav');

    const steps = [
        {
            step: 1,
            title: t('howItWorks.step1Title'),
            description: t('howItWorks.step1Desc'),
        },
        {
            step: 2,
            title: t('howItWorks.step2Title'),
            description: t('howItWorks.step2Desc'),
        },
        {
            step: 3,
            title: t('howItWorks.step3Title'),
            description: t('howItWorks.step3Desc'),
        },
    ];

    const printedBullets = [
        t('printed.bullet1'),
        t('printed.bullet2'),
        t('printed.bullet3'),
        t('printed.bullet4'),
        t('printed.bullet5'),
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <Navbar />

            <main className="pt-20">
                {/* 1. Hero Section */}
                <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
                    {/* Background Decorations */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-50 blur-3xl opacity-60"></div>
                        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-orange-50 blur-3xl opacity-60"></div>
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            {/* Text Content */}
                            <div className="space-y-8 text-center lg:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Sparkles className="w-4 h-4" />
                                    {t('hero.badge')}
                                </div>

                                <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
                                    {t('hero.title').split('Storybooks')[0]}
                                    <span className="relative inline-block text-indigo-600">
                                        Storybooks
                                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-400 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                                        </svg>
                                    </span>
                                </h1>

                                <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                                    {t('hero.subtitle')}
                                </p>

                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                                    <Link
                                        href={`/${locale}/create`}
                                        className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all duration-300 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                        {t('hero.cta')}
                                    </Link>
                                    <Link
                                        href={`/${locale}/create`}
                                        className="text-slate-600 font-semibold hover:text-indigo-600 transition-colors px-6 py-4"
                                    >
                                        {t('hero.tryFree')}
                                    </Link>
                                </div>
                            </div>

                            {/* Visuals */}
                            <div className="relative animate-in fade-in zoom-in duration-1000 delay-300">
                                <div className="relative z-10 transform lg:translate-x-12 lg:rotate-6 hover:rotate-0 transition-transform duration-500">
                                    <HeroCarousel />
                                </div>

                                {/* Floating Elements */}
                                <div className="absolute top-1/2 -left-4 lg:-left-12 bg-white p-3 rounded-2xl shadow-xl transform -rotate-6 animate-[pulse-glow_4s_infinite] z-20">
                                    <div className="w-24 h-24 bg-orange-100 rounded-xl overflow-hidden relative">
                                        <div className="absolute inset-0 flex items-center justify-center text-orange-300 text-4xl">🧒</div>
                                    </div>
                                </div>

                                <div className="absolute -bottom-8 right-12 lg:right-4 bg-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce duration-[3000ms] z-20">
                                    <div className="flex -space-x-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-indigo-${i * 200} flex items-center justify-center text-[10px]`}>
                                                ⭐
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-sm font-bold text-slate-700">
                                        <span className="text-indigo-600">2k+</span> {t('hero.happyParents')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Stats / Social Proof */}
                <section className="py-12 border-y border-slate-100 bg-slate-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center">
                            <div>
                                <div className="text-4xl font-bold text-indigo-600 mb-1">2,000+</div>
                                <div className="text-slate-600 font-medium">{t('stats.stories')}</div>
                            </div>
                            <div>
                                <div className="text-4xl font-bold text-indigo-600 mb-1">30+</div>
                                <div className="text-slate-600 font-medium">{t('stats.countries')}</div>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-2">
                                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{t('stats.featuredIn')}</span>
                                <div className="flex items-center gap-2 bg-white pl-2 pr-4 py-2 rounded-lg border border-orange-100 shadow-sm">
                                    <div className="w-8 h-8 bg-[#DA552F] rounded-full flex items-center justify-center text-white font-bold text-lg">P</div>
                                    <span className="font-bold text-slate-800">Product Hunt</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. How it Works */}
                <section className="py-24 bg-indigo-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20">
                            <h2 className="text-4xl lg:text-5xl font-bold text-indigo-600 mb-6">{t('howItWorks.title')}</h2>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                                {t('howItWorks.subtitle')}
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            {/* Visual */}
                            <div className="relative order-2 lg:order-1 perspective-1000">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-200/30 rounded-full blur-[80px] -z-10 animate-pulse-glow"></div>
                                <div className="absolute -top-10 -right-10 w-72 h-72 bg-pink-200/40 rounded-full blur-[60px] -z-10 animate-float" style={{ animationDelay: '1s' }}></div>
                                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-[60px] -z-10 animate-float" style={{ animationDelay: '2s' }}></div>

                                <div className="relative transform transition-transform duration-500 hover:scale-[1.02] animate-float">
                                    <div className="relative bg-gradient-to-br from-white via-white to-purple-50/50 backdrop-blur-sm rounded-[2.5rem] p-6 shadow-[0_20px_50px_-12px_rgba(124,58,237,0.2)] ring-1 ring-white/60 border border-white/40">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-transparent rounded-[2.5rem] pointer-events-none z-20"></div>
                                        <div className="bg-white rounded-[2rem] overflow-hidden aspect-[16/10] relative shadow-sm ring-1 ring-slate-100">
                                            <Image
                                                src="/images/home/creation-ui-preview.png"
                                                alt="Story Creation Interface"
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 to-transparent opacity-40"></div>
                                        </div>
                                        <div className="absolute -right-6 top-16 bg-white p-4 rounded-2xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] animate-bounce duration-[3000ms] z-30 ring-1 ring-slate-50 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-amber-500 fill-amber-500/20" />
                                        </div>
                                        <div className="absolute -left-6 bottom-20 bg-white p-4 rounded-2xl shadow-[0_10px_20px_-5px_rgba(0,0,0,0.1)] animate-bounce duration-[3500ms] delay-700 z-30 ring-1 ring-slate-50 flex items-center justify-center">
                                            <span className="text-3xl filter drop-shadow-sm">🎨</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Steps List */}
                            <div className="space-y-4 order-1 lg:order-2 pl-4">
                                {steps.map((item, index) => (
                                    <AnimatedStep
                                        key={item.step}
                                        step={item.step}
                                        title={item.title}
                                        description={item.description}
                                        delay={index * 200}
                                        isLast={index === 2}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Be The Hero Feature */}
                <section className="py-24 bg-orange-50/30 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-6">
                                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
                                    {t('hero2.title')} <span className="text-indigo-600">{t('hero2.titleHighlight')}</span> {t('hero2.titleEnd')}
                                </h2>
                                <p className="text-xl text-slate-600 leading-relaxed">
                                    {t('hero2.desc')}
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href={`/${locale}/create`}
                                        className="inline-flex bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        {t('hero2.cta')}
                                    </Link>
                                </div>
                            </div>

                            <div className="relative h-[500px] w-full">
                                <ScrollReveal className="absolute top-0 left-4 lg:left-0 z-10 hover:z-30 transition-all duration-300" delay={0} duration={700}>
                                    <div className="w-64 h-80 bg-white p-2 rounded-2xl shadow-xl transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300">
                                        <div className="w-full h-full relative rounded-xl overflow-hidden">
                                            <Image src="https://jhzkiwrzqpbzgtrfldup.supabase.co/storage/v1/object/public/generated-images/cc7995be-cfc1-46d2-a352-e586e82755a8/illustrations/1772090099104-1d48d7e1-2172-4679-a113-ee3bf91af754.webp" alt="Winter Wonderland Storybook" fill className="object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                                <p className="text-white text-xs font-bold text-center">Winter Wonderland</p>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal className="absolute top-12 right-4 lg:right-0 z-0 hover:z-30 transition-all duration-300" delay={200} duration={700}>
                                    <div className="w-64 h-80 bg-white p-2 rounded-2xl shadow-xl transform rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300">
                                        <div className="w-full h-full relative rounded-xl overflow-hidden">
                                            <Image src="https://jhzkiwrzqpbzgtrfldup.supabase.co/storage/v1/object/public/generated-images/62d5a42d-f1fc-473d-af11-0126739a4116/illustrations/1772188486960-433770d2-2084-4d36-a531-a8239467f67f.webp" alt="Brave Supergirl" fill className="object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                                <p className="text-white text-xs font-bold text-center">Brave Supergirl</p>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                                <ScrollReveal className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hover:z-30 transition-all duration-300" delay={400} duration={700}>
                                    <div className="w-72 h-64 bg-white p-2 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                                        <div className="w-full h-full relative rounded-xl overflow-hidden">
                                            <Image src="https://jhzkiwrzqpbzgtrfldup.supabase.co/storage/v1/object/public/generated-images/62d5a42d-f1fc-473d-af11-0126739a4116/illustrations/1772221745714-cf82faff-556e-4e74-b318-17f9fe5e055c.webp" alt="Space Adventure Storybook" fill className="object-cover" />
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                                <p className="text-white text-xs font-bold text-center">Magical Forest</p>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. Consistent Character Feature */}
                <section className="py-24 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1 w-full">
                                <CharacterCarousel />
                            </div>
                            <div className="order-1 lg:order-2 space-y-6">
                                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
                                    {t('characters.title')} <br />
                                    <span className="text-indigo-600">{t('characters.titleHighlight')}</span>
                                </h2>
                                <p className="text-xl text-slate-600 leading-relaxed">
                                    {t('characters.desc')}
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href={`/${locale}/create`}
                                        className="inline-flex bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        {t('characters.cta')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 6. High-Quality Printed Storybooks */}
                <section className="py-24 bg-indigo-50/30 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8 order-2 lg:order-1">
                                <ScrollReveal className="relative" delay={200} direction="left">
                                    <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                                        {t('printed.title')} <br />
                                        <span className="relative inline-block text-indigo-600">
                                            {t('printed.titleHighlight')}
                                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-400 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                                            </svg>
                                        </span>
                                    </h2>
                                </ScrollReveal>
                                <ScrollReveal className="relative" delay={200} direction="left">
                                    <p className="text-xl text-slate-600 leading-relaxed">{t('printed.desc')}</p>
                                </ScrollReveal>
                                <ul className="space-y-4">
                                    {printedBullets.map((item, index) => (
                                        <ScrollReveal key={index} className="relative" delay={400} direction="left">
                                            <li className="flex items-start gap-3">
                                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-slate-700">{item}</span>
                                            </li>
                                        </ScrollReveal>
                                    ))}
                                </ul>
                                <div className="pt-4">
                                    <Link
                                        href={`/${locale}/create`}
                                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-violet-200 hover:-translate-y-1 transform duration-200"
                                    >
                                        <Wand2 className="w-5 h-5" />
                                        {t('printed.cta')}
                                    </Link>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2">
                                <ScrollReveal className="relative" delay={200}>
                                    <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                        <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-white/50">
                                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                                                <Image src="/images/home/printed-book-showcase.jpg" alt="Printed Storybook Preview" fill className="object-cover" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"></div>
                                    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 -z-10 animate-pulse delay-700"></div>
                                </ScrollReveal>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 7. Final CTA */}
                <section className="py-24 bg-slate-900 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
                    <div className="relative z-10 max-w-4xl mx-auto px-4">
                        <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">{t('cta.title')}</h2>
                        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">{t('cta.desc')}</p>
                        <Link
                            href={`/${locale}/create`}
                            className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:from-indigo-400 hover:to-indigo-500 transition-all shadow-2xl shadow-indigo-500/30 hover:scale-105"
                        >
                            {t('cta.btn')}
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
            <LanguagePopup />
        </div>
    );
}
