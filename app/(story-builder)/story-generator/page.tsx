import { Suspense } from "react";
import { Navbar } from "@/app/components/layout";
import { StoryGeneratorContent } from "@/app/components/story";
import { FormSkeleton } from "@/app/components/skeletons";
import { getCharacters } from "@/actions/character";

export default async function StoryGeneratorPage() {
    const characters = await getCharacters();

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<FormSkeleton />}>
                <StoryGeneratorContent characters={characters} />
            </Suspense>
        </div>
    );
}
