import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import NavbarClient from "@/app/components/NavbarClient";
import { getUserOrders } from "@/actions/library";
import LibraryPDFButton from "@/app/components/library/LibraryPDFButton";

export default async function LibraryPage() {
    let orders = [];
    try {
        orders = await getUserOrders();
    } catch (e) {
        // Redirect if not authenticated
        redirect("/auth/login");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarClient />

            <main className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Library</h1>
                        <p className="mt-2 text-gray-500">Your collection of magical generated stories</p>
                    </div>
                    <Link
                        href="/create"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium"
                    >
                        <BookOpen className="w-5 h-5" />
                        Create New Book
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Your library is empty</h3>
                        <p className="text-gray-500 mb-8">Create your first magical storybook today!</p>
                        <Link
                            href="/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium"
                        >
                            Create a Story
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {orders.map((order: any) => {
                            const book = order.storybooks;
                            const isReady = order.status === 'complete';

                            return (
                                <Link
                                    key={order.id}
                                    href={isReady ? `/story/${book?.id}` : `/order/${order.id}/success`}
                                    className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    {/* Cover Image */}
                                    <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                                        {book?.cover_url ? (
                                            <img
                                                src={book.cover_url}
                                                alt={book.title || "Book Cover"}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                <BookOpen className="w-12 h-12 text-gray-200" />
                                            </div>
                                        )}

                                        {isReady && book?.id && (
                                            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <LibraryPDFButton storyId={book.id} title={book.title || "Untitled Story"} />
                                            </div>
                                        )}

                                        {!isReady && (
                                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                                <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-primary">
                                                    In Progress
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                            {book?.title || "Untitled Story"}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1 text-primary font-medium">
                                                Read Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
