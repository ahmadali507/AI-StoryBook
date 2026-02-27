"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { getBookForReader } from "@/actions/library";
import { StoryPDF } from "@/app/components/story/PDFExport";

export default function LibraryPDFButton({
    storyId,
    title,
    className
}: {
    storyId: string;
    title: string;
    className?: string;
}) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading) return;
        setLoading(true);

        try {
            // 1. Fetch full story content
            const story = await getBookForReader(storyId);

            if (!story) {
                alert("Failed to load story details for PDF generation.");
                setLoading(false);
                return;
            }

            // 2. Generate PDF blob
            const blob = await pdf(<StoryPDF story={story} />).toBlob();

            // 3. Trigger download
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${title.replace(/\s+/g, "_")}_Storybook.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("PDF generation failed:", error);
            alert("An error occurred while generating the PDF.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className={`inline-flex items-center justify-center p-2.5 rounded-full bg-white text-slate-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed ${className || ""}`}
            title="Download PDF"
            aria-label="Download PDF"
        >
            {loading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
                <FileDown className="w-5 h-5 text-primary" />
            )}
        </button>
    );
}
