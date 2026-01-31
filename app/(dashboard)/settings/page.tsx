import { Suspense } from "react";
import { Navbar, Footer } from "@/app/components/layout";
import { SettingsContent } from "@/app/components/settings";
import { FormSkeleton } from "@/app/components/skeletons";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <Suspense fallback={<FormSkeleton />}>
                <SettingsContent />
            </Suspense>
            <Footer />
        </div>
    );
}
