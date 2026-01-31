import { Skeleton, SkeletonText, SkeletonButton } from "./Skeleton";

export default function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Section */}
                <div className="mb-10">
                    <Skeleton className="h-10 w-80 mb-2" />
                    <Skeleton className="h-5 w-64" />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-surface border border-border rounded-2xl p-5">
                            <div className="flex items-center gap-4">
                                <Skeleton className="w-12 h-12 rounded-xl" />
                                <div>
                                    <Skeleton className="h-8 w-12 mb-1" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Quick Actions */}
                    <div className="lg:col-span-2">
                        <Skeleton className="h-6 w-32 mb-6" />
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-surface border border-border rounded-2xl p-6">
                                    <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                                    <Skeleton className="h-6 w-32 mb-2" />
                                    <Skeleton className="h-4 w-40" />
                                </div>
                            ))}
                        </div>

                        {/* CTA Card */}
                        <div className="mt-6 rounded-2xl p-8 bg-border/50">
                            <Skeleton className="h-8 w-64 mb-2" />
                            <Skeleton className="h-4 w-80 mb-4" />
                            <SkeletonButton />
                        </div>
                    </div>

                    {/* Recent Stories */}
                    <div className="lg:col-span-1">
                        <div className="flex justify-between mb-6">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="bg-surface border border-border rounded-2xl divide-y divide-border">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4">
                                    <Skeleton className="w-12 h-12 rounded-xl" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-40 mb-1" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
