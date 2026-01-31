import { Skeleton, SkeletonText, SkeletonButton } from "./Skeleton";

export default function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navbar Skeleton */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-surface/95 border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <div className="hidden md:flex gap-6">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="hidden md:flex gap-4">
                        <Skeleton className="h-4 w-12" />
                        <SkeletonButton />
                    </div>
                </div>
            </div>

            {/* Hero Section Skeleton */}
            <section className="pt-24 pb-16 lg:pt-32 lg:pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
                            <Skeleton className="h-12 w-3/4 mx-auto lg:mx-0 mb-4" />
                            <Skeleton className="h-12 w-1/2 mx-auto lg:mx-0 mb-6" />
                            <SkeletonText lines={3} className="max-w-xl mx-auto lg:mx-0" />
                            <div className="mt-8 flex gap-4 justify-center lg:justify-start">
                                <SkeletonButton />
                                <SkeletonButton />
                            </div>
                        </div>
                        <div className="relative">
                            <Skeleton className="w-full max-w-lg mx-auto aspect-square rounded-3xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section Skeleton */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <Skeleton className="h-10 w-64 mx-auto mb-4" />
                        <Skeleton className="h-4 w-96 mx-auto" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-background rounded-2xl p-8 border border-border">
                                <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-6" />
                                <Skeleton className="h-6 w-40 mx-auto mb-3" />
                                <SkeletonText lines={2} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
