import { Suspense } from "react";
import { Navbar } from "@/app/components/layout";
import { SimpleOrderForm } from "@/app/components/order";

export default function CreateBookPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
            {/* Background elements for depth */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-200/30 blur-3xl"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-pink-200/30 blur-3xl"></div>
            </div>

            <Navbar />
            <main className="pt-24 pb-12 relative z-10">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading magic...</p>
                            </div>
                        </div>
                    }
                >
                    <SimpleOrderForm />
                </Suspense>
            </main>
        </div>
    );
}

export const metadata = {
    title: "Create Your Personalized Storybook | AI Storybook",
    description:
        "Create a magical personalized storybook featuring your child, family, and pets. Upload photos, choose a theme, and we'll generate a beautiful illustrated book.",
};
