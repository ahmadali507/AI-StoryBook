"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { getOrder } from "@/actions/order";
import NavbarClient from "@/app/components/NavbarClient";
import BookGenerationSimulator from "@/app/components/order/BookGenerationSimulator";

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [generationComplete, setGenerationComplete] = useState(false);

    useEffect(() => {
        async function loadOrder() {
            try {
                const orderData = await getOrder(orderId);
                setOrder(orderData);
            } catch (err) {
                console.error("Error loading order:", err);
            } finally {
                setLoading(false);
            }
        }
        loadOrder();
    }, [orderId]);

    const handleGenerationComplete = () => {
        setGenerationComplete(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <NavbarClient />
                <div className="flex items-center justify-center min-h-[80vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5">
            <NavbarClient />
            <main className="pt-20 pb-16">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Back button */}
                    <button
                        onClick={() => router.push("/create")}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Create Another Book
                    </button>

                    {/* Order ID Badge */}
                    <div className="text-center mb-8">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm text-gray-600 shadow-sm">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Order #{orderId.slice(0, 8)}
                        </span>
                    </div>

                    {/* Book Generation Simulator */}
                    <BookGenerationSimulator
                        orderId={orderId}
                        onComplete={handleGenerationComplete}
                        bookTitle={order?.storybooks?.title || "Your Magical Story"}
                        coverUrl={order?.storybooks?.cover_url}
                    />

                    {/* Additional Actions (after complete) */}
                    {generationComplete && (
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
                            <Link
                                href={`/order/${orderId}`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-primary hover:text-primary transition-colors"
                            >
                                View Order Details
                            </Link>
                            <Link
                                href="/create"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-xl font-semibold hover:bg-primary/20 transition-colors"
                            >
                                Create Another Book
                            </Link>
                        </div>
                    )}

                    {/* Confetti effect placeholder */}
                    {generationComplete && (
                        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                            <div className="absolute top-0 left-1/4 text-4xl animate-confetti-1">🎉</div>
                            <div className="absolute top-0 left-1/2 text-4xl animate-confetti-2">✨</div>
                            <div className="absolute top-0 right-1/4 text-4xl animate-confetti-3">🎊</div>
                            <div className="absolute top-0 left-1/3 text-4xl animate-confetti-4">⭐</div>
                            <div className="absolute top-0 right-1/3 text-4xl animate-confetti-5">🌟</div>
                        </div>
                    )}
                </div>
            </main>

            {/* Custom animations */}
            <style jsx>{`
                @keyframes confetti-1 {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes confetti-2 {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(-720deg); opacity: 0; }
                }
                @keyframes confetti-3 {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(540deg); opacity: 0; }
                }
                @keyframes confetti-4 {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(-540deg); opacity: 0; }
                }
                @keyframes confetti-5 {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .animate-confetti-1 { animation: confetti-1 3s ease-out forwards; animation-delay: 0s; }
                .animate-confetti-2 { animation: confetti-2 3.5s ease-out forwards; animation-delay: 0.2s; }
                .animate-confetti-3 { animation: confetti-3 2.8s ease-out forwards; animation-delay: 0.4s; }
                .animate-confetti-4 { animation: confetti-4 3.2s ease-out forwards; animation-delay: 0.1s; }
                .animate-confetti-5 { animation: confetti-5 3s ease-out forwards; animation-delay: 0.3s; }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
