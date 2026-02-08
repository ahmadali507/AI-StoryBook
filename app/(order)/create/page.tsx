import { Suspense } from "react";
import { Navbar } from "@/app/components/layout";
import { SimpleOrderForm } from "@/app/components/order";

export default function CreateBookPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-16">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-gray-500">Loading...</p>
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
