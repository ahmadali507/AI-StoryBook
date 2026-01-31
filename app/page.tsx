import { Suspense } from "react";
import { Navbar, Footer } from "@/app/components/layout";
import { HeroSection, FeaturesSection, TrustedBySection, CTASection } from "@/app/components/home";
import { HomeSkeleton } from "@/app/components/skeletons";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Suspense fallback={<HomeSkeleton />}>
        <HeroSection />
        <FeaturesSection />
        <TrustedBySection />
        <CTASection />
      </Suspense>
      <Footer />
    </div>
  );
}
