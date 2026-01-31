import { Suspense } from "react";
import { Navbar } from "@/app/components/layout";
import { OrderContent } from "@/app/components/order";
import { FormSkeleton } from "@/app/components/skeletons";

export default function OrderPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<FormSkeleton />}>
                <OrderContent />
            </Suspense>
        </div>
    );
}
