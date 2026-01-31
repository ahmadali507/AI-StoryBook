import { Skeleton, SkeletonText, SkeletonButton } from "./Skeleton";

export default function AuthSkeleton() {
    return (
        <div className="min-h-screen flex">
            {/* Left Panel */}
            <div className="hidden lg:flex lg:w-[45%] bg-border/30">
                <div className="flex flex-col items-center justify-center w-full p-12">
                    <Skeleton className="h-10 w-64 mb-4" />
                    <Skeleton className="h-5 w-80 mb-10" />
                    <Skeleton className="w-72 h-72 rounded-full" />
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-surface">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center justify-center gap-2 mb-10">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <Skeleton className="h-7 w-28" />
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-8">
                        <Skeleton className="h-9 w-32 mx-auto mb-2" />
                        <Skeleton className="h-5 w-64 mx-auto" />
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5">
                        <div>
                            <Skeleton className="h-4 w-16 mb-2" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-20 mb-2" />
                            <Skeleton className="h-14 w-full rounded-xl" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-full" />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <Skeleton className="flex-1 h-px" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="flex-1 h-px" />
                    </div>

                    {/* Social */}
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-12 rounded-xl" />
                        <Skeleton className="h-12 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
