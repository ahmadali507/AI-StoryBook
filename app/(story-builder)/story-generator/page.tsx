import { Suspense } from "react";
import { Navbar } from "@/app/components/layout";
import { StoryGeneratorContent } from "@/app/components/story";
import { FormSkeleton } from "@/app/components/skeletons";

export default function StoryGeneratorPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<FormSkeleton />}>
                <StoryGeneratorContent />
            </Suspense>
        </div>
    );
}
