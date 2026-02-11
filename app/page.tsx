import Link from "next/link";
import Image from "next/image";
import { Navbar, Footer } from "@/app/components/layout";
import { Wand2, ArrowRight, Star, Sparkles, CheckCircle2 } from "lucide-react";
import AnimatedStep from "@/app/components/home/AnimatedStep";
import HeroCarousel from "@/app/components/home/HeroCarousel";
import ScrollReveal from "@/components/ui/ScrollReveal";
import CharacterCarousel from "@/components/home/CharacterCarousel";

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

                <h1 className="text-3xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
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
        <section className="py-24 bg-indigo-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-bold text-indigo-600 mb-6">Start Creating</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Turn your child's imagination into a beautifully illustrated book in just three magical steps.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Visual: Laptop Mockup */}
              <div className="relative order-2 lg:order-1 perspective-1000">
                {/* Background Glows - Refined for warmth and theme */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-200/30 rounded-full blur-[80px] -z-10 animate-pulse-glow"></div>
                <div className="absolute -top-10 -right-10 w-72 h-72 bg-pink-200/40 rounded-full blur-[60px] -z-10 animate-float" style={{ animationDelay: '1s' }}></div>
                <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-amber-200/30 rounded-full blur-[60px] -z-10 animate-float" style={{ animationDelay: '2s' }}></div>

                {/* Floating Card Container */}
                <div className="relative transform transition-transform duration-500 hover:scale-[1.02] animate-float">
                  <div className="relative bg-gradient-to-br from-white via-white to-purple-50/50 backdrop-blur-sm rounded-[2.5rem] p-6 shadow-[0_20px_50px_-12px_rgba(124,58,237,0.2)] ring-1 ring-white/60 border border-white/40">

                    {/* Glass Reflection Highlight */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-transparent rounded-[2.5rem] pointer-events-none z-20"></div>

                    {/* Image Content */}
                    <div className="bg-white rounded-[2rem] overflow-hidden aspect-[16/10] relative shadow-sm ring-1 ring-slate-100">
                      <Image
                        src="/images/home/creation-ui-preview.png"
                        alt="Story Creation Interface"
                        fill
                        className="object-cover"
                      />

                      {/* Subtle Overlay Gradient for Depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-900/5 to-transparent opacity-40"></div>
                    </div>

                    {/* Floating Elements / Decorators - Styled as Badges */}
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

              {/* Text Content */}
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold text-slate-900">
                  Be the <span className="text-indigo-600">Hero</span> in Your Story
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
                <ScrollReveal
                  className="absolute top-0 left-4 lg:left-0 z-10 hover:z-30 transition-all duration-300"
                  delay={0}
                  duration={700}
                >
                  <div className="w-64 h-80 bg-white p-2 rounded-2xl shadow-xl transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300">
                    <div className="w-full h-full relative rounded-xl overflow-hidden">
                      <Image
                        src="/images/hero-section/hero_snow_pixar.png"
                        alt="Winter Wonderland Storybook"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-xs font-bold text-center">Winter Wonderland</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal
                  className="absolute top-12 right-4 lg:right-0 z-0 hover:z-30 transition-all duration-300"
                  delay={200}
                  duration={700}
                >
                  <div className="w-64 h-80 bg-white p-2 rounded-2xl shadow-xl transform rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-300">
                    <div className="w-full h-full relative rounded-xl overflow-hidden">

                      <Image
                        src="/images/hero-section/hero_firefighter_pixar.png"
                        alt="Brave Firefighter Storybook"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-xs font-bold text-center">Brave Firefighter</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hover:z-30 transition-all duration-300"
                  delay={400}
                  duration={700}
                >
                  <div className="w-72 h-64 bg-white p-2 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                    <div className="w-full h-full relative rounded-xl overflow-hidden">
                      <Image
                        src="/images/hero-section/hero_space_pixar.png"
                        alt="Space Adventure Storybook"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-xs font-bold text-center">Space Explorer</p>
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

              {/* Visuals: Transformation */}
              <div className="order-2 lg:order-1 w-full">
                <CharacterCarousel />
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

        {/* 6. High-Quality Printed Storybooks */}
        <section className="py-24 bg-indigo-50/30 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              {/* Text Content */}
              <div className="space-y-8 order-2 lg:order-1">
                <ScrollReveal
                  className="relative"
                  delay={200}
                  direction="left"
                >

                  <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                    High-Quality <br />
                    <span className="relative inline-block text-indigo-600">
                      Printed Storybooks
                      <svg className="absolute w-full h-3 -bottom-1 left-0 text-orange-400 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                    </span>
                  </h2>
                </ScrollReveal>


                <ScrollReveal
                  className="relative"
                  delay={200}
                  direction="left"
                >
                  <p className="text-xl text-slate-600 leading-relaxed">
                    Order a premium printed version of your story to create a memorable keepsake or thoughtful gift.
                  </p>
                </ScrollReveal>
                <ul className="space-y-4">
                  {[
                    "Create a one-of-a-kind hardcover storybook your child will treasure forever.",
                    "24-28 pages filled with stunning illustrations that bring their story to life.",
                    "A perfect blend of pictures and text, crafted to captivate young imaginations.",
                    "Delivered globally, with flexible shipping options to suit your needs.",
                    "The perfect gift to make your child's dreams come true and keep them close to your heart."
                  ].map((item, index) => (
                    <ScrollReveal
                      key={index}
                      className="relative"
                      delay={400}
                      direction="left"
                    >
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item}</span>
                      </li>
                    </ScrollReveal>
                  ))}
                </ul>

                <div className="pt-4">
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-violet-200 hover:-translate-y-1 transform duration-200"
                  >
                    <Wand2 className="w-5 h-5" />
                    Create your Storybook
                  </Link>
                </div>
              </div>

              {/* Visuals */}
              <div className="order-1 lg:order-2">
                <ScrollReveal
                  className="relative"
                  delay={200}
                >
                  <div className="relative z-10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="bg-white p-4 rounded-3xl shadow-2xl border-4 border-white/50">
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100">
                        {/* Fallback or Placeholder until generation succeeds */}
                        <Image
                          src="/images/home/printed-book-showcase.jpg"
                          alt="Printed Storybook Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"></div>
                  <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 -z-10 animate-pulse delay-700"></div>
                </ScrollReveal>
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
