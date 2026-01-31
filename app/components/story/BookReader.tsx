"use client";

import React, { forwardRef, useCallback, useRef, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

interface BookReaderProps {
    story: {
        title: string;
        author?: string;
        chapters: {
            title: string;
            content: string;
            illustrationUrl?: string; // Placeholder for now
            illustrationPrompt?: string;
        }[];
    };
    onPageChange?: (page: number) => void;
}

// Page Component
const Page = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <div className="page-content h-full bg-white shadow-inner border-l border-slate-100 overflow-hidden relative" ref={ref}>
            <div className="h-full w-full p-8 md:p-12 flex flex-col">
                {props.children}
                <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-400 font-[family-name:var(--font-inter)]">
                    {props.number}
                </div>
            </div>
            {/* Paper Texture Overlay - Subtle */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>
            {/* Spine Shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>
        </div>
    );
});
Page.displayName = "Page";

// Cover Component
const Cover = forwardRef<HTMLDivElement, any>((props, ref) => {
    return (
        <div className="page-content h-full bg-sky-900 text-white shadow-2xl relative overflow-hidden" ref={ref} data-density="hard">
            <div className="h-full w-full p-10 flex flex-col items-start justify-center text-left border-white/10 m-0">
                <div className="w-12 h-1 bg-sky-400 mb-6"></div>
                <h1 className="font-[family-name:var(--font-inter)] text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight">
                    {props.title}
                </h1>
                <p className="text-sky-200 font-[family-name:var(--font-inter)] text-xl font-light">
                    A personalized story
                </p>
            </div>
        </div>
    );
});
Cover.displayName = "Cover";

export default function BookReader({ story, onPageChange }: BookReaderProps) {
    const book = useRef<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkMobile();

        // Add listener
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Calculate pages: Cover + (Chapter * 2 pages per chapter: Illustration + Text) + Back Cover
    // Adjust logic as needed. For now: 
    // Page 0: Cover
    // Page 1: Illustration 1
    // Page 2: Text 1
    // ...
    // Last Page: Back Cover

    const onFlip = useCallback((e: any) => {
        setCurrentPage(e.data);
        if (onPageChange) onPageChange(e.data);
    }, [onPageChange]);

    useEffect(() => {
        // Initial total pages count based on story length
        // Cover (1) + Chapters * 2 + Back Cover (1)
        setTotalPages(1 + (story.chapters.length * 2) + 1);
    }, [story]);

    const nextFlip = () => {
        book.current?.pageFlip()?.flipNext();
    };

    const prevFlip = () => {
        book.current?.pageFlip()?.flipPrev();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full h-full min-h-[600px] py-8">
            {/* Book Container with 3D perspective */}
            <div className="relative shadow-2xl rounded-sm">
                <HTMLFlipBook
                    width={600}
                    height={800}
                    size="stretch"
                    minWidth={400}
                    maxWidth={1000}
                    minHeight={500}
                    maxHeight={1533}
                    maxShadowOpacity={0.5}
                    showCover={true}
                    mobileScrollSupport={true}
                    onFlip={onFlip}
                    ref={book}
                    className="shadow-2xl mx-auto"
                    style={{ margin: '0 auto' }}
                    startPage={0}
                    drawShadow={true}
                    flippingTime={1000}
                    usePortrait={isMobile}
                    startZIndex={0}
                    autoSize={true}
                    clickEventForward={true}
                    useMouseEvents={true}
                    swipeDistance={30}
                    showPageCorners={true}
                    disableFlipByClick={false}
                >
                    {/* Front Cover */}
                    <Cover title={story.title} key="cover" />

                    {/* Story Pages */}
                    {story.chapters.flatMap((chapter, index) => [
                        /* Left Page: Illustration */
                        <Page number={(index * 2) + 1} key={`page-${index}-left`}>
                            <div className="h-full flex items-center justify-center bg-stone-100 rounded-lg shadow-inner overflow-hidden border-8 border-white transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                <div className="text-stone-300 flex flex-col items-center">
                                    <div className="w-16 h-16 rounded-full bg-stone-200 mb-2"></div>
                                    <span className="font-serif italic text-sm">Illustration</span>
                                </div>
                                <img
                                    src={`https://placehold.co/600x800/eaddcf/5d4037?text=Chapter+${index + 1}`}
                                    alt={`Chapter ${index + 1}`}
                                    className="w-full h-full object-cover opacity-90 mix-blend-multiply"
                                />
                            </div>
                        </Page>,

                        /* Right Page: Text */
                        <Page number={(index * 2) + 2} key={`page-${index}-right`}>
                            <div className="h-full flex flex-col px-8 py-8 bg-white/50">
                                {/* Header Style matching reference */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-1.5 h-8 bg-sky-600 rounded-sm"></div>
                                    <h2 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-slate-800 uppercase tracking-tight">
                                        {chapter.title}
                                    </h2>
                                </div>

                                {/* Content Style matching reference */}
                                <div className="prose prose-sm font-[family-name:var(--font-inter)] leading-normal text-slate-700 flex-1 text-justify overflow-hidden">
                                    {chapter.content.split('\n\n').map((paragraph, pIndex) => (
                                        <p key={pIndex} className="mb-4">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </Page>
                    ])}

                    {/* Back Cover */}
                    <div className="page-content h-full bg-sky-900 text-white shadow-2xl flex items-center justify-center" data-density="hard" key="back-cover">
                        <div className="text-center p-8 opacity-80">
                            <div className="w-12 h-1 bg-sky-400 mx-auto mb-6"></div>
                            <h3 className="font-[family-name:var(--font-inter)] text-2xl font-bold mb-2 tracking-tight">The End</h3>
                            <p className="font-[family-name:var(--font-inter)] text-sky-200 opacity-75">Created with AI Storybook</p>
                        </div>
                    </div>
                </HTMLFlipBook>
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center gap-6 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-stone-200">
                <button
                    onClick={prevFlip}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                    disabled={currentPage === 0}
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>

                <span className="font-medium text-stone-600 min-w-[3rem] text-center font-serif">
                    {currentPage} / {totalPages}
                </span>

                <button
                    onClick={nextFlip}
                    className="p-2 rounded-full hover:bg-stone-100 text-stone-600 transition-colors"
                    disabled={currentPage >= totalPages}
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}

