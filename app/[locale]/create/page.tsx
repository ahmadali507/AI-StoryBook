import { Suspense } from "react";
import Navbar from "@/app/components/Navbar";
import { SimpleOrderForm } from "@/app/components/order";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export default async function CreateBookPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    setRequestLocale(locale);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-200/30 blur-3xl"></div>
                <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-pink-200/30 blur-3xl"></div>
            </div>

            <Navbar />
            <main className="pt-24 pb-12 relative z-10">
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center min-h-[60vh]">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-gray-500 font-medium">Loading...</p>
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
