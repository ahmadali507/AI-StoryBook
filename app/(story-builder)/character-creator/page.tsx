import { Suspense } from "react";
import { Navbar } from "@/app/components/layout";
import { CharacterCreatorContent } from "@/app/components/character";
import { FormSkeleton } from "@/app/components/skeletons";

export default function CharacterCreatorPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<FormSkeleton />}>
                <CharacterCreatorContent />
            </Suspense>
        </div>
    );
}
