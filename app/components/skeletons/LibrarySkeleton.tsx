import { Skeleton, SkeletonText, SkeletonButton } from "./Skeleton";

export default function LibrarySkeleton() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <Skeleton className="h-9 w-32" />
                    </div>
                    <SkeletonButton />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <Skeleton className="h-12 w-full max-w-md rounded-xl" />
                    <Skeleton className="h-12 w-40 rounded-xl" />
                </div>

                {/* Books Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-surface border border-border rounded-2xl overflow-hidden">
                            <Skeleton className="h-48" />
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <Skeleton className="h-6 w-40" />
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </div>
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
