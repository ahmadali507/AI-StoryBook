"use client";

import React, { forwardRef, useCallback, useRef, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookReaderProps {
    story: {
        title: string;
        author?: string;
        coverImageUrl?: string;
        chapters: {
            title: string;
            content: string;
            illustrationUrl?: string;
            illustrationPrompt?: string;
        }[];
    };
    onPageChange?: (page: number) => void;
}

// Clean Modern Page Component
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

// Text Page Component
const TextPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <Page {...props} ref={ref}>
            {/* Chapter header */}
            {props.isChapterStart && (
                <div className="mb-8 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-1.5 h-8 bg-sky-600 rounded-sm"></div>
                        <h2 className="font-sans text-2xl font-bold text-slate-900 uppercase tracking-tight leading-none">
                            {props.chapterTitle}
                        </h2>
                    </div>
                </div>
            )}

            {/* Body text */}
            <div className="flex-1 text-justify font-sans text-sm leading-relaxed text-slate-700 overflow-hidden">
                {props.content.split('\n\n').map((paragraph: string, pIndex: number) => (
                    <p key={pIndex} className="mb-4 last:mb-0">
                        {paragraph}
                    </p>
                ))}
            </div>
        </Page>
    );
});
TextPage.displayName = "TextPage";

// Illustration Page Component
const IllustrationPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <Page {...props} ref={ref}>
            <div className="h-full flex flex-col justify-center">
                <div className="relative w-full aspect-[3/4] bg-slate-50 rounded-sm overflow-hidden border border-slate-100 shadow-inner">
                    {props.illustrationUrl ? (
                        <img
                            src={props.illustrationUrl}
                            alt={props.alt || "Illustration"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                            <span className="text-xs uppercase tracking-widest">No Illustration</span>
                        </div>
                    )}
                </div>
                {props.chapterLabel && (
                    <div className="mt-4 text-center">
                        <span className="text-xs font-sans font-bold text-sky-600 uppercase tracking-widest">
                            {props.chapterLabel}
                        </span>
                    </div>
                )}
            </div>
        </Page>
    );
});
IllustrationPage.displayName = "IllustrationPage";

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
                        className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-black/30"></div>
                </div>
            ) : null}

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
        </div>
    );
});
Cover.displayName = "Cover";

// Back Cover Component  
const BackCover = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <div
            className="page-content h-full bg-sky-900 text-white shadow-2xl relative overflow-hidden"
            ref={ref}
            data-density="hard"
        >
            <div className="h-full flex flex-col items-center justify-center px-16 text-center">
                <div className="w-12 h-1 bg-sky-400 mb-8"></div>
                <h3 className="font-sans text-3xl font-bold mb-4 tracking-tight">The End</h3>
                <p className="font-sans text-sky-200 text-sm opacity-75">Created with AI Storybook</p>
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

    /**
     * Improved text splitting that respects paragraph boundaries
     * and ensures no text is cut off
     */
    const splitTextIntoPages = (content: string, isFirstPage: boolean = false) => {
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        const pages: string[] = [];
        let currentPage: string[] = [];

        // Character limits (approximate based on page layout)
        // First page has less space due to chapter header
        const FIRST_PAGE_LIMIT = 1200;
        const REGULAR_PAGE_LIMIT = 1800;

        let currentCharCount = 0;
        let isFirstPageOfChapter = isFirstPage;

        for (const paragraph of paragraphs) {
            const paragraphLength = paragraph.length;
            const currentLimit = isFirstPageOfChapter ? FIRST_PAGE_LIMIT : REGULAR_PAGE_LIMIT;

            // If adding this paragraph exceeds limit and we have content, create new page
            if (currentCharCount + paragraphLength > currentLimit && currentPage.length > 0) {
                // Save current page
                pages.push(currentPage.join('\n\n'));
                // Start new page with this paragraph
                currentPage = [paragraph];
                currentCharCount = paragraphLength;
                isFirstPageOfChapter = false; // No longer first page
            }
            // If single paragraph is too long for one page, split it
            else if (paragraphLength > currentLimit && currentPage.length === 0) {
                // Split very long paragraph by sentences
                const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
                let tempPage: string[] = [];
                let tempCount = 0;

                for (const sentence of sentences) {
                    const sentenceLength = sentence.length;

                    if (tempCount + sentenceLength > currentLimit && tempPage.length > 0) {
                        pages.push(tempPage.join(' '));
                        tempPage = [sentence];
                        tempCount = sentenceLength;
                        isFirstPageOfChapter = false;
                    } else {
                        tempPage.push(sentence);
                        tempCount += sentenceLength;
                    }
                }

                if (tempPage.length > 0) {
                    currentPage = [tempPage.join(' ')];
                    currentCharCount = tempCount;
                }
            }
            // Otherwise add paragraph to current page
            else {
                currentPage.push(paragraph);
                currentCharCount += paragraphLength;
            }
        }

        // Add remaining content as final page
        if (currentPage.length > 0) {
            pages.push(currentPage.join('\n\n'));
        }

        // Return at least one page
        return pages.length > 0 ? pages : [''];
    };

    // Generate all pages for the book
    const generatePages = () => {
        const pages = [];
        let pageNumber = 1;

        // Cover page
        pages.push(
            <Cover
                key="cover"
                title={story.title}
                author={story.author}
                coverUrl={story.coverImageUrl}
            />
        );

        // Process each chapter
        story.chapters.forEach((chapter, chapterIndex) => {
            // Illustration page
            pages.push(
                <IllustrationPage
                    key={`illust-${chapterIndex}`}
                    number={pageNumber++}
                    runningHeader={story.title}
                    illustrationUrl={chapter.illustrationUrl}
                    alt={`${chapter.title} illustration`}
                    chapterLabel={`Chapter ${chapterIndex + 1}`}
                />
            );

            // Split chapter text into pages
            const textPages = splitTextIntoPages(chapter.content, true);

            textPages.forEach((pageContent, pageIndex) => {
                pages.push(
                    <TextPage
                        key={`text-${chapterIndex}-${pageIndex}-${pageNumber}`}
                        number={pageNumber++}
                        runningHeader={story.title}
                        content={pageContent}
                        isChapterStart={pageIndex === 0}
                        chapterLabel={`Chapter ${chapterIndex + 1}`}
                        chapterTitle={chapter.title}
                    />
                );
            });
        });

        // Back cover
        pages.push(<BackCover key="back-cover" />);

        return pages;
    };

    // Memoize generated pages
    const [generatedPages, setGeneratedPages] = useState<React.ReactElement[]>([]);

    useEffect(() => {
        const pages = generatePages();
        setGeneratedPages(pages);
        setTotalPages(pages.length);
    }, [story]);

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
                    {currentPage} / {totalPages}
                </span>

                <button
                    onClick={nextFlip}
                    className="p-2.5 rounded-full hover:bg-stone-100 text-stone-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                    disabled={currentPage >= totalPages - 1}
                    aria-label="Next page"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}