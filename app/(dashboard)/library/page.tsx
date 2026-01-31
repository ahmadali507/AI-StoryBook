import { Suspense } from "react";
import { Navbar, Footer } from "@/app/components/layout";
import { LibraryContent } from "@/app/components/library";
import { LibrarySkeleton } from "@/app/components/skeletons";

export default function LibraryPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<LibrarySkeleton />}>
                <main className="pt-24 pb-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <LibraryContent />
                    </div>
                </main>
            </Suspense>
            <Footer />
        </div>
    );
}
