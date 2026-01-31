import { Suspense } from "react";
import { Navbar, Footer } from "@/app/components/layout";
import { StatsGrid, QuickActions, RecentStories, ProTipCard } from "@/app/components/dashboard";
import { DashboardSkeleton } from "@/app/components/skeletons";

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<DashboardSkeleton />}>
                <main className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Welcome Section */}
                        <div className="mb-10">
                            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
                                Welcome back, Creator! ✨
                            </h1>
                            <p className="text-text-muted">
                                Ready to craft another magical adventure?
                            </p>
                        </div>

                        {/* Stats */}
                        <StatsGrid />

                        {/* Main Content */}
                        <div className="grid lg:grid-cols-3 gap-8">
                            {/* Left Column */}
                            <div className="lg:col-span-2">
                                <QuickActions />
                                <ProTipCard />
                            </div>

                            {/* Right Column */}
                            <div className="lg:col-span-1">
                                <RecentStories />
                            </div>
                        </div>
                    </div>
                </main>
            </Suspense>
            <Footer />
        </div>
    );
}
