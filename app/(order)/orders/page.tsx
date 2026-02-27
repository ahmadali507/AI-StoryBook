import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Calendar, ArrowRight, FileDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import NavbarClient from "@/app/components/NavbarClient";
import { getAllUserOrders } from "@/actions/library";
import LibraryPDFButton from "@/app/components/library/LibraryPDFButton";
import OrderCheckoutButton from "@/app/components/order/OrderCheckoutButton";
import OrdersAutoRefresh from "@/app/components/order/OrdersAutoRefresh";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
    let orders = [];
    try {
        orders = await getAllUserOrders();
    } catch (e) {
        redirect("/auth/login");
    }

    const hasInProgressOrders = orders.some(
        (o: any) => o.status === "generating" || o.status === "paid"
    );

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case "complete":
                return {
                    label: "Completed",
                    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
                    bg: "bg-green-50 text-green-700 border-green-200"
                };
            case "generating":
            case "paid":
                return {
                    label: "Generating",
                    icon: <Clock className="w-4 h-4 text-blue-500 animate-pulse" />,
                    bg: "bg-blue-50 text-blue-700 border-blue-200"
                };
            case "failed":
                return {
                    label: "Failed",
                    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
                    bg: "bg-red-50 text-red-700 border-red-200"
                };
            default:
                // pending, draft, cover_preview
                return {
                    label: "Pending Payment",
                    icon: <Clock className="w-4 h-4 text-orange-500" />,
                    bg: "bg-orange-50 text-orange-700 border-orange-200"
                };
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarClient />
            <OrdersAutoRefresh hasInProgressOrders={hasInProgressOrders} />

            <main className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
                <div className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
                        <p className="mt-2 text-gray-500">Track and manage your magical storybook orders</p>
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
                        <h3 className="text-xl font-medium text-gray-900 mb-2">You have no orders yet</h3>
                        <p className="text-gray-500 mb-8">Start your first magical journey today!</p>
                        <Link
                            href="/create"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium"
                        >
                            Create a Story
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orders.map((order: any) => {
                            const book = order.storybooks;
                            const statusDisplay = getStatusDisplay(order.status);
                            const isPaidOrComplete = ["paid", "generating", "complete"].includes(order.status);

                            return (
                                <div
                                    key={order.id}
                                    className="flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300"
                                >
                                    <div className="flex p-5 gap-4">
                                        {/* Cover Image */}
                                        <div className="w-24 shrink-0 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden relative">
                                            {book?.cover_url ? (
                                                <img
                                                    src={book.cover_url}
                                                    alt={book.title || "Book Cover"}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                    <BookOpen className="w-8 h-8 text-gray-200" />
                                                </div>
                                            )}
                                            {order.status === "complete" && book?.id && (
                                                <div className="absolute top-1 right-1">
                                                    <LibraryPDFButton storyId={book.id} title={book.title || "Untitled Story"} className="scale-75 origin-top-right !p-1.5" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 py-1 flex flex-col">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight">
                                                    {book?.title || "Untitled Story"}
                                                </h3>
                                            </div>

                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit mb-auto ${statusDisplay.bg}`}>
                                                {statusDisplay.icon}
                                                {statusDisplay.label}
                                            </div>

                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-3 border-t border-gray-50 pt-3">
                                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                                <span className="truncate">Ordered {new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="bg-gray-50/50 p-3 border-t border-gray-100 grid grid-cols-2 gap-2 mt-auto">
                                        {order.status === "complete" ? (
                                            <Link
                                                href={`/story/${book?.id}`}
                                                className="col-span-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                Read Book
                                            </Link>
                                        ) : isPaidOrComplete ? (
                                            <Link
                                                href={`/order/${order.id}`}
                                                className="col-span-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                View Status
                                            </Link>
                                        ) : (
                                            <OrderCheckoutButton orderId={order.id} className="col-span-1" />
                                        )}

                                        {isPaidOrComplete ? (
                                            <a
                                                href={`/api/invoice/${order.id}`}
                                                download
                                                className="col-span-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                Invoice
                                            </a>
                                        ) : (
                                            <button
                                                disabled
                                                className="col-span-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-lg cursor-not-allowed"
                                                title="Available after payment"
                                            >
                                                <FileDown className="w-4 h-4" />
                                                Invoice
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
