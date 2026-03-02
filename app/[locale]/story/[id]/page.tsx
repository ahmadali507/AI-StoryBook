import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BookReader from "@/app/components/story/BookReader";
import { getBookForReader } from "@/actions/library";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

interface PageProps {
    params: Promise<{ id: string; locale: string }>;
}

export default async function StoryReaderPage({ params }: PageProps) {
    const { id: storyId, locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations("reader");

    const story = await getBookForReader(storyId);

    if (!story) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Story Not Found</h2>
                    <p className="text-gray-500 mb-6">We couldn't find the story you're looking for.</p>
                    <Link
                        href={`/${locale}/library`}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Library
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-200">
            <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none p-6">
                <Link
                    href={`/${locale}/library`}
                    className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur shadow-sm rounded-full text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Library
                </Link>
            </div>

            <BookReader story={story} />
        </div>
    );
}
