import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BookEditor from "@/app/components/story/BookEditor";
import { getBookForReader } from "@/actions/library";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StoryEditPage({ params }: PageProps) {
    const { id: storyId } = await params;

    const story = await getBookForReader(storyId);

    if (!story) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h2>
                    <p className="text-gray-500 mb-6">We couldn&apos;t find the story you&apos;re looking for.</p>
                    <Link
                        href="/library"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Library
                    </Link>
                </div>
            </div>
        );
    }

    return <BookEditor story={story} />;
}
