"use client";

import React, { forwardRef, useCallback, useRef, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BookPage, PageBasedStory } from "@/actions/library";

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

// Text Page Component - No chapter labels
const TextPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <Page {...props} ref={ref}>
            {/* Body text - clean, no chapter headers */}
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

// Illustration Page Component - No chapter labels
const IllustrationPage = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <Page {...props} ref={ref}>
            <div className="h-full flex flex-col justify-center">
                <div className="relative w-full aspect-[4/3] bg-slate-50 rounded-sm overflow-hidden border border-slate-100 shadow-inner">
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
            </div>
        </Page>
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
    const generatePages = () => {
        const renderedPages: React.ReactElement[] = [];
        let displayPageNumber = 1;

        // Render each page based on its type
        story.pages.forEach((page, index) => {
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
                    // Without this, scene illustration + text end up on different spreads
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
                    {currentPage} / {totalPages-2}
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