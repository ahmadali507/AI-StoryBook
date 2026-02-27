"use client";

import React, { forwardRef, useCallback, useRef, useState, useEffect, useTransition } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, FileDown, Loader2, Pencil, Check, X, RefreshCw, Sparkles } from "lucide-react";
import type { BookPage, PageBasedStory } from "@/actions/library";
import { updateBookPageText, regenerateSceneIllustration } from "@/actions/book-edit";
import { pdf } from "@react-pdf/renderer";
import { StoryPDF } from "./PDFExport";

interface BookReaderProps {
    story: PageBasedStory;
    onPageChange?: (page: number) => void;
}

// Base Page Component with consistent styling
const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <div
            className="page-content h-full bg-white shadow-sm border-l border-slate-100 relative overflow-hidden"
            ref={ref}
        >
            <div className="h-full flex flex-col p-8 md:p-12">
                {/* Header Line */}
                <div className="w-full h-1 bg-gradient-to-r from-sky-500/20 to-transparent mb-8"></div>

                {/* Main content area */}
                <div className="flex-1 flex flex-col font-sans text-slate-700 overflow-hidden">
                    {props.children}
                </div>

                {/* Footer / Page number */}
                <div className="mt-6 flex justify-between items-end border-t border-slate-100 pt-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-sans font-semibold">
                        {props.runningHeader || "Storybook"}
                    </span>
                    <span className="text-sm text-slate-400 font-sans font-medium">
                        {props.number}
                    </span>
                </div>
            </div>

            {/* Spine Shadow */}
            <div className={`absolute top-0 bottom-0 w-6 pointer-events-none ${props.number % 2 === 0 ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} from-black/[0.04] to-transparent`} />
        </div>
    );
});
Page.displayName = "Page";

// Text Page Component with inline editing
const TextPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(props.content || "");
    const [isSaving, startSaving] = useTransition();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync editText when content changes from external source
    useEffect(() => {
        if (!isEditing) {
            setEditText(props.content || "");
        }
    }, [props.content, isEditing]);

    const handleStartEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(true);
        setEditText(props.content || "");
        // Focus textarea after render
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsEditing(false);
        setEditText(props.content || "");
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!props.storybookId || !props.pageNumber) return;

        startSaving(async () => {
            const result = await updateBookPageText(
                props.storybookId,
                props.pageNumber,
                editText
            );

            if (result.success) {
                setIsEditing(false);
                // Notify parent to update the story data
                if (props.onTextSaved) {
                    props.onTextSaved(props.pageNumber, editText);
                }
            } else {
                alert(result.error || "Failed to save. Please try again.");
            }
        });
    };

    return (
        <Page {...props} ref={ref}>
            {isEditing ? (
                /* Edit Mode */
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <textarea
                        ref={textareaRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex-1 w-full resize-none border border-sky-300 rounded-lg p-4 text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 bg-sky-50/30"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
                        placeholder="Type your story text here..."
                    />
                    <div className="flex justify-end gap-2 mt-3">
                        <button
                            onClick={handleCancel}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                        >
                            <X className="w-3 h-3" />
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            onMouseDown={(e) => e.stopPropagation()}
                            disabled={isSaving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Check className="w-3 h-3" />
                            )}
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            ) : (
                /* Read Mode */
                <div className="flex-1 flex flex-col justify-center text-justify text-sm leading-relaxed text-slate-700 overflow-hidden relative group" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    {(props.content || "").split('\n\n').map((paragraph: string, pIndex: number) => (
                        <p key={pIndex} className="mb-4 last:mb-0">
                            {paragraph}
                        </p>
                    ))}

                    {/* Edit button overlay - appears on hover */}
                    <button
                        onClick={handleStartEdit}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute top-0 right-0 p-2 rounded-full bg-white/90 shadow-md border border-slate-200 text-slate-500 hover:text-sky-600 hover:border-sky-300 hover:shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                        title="Edit text"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                </div>
            )}
        </Page>
    );
});
TextPage.displayName = "TextPage";

// Illustration Page Component with regeneration button
const IllustrationPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    const [isRegenerating, startRegenerating] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);
    const [currentUrl, setCurrentUrl] = useState(props.illustrationUrl);

    // Sync URL when prop changes
    useEffect(() => {
        setCurrentUrl(props.illustrationUrl);
    }, [props.illustrationUrl]);

    const handleRegenerate = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowConfirm(true);
    };

    const handleConfirmRegenerate = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowConfirm(false);

        if (!props.storybookId || !props.pageNumber) return;

        startRegenerating(async () => {
            const result = await regenerateSceneIllustration(
                props.storybookId,
                props.pageNumber
            );

            if (result.success && result.newImageUrl) {
                setCurrentUrl(result.newImageUrl);
                if (props.onImageRegenerated) {
                    props.onImageRegenerated(props.pageNumber, result.newImageUrl, result.remainingCredits ?? 0);
                }
            } else {
                alert(result.error || "Image regeneration failed. Please try again.");
            }
        });
    };

    const handleCancelConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setShowConfirm(false);
    };

    const canRegenerate = (props.credits ?? 0) > 0 && props.hasPromptData;

    return (
        <div
            className="page-content h-full bg-white shadow-sm border-l border-slate-100 relative overflow-hidden group"
            ref={ref}
        >
            {currentUrl ? (
                <>
                    <img
                        src={currentUrl}
                        alt={props.alt || "Illustration"}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${isRegenerating ? 'opacity-30' : 'opacity-100'}`}
                    />

                    {/* Regenerating spinner overlay */}
                    {isRegenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-20">
                            <div className="flex flex-col items-center gap-3 p-6 bg-white/90 rounded-2xl shadow-lg border border-sky-100">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                                <p className="text-sm font-medium text-slate-700">Regenerating illustration...</p>
                                <p className="text-xs text-slate-400">This may take a minute</p>
                            </div>
                        </div>
                    )}

                    {/* Confirmation modal overlay */}
                    {showConfirm && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                            <div
                                className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-xs border border-slate-200"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-semibold text-slate-900 text-sm">Regenerate Image?</h3>
                                </div>
                                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                                    This will use <strong>1 credit</strong> to generate a new illustration for this scene.
                                    You have <strong>{props.credits ?? 0} credit{(props.credits ?? 0) !== 1 ? 's' : ''}</strong> remaining.
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancelConfirm}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmRegenerate}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors"
                                    >
                                        Regenerate
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Regenerate button - appears on hover */}
                    {canRegenerate && !isRegenerating && !showConfirm && (
                        <button
                            onClick={handleRegenerate}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 shadow-md border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 hover:shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 text-xs font-medium"
                            title="Regenerate illustration (1 credit)"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Regenerate
                        </button>
                    )}
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-300 bg-slate-50">
                    <span className="text-xs uppercase tracking-widest">No Illustration</span>
                </div>
            )}

            {/* Spine Shadow */}
            <div className={`absolute top-0 bottom-0 w-6 pointer-events-none ${props.number % 2 === 0 ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} from-black/[0.04] to-transparent`} />
        </div>
    );
});
IllustrationPage.displayName = "IllustrationPage";

// Title Page Component
const TitlePage = forwardRef<HTMLDivElement, any>((props, ref) => {
    const [title] = (props.text || "").split('\n\n');

    return (
        <Page {...props} ref={ref}>
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="w-16 h-1 bg-sky-500 mb-8"></div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                    {title}
                </h1>
                <div className="w-16 h-1 bg-sky-500 mt-8"></div>
            </div>
        </Page>
    );
});
TitlePage.displayName = "TitlePage";

// Dedication Page Component (spacer that aligns scene spreads)
const DedicationPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <Page {...props} ref={ref}>
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
                {props.dedication && (
                    <p className="font-serif text-lg text-slate-600 italic max-w-md leading-relaxed">
                        {props.dedication}
                    </p>
                )}
            </div>
        </Page>
    );
});
DedicationPage.displayName = "DedicationPage";

// Cover Component
const Cover = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <div
            className="page-content h-full bg-sky-900 text-white shadow-2xl relative overflow-hidden"
            ref={ref}
            data-density="hard"
        >
            {props.coverUrl ? (
                <div className="absolute inset-0 z-0">
                    <img
                        src={props.coverUrl}
                        alt="Book Cover"
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div className="h-full flex flex-col justify-center px-12 py-16 relative z-10">
                    <div className="w-16 h-2 bg-sky-400 mb-8"></div>

                    <h1 className="font-sans text-5xl font-bold mb-6 leading-tight tracking-tight drop-shadow-lg">
                        {props.title}
                    </h1>

                    <div className="w-full h-px bg-white/20 my-8"></div>

                    {props.author && (
                        <p className="font-sans text-xl text-sky-100 font-light drop-shadow-md">
                            {props.author}
                        </p>
                    )}

                    <div className="mt-auto">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-sky-400 font-bold drop-shadow-sm">
                            Personalized Edition
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});
Cover.displayName = "Cover";

// End Page Component
const EndPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <Page {...props} ref={ref}>
            <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-1 bg-sky-500 mb-8"></div>
                <h2 className="font-serif text-4xl font-bold text-slate-900 mb-4">
                    The End
                </h2>
                <p className="text-slate-500 text-sm">Thank you for reading!</p>
            </div>
        </Page>
    );
});
EndPage.displayName = "EndPage";

// Back Cover Component  
const BackCover = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <div
            className="page-content h-full bg-sky-900 text-white shadow-2xl relative overflow-hidden"
            ref={ref}
            data-density="hard"
        >
            <div className="h-full flex flex-col items-center justify-center px-12 text-center">
                {props.text ? (
                    <>
                        <div className="w-12 h-1 bg-sky-400 mb-8"></div>
                        <p className="font-sans text-lg text-sky-100 leading-relaxed max-w-md mb-8">
                            {props.text}
                        </p>
                    </>
                ) : null}
                <div className="mt-auto mb-8">
                    <p className="font-sans text-sky-200 text-sm opacity-75">
                        Created with AI Storybook
                    </p>
                </div>
            </div>
        </div>
    );
});
BackCover.displayName = "BackCover";

export default function BookReader({ story, onPageChange }: BookReaderProps) {
    const book = useRef<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Mutable story data for live edits (text + image updates)
    const [livePages, setLivePages] = useState<BookPage[]>(story.pages);
    const [credits, setCredits] = useState<number>(story.regenerationCredits ?? 10);

    // Sync when story prop changes
    useEffect(() => {
        setLivePages(story.pages);
        setCredits(story.regenerationCredits ?? 10);
    }, [story]);

    const handleTextSaved = useCallback((pageNumber: number, newText: string) => {
        setLivePages(prev =>
            prev.map(p => p.pageNumber === pageNumber ? { ...p, text: newText } : p)
        );
    }, []);

    const handleImageRegenerated = useCallback((pageNumber: number, newImageUrl: string, remainingCredits: number) => {
        setLivePages(prev =>
            prev.map(p => p.pageNumber === pageNumber ? { ...p, illustrationUrl: newImageUrl } : p)
        );
        setCredits(remainingCredits);
    }, []);

    const handleExportPDF = async () => {
        if (isExporting) return;
        setIsExporting(true);

        try {
            // Build an updated story object for PDF with live edits
            const updatedStory: PageBasedStory = {
                ...story,
                pages: livePages
            };
            const blob = await pdf(<StoryPDF story={updatedStory} />).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${story.title.replace(/\s+/g, '_')}_Storybook.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('[PDF] Generation error:', error);
            alert('PDF generation failed. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const onFlip = useCallback((e: any) => {
        setCurrentPage(e.data);
        if (onPageChange) onPageChange(e.data);
    }, [onPageChange]);

    // Generate all pages for the book from page-based structure
    const generatePages = useCallback(() => {
        const renderedPages: React.ReactElement[] = [];
        let displayPageNumber = 1;

        // Render each page based on its type
        livePages.forEach((page, index) => {
            switch (page.type) {
                case 'cover':
                    renderedPages.push(
                        <Cover
                            key={`page-${index}`}
                            title={story.title}
                            author={story.author}
                            coverUrl={page.illustrationUrl || story.coverImageUrl}
                        />
                    );
                    break;

                case 'title': {
                    const [, dedication] = (page.text || "").split('\n\n');
                    renderedPages.push(
                        <TitlePage
                            key={`page-${index}`}
                            number={displayPageNumber++}
                            runningHeader={story.title}
                            text={page.text}
                        />
                    );
                    // Add dedication page as spacer to align scene pairs into proper spreads
                    renderedPages.push(
                        <DedicationPage
                            key={`page-${index}-dedication`}
                            number={displayPageNumber++}
                            runningHeader={story.title}
                            dedication={dedication || ''}
                        />
                    );
                    break;
                }

                case 'story':
                    if (page.illustrationUrl) {
                        // Illustration page
                        renderedPages.push(
                            <IllustrationPage
                                key={`page-${index}`}
                                number={displayPageNumber++}
                                runningHeader={story.title}
                                illustrationUrl={page.illustrationUrl}
                                alt={`Scene ${page.sceneNumber} illustration`}
                                storybookId={story.storybookId}
                                pageNumber={page.pageNumber}
                                credits={credits}
                                hasPromptData={!!page.illustrationPrompt}
                                onImageRegenerated={handleImageRegenerated}
                            />
                        );
                    } else if (page.text) {
                        // Text page
                        renderedPages.push(
                            <TextPage
                                key={`page-${index}`}
                                number={displayPageNumber++}
                                runningHeader={story.title}
                                content={page.text}
                                storybookId={story.storybookId}
                                pageNumber={page.pageNumber}
                                onTextSaved={handleTextSaved}
                            />
                        );
                    }
                    break;

                case 'end':
                    renderedPages.push(
                        <EndPage
                            key={`page-${index}`}
                            number={displayPageNumber++}
                            runningHeader={story.title}
                        />
                    );
                    break;

                case 'back':
                    renderedPages.push(
                        <BackCover
                            key={`page-${index}`}
                            text={page.text}
                        />
                    );
                    break;
            }
        });

        return renderedPages;
    }, [livePages, credits, story, handleTextSaved, handleImageRegenerated]);

    // Memoize generated pages
    const [generatedPages, setGeneratedPages] = useState<React.ReactElement[]>([]);

    useEffect(() => {
        const pages = generatePages();
        setGeneratedPages(pages);
        setTotalPages(pages.length);
    }, [generatePages]);

    const nextFlip = () => {
        book.current?.pageFlip()?.flipNext();
    };

    const prevFlip = () => {
        book.current?.pageFlip()?.flipPrev();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full min-h-screen py-12 bg-slate-200">
            {/* Book Container */}
            <div className="relative mb-8">
                <HTMLFlipBook
                    style={{}}
                    width={550}
                    height={733}
                    size="stretch"
                    minWidth={550}
                    maxWidth={550}
                    minHeight={733}
                    maxHeight={733}
                    maxShadowOpacity={0.4}
                    showCover={true}
                    mobileScrollSupport={true}
                    onFlip={onFlip}
                    ref={book}
                    className="shadow-2xl mx-auto"
                    startPage={0}
                    drawShadow={true}
                    flippingTime={800}
                    usePortrait={isMobile}
                    startZIndex={0}
                    autoSize={false}
                    clickEventForward={true}
                    useMouseEvents={true}
                    swipeDistance={30}
                    showPageCorners={true}
                    disableFlipByClick={false}
                >
                    {generatedPages}
                </HTMLFlipBook>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 bg-white/80 backdrop-blur-md px-8 py-4 rounded-full shadow-lg border border-stone-200/50">
                <button
                    onClick={prevFlip}
                    className="p-2.5 rounded-full hover:bg-stone-100 text-stone-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                    disabled={currentPage === 0}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <span
                    className="text-stone-600 min-w-[4rem] text-center font-medium"
                    style={{
                        fontSize: '11pt'
                    }}
                >
                    {currentPage} / {totalPages - 2}
                </span>

                <button
                    onClick={nextFlip}
                    className="p-2.5 rounded-full hover:bg-stone-100 text-stone-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                    disabled={currentPage >= totalPages - 1}
                    aria-label="Next page"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                {/* Credits Badge */}
                <div className="border-l border-stone-200 pl-4 ml-0">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">{credits} credit{credits !== 1 ? 's' : ''}</span>
                    </div>
                </div>

                {/* PDF Export Button */}
                <div className="border-l border-stone-200 pl-4 ml-0">
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-sm font-semibold transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Export as PDF"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Preparing...
                            </>
                        ) : (
                            <>
                                <FileDown className="w-4 h-4" />
                                Export PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}