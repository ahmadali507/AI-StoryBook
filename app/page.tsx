import Link from "next/link";
import Image from "next/image";
import { Navbar, Footer } from "@/app/components/layout";
import { Wand2, ArrowRight, Star, Sparkles, CheckCircle2 } from "lucide-react";
import AnimatedStep from "@/app/components/home/AnimatedStep";
import HeroCarousel from "@/app/components/home/HeroCarousel";

export default function Home() {
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
                  Running on Seedream 4.5 AI
                </div>

                <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
                  Create magical personalized children <span className="relative inline-block text-indigo-600">
                    Storybooks
                    <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-400 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                  </span>
                </h1>

                <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                  Empower reading skills, confidence, and imagination with one-of-a-kind stories where your child is the star.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                  <Link
                    href="/create"
                    className="bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-indigo-700 transition-all duration-300 shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2"
                  >
                    <Wand2 className="w-5 h-5" />
                    Create your Storybook
                  </Link>
                  <Link
                    href="/create"
                    className="text-slate-600 font-semibold hover:text-indigo-600 transition-colors px-6 py-4"
                  >
                    Try it for Free!
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
                    {/* Placeholder for child photo */}
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
                    <span className="text-indigo-600">2k+</span> Happy Parents
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
                <div className="text-slate-600 font-medium">Stories Created</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-indigo-600 mb-1">30+</div>
                <div className="text-slate-600 font-medium">Countries Served</div>
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Featured In</span>
                <div className="flex items-center gap-2 bg-white pl-2 pr-4 py-2 rounded-lg border border-orange-100 shadow-sm">
                  <div className="w-8 h-8 bg-[#DA552F] rounded-full flex items-center justify-center text-white font-bold text-lg">P</div>
                  <span className="font-bold text-slate-800">Product Hunt</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How it Works */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">Start Creating</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Turn your child's imagination into a beautifully illustrated book in just three magical steps.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Visual: Laptop Mockup */}
              <div className="relative order-2 lg:order-1">
                <div className="relative bg-slate-900 rounded-[2rem] p-4 shadow-2xl border-[8px] border-slate-800">
                  <div className="bg-white rounded-xl overflow-hidden aspect-[16/10] relative">
                    {/* Inner Screen Content Placeholder */}
                    <div className="absolute inset-0 bg-slate-50 flex items-center justify-center text-slate-200">
                      <div className="text-center">
                        <Sparkles className="w-16 h-16 mx-auto mb-4 text-indigo-200" />
                        <p className="font-semibold text-slate-400">Story Creating Interface...</p>
                      </div>
                    </div>

                    {/* Fake UI Elements */}
                    <div className="absolute top-4 left-4 right-4 h-8 bg-slate-100 rounded w-3/4"></div>
                    <div className="absolute top-16 left-4 right-4 bg-slate-100 rounded h-32"></div>
                    <div className="absolute bottom-4 right-4 w-24 h-8 bg-indigo-500 rounded-full"></div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-50/50 rounded-full blur-3xl"></div>
              </div>

              {/* Steps List */}
              <div className="space-y-12 order-1 lg:order-2">
                {[
                  {
                    step: 1,
                    title: "Craft your story with imagination",
                    description: "Simply write your story idea, short or detailed, it's up to you! Choose themes like Space, Jungle or Fairy Tales."
                  },
                  {
                    step: 2,
                    title: "Bring Characters to Life",
                    description: "Transform yourself and others into storybook heroes! Upload your photo to join the adventure, or let our AI design unique characters for you."
                  },
                  {
                    step: 3,
                    title: "Experience your unique story",
                    description: "Watch the magic happen! Generate your story and make simple edits to perfect it before ordering your printed copy."
                  }
                ].map((item, index) => (
                  <AnimatedStep
                    key={item.step}
                    step={item.step}
                    title={item.title}
                    description={item.description}
                    delay={index * 200} // Stagger delay
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

              {/* Text Content */}
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
                  Be the <span className="text-indigo-600 underline decoration-orange-400 decoration-wavy">Hero</span> in Your Story
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Upload a photo and become the central character! Our AI transforms you into the star of your very own adventure, ensuring you look like yourself, but in a magical new world.
                </p>
                <div className="pt-4">
                  <Link
                    href="/create"
                    className="inline-flex bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    Create your Storybook
                  </Link>
                </div>
              </div>

              {/* Visuals */}
              <div className="relative h-[500px] w-full">
                <div className="absolute top-10 left-10 w-64 h-80 bg-white p-2 rounded-2xl shadow-xl transform -rotate-6 z-10 hover:z-20 hover:scale-105 transition-all duration-300">
                  <div className="w-full h-full bg-gradient-to-b from-blue-100 to-indigo-50 rounded-xl overflow-hidden relative">
                    {/* Placeholder for Snow Scene */}
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">☃️</div>
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-2 rounded-lg text-xs font-bold text-center">Winter Wonderland</div>
                  </div>
                </div>

                <div className="absolute top-20 right-10 w-72 h-80 bg-white p-2 rounded-2xl shadow-xl transform rotate-6 z-0 hover:z-20 hover:scale-105 transition-all duration-300 border-4 border-white">
                  <div className="w-full h-full bg-gradient-to-b from-orange-100 to-red-50 rounded-xl overflow-hidden relative">
                    {/* Placeholder for Firefighter Scene */}
                    <div className="absolute inset-0 flex items-center justify-center text-6xl">👨‍🚒</div>
                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 p-2 rounded-lg text-xs font-bold text-center">Brave Firefighter</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 5. Consistent Character Feature */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Visuals: Transformation */}
              <div className="relative bg-indigo-50 rounded-3xl p-8 lg:p-12 order-2 lg:order-1 border border-indigo-100">
                <div className="flex items-center justify-center gap-4 lg:gap-8">
                  <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-2xl bg-white shadow-lg p-2 transform -rotate-2">
                    {/* Placeholder Real Photo */}
                    <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                      <span className="text-4xl">📸</span>
                    </div>
                  </div>

                  <div className="text-indigo-400">
                    <ArrowRight className="w-8 h-8 lg:w-12 lg:h-12 animate-pulse" />
                  </div>

                  <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-2xl bg-white shadow-xl p-2 transform rotate-2 border-4 border-indigo-200">
                    {/* Placeholder AI Char */}
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center overflow-hidden text-white">
                      <span className="text-4xl">🏴‍☠️</span>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-8 text-sm font-medium text-indigo-800 bg-indigo-100/50 inline-block px-4 py-2 rounded-full mx-auto w-full">
                  Same face. Consistent style. Every page.
                </div>
              </div>

              {/* Text Content */}
              <div className="order-1 lg:order-2 space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
                  Create Personalised and <br />
                  <span className="text-indigo-600">Consistent Characters</span>
                </h2>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Customise characters to fit your story, or let our AI design unique ones for you. Enjoy character consistency throughout, bringing depth and continuity to each page.
                </p>
                <div className="pt-4">
                  <Link
                    href="/create"
                    className="inline-flex bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    Get Started For Free
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 6. Footer CTA */}
        <section className="py-24 bg-slate-900 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8">Ready to tell your story?</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Join thousands of parents creating magical moments with their children. Start your free story today.
            </p>
            <Link
              href="/create"
              className="inline-flex bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-10 py-5 rounded-full font-bold text-lg hover:from-indigo-400 hover:to-indigo-500 transition-all shadow-2xl shadow-indigo-500/30 hover:scale-105"
            >
              Create Your First Storybook
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
