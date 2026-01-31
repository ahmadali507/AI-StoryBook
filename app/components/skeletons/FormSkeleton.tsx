import { Skeleton, SkeletonText, SkeletonButton } from "./Skeleton";

export default function FormSkeleton() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-4 w-24 hidden sm:block" />
                            {i < 3 && <Skeleton className="w-12 sm:w-24 h-0.5 mx-4" />}
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left Panel - Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <Skeleton className="h-7 w-40 mb-6" />

                            {/* Form fields */}
                            <div className="space-y-6">
                                <div>
                                    <Skeleton className="h-4 w-12 mb-2" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                                <div>
                                    <Skeleton className="h-4 w-24 mb-4" />
                                    <div className="space-y-4">
                                        {[1, 2, 3].map((i) => (
                                            <Skeleton key={i} className="h-12 w-full rounded-xl" />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <Skeleton className="h-4 w-32 mb-3" />
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5, 6].map((i) => (
                                            <Skeleton key={i} className="h-9 w-20 rounded-full" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="lg:col-span-3">
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <Skeleton className="h-7 w-40 mb-6" />
                            <Skeleton className="aspect-square max-w-md mx-auto rounded-2xl mb-6" />
                            <div className="flex justify-center gap-4 mb-8">
                                <Skeleton className="h-10 w-28 rounded-lg" />
                                <Skeleton className="h-10 w-20 rounded-lg" />
                            </div>
                            <SkeletonText lines={2} className="max-w-md mx-auto" />
                        </div>

                        <div className="flex justify-end gap-4 mt-6">
                            <Skeleton className="h-4 w-16" />
                            <SkeletonButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
