import { Skeleton, SkeletonText } from "./Skeleton";

export default function CardSkeleton({ className = "" }: { className?: string }) {
    return (
        <div className={`bg-surface border border-border rounded-2xl p-6 ${className}`}>
            <Skeleton className="h-48 mb-4 rounded-xl" />
            <SkeletonText lines={2} />
        </div>
    );
}
