"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CHARACTERS = [
    {
        id: 1,
        real: "/images/character-showcase/real_boy_1.png",
        pixar: "/images/character-showcase/pixar_boy_1.png",
        label: "Adventure Ready",
    },
    {
        id: 2,
        real: "/images/character-showcase/real_girl_1.png",
        pixar: "/images/character-showcase/pixar_girl_1.png",
        label: "Magical Princess",
    },
    {
        id: 3,
        real: "/images/character-showcase/real_child_glasses.png",
        pixar: "/images/character-showcase/pixar_child_glasses.png",
        label: "Smart Explorer",
    },
];

export default function CharacterCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % CHARACTERS.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + CHARACTERS.length) % CHARACTERS.length);
    };

    return (
        <div className="relative w-full w-5xl mx-auto px-4">
            {/* Carousel Container */}
            <div className="relative bg-indigo-50/50 rounded-[2.5rem] p-8 lg:p-12 border border-indigo-100 overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-16 min-h-[400px]">

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col md:flex-row items-center gap-8 lg:gap-16 w-full justify-center"
                        >
                            {/* Real Photo */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-br from-slate-200 to-slate-100 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                                <div className="relative w-64 h-64 lg:w-72 lg:h-72 bg-white rounded-[1.8rem] shadow-xl p-3 transform -rotate-2 transition-transform duration-300 group-hover:rotate-0">
                                    <div className="w-full h-full relative rounded-[1.2rem] overflow-hidden">
                                        <Image
                                            src={CHARACTERS[currentIndex].real}
                                            alt="Real Photo"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                                            Original Photo
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Transformation Arrow */}
                            <div className="flex flex-col items-center gap-2 text-indigo-500">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20 animate-pulse"></div>
                                    <ArrowRight className="w-10 h-10 lg:w-12 lg:h-12 relative z-10" strokeWidth={2.5} />
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider bg-indigo-100 px-3 py-1 rounded-full">
                                    AI Magic
                                </span>
                            </div>

                            {/* Pixar Avatar */}
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-400 via-purple-400 to-indigo-400 rounded-[2rem] blur opacity-75 group-hover:opacity-100 transition duration-500 animate-gradient-xy"></div>
                                <div className="relative w-64 h-64 lg:w-72 lg:h-72 bg-white rounded-[1.8rem] shadow-2xl p-3 transform rotate-2 transition-transform duration-300 group-hover:rotate-0">
                                    <div className="w-full h-full relative rounded-[1.2rem] overflow-hidden bg-slate-900">
                                        <Image
                                            src={CHARACTERS[currentIndex].pixar}
                                            alt="Pixar Style Avatar"
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute top-3 right-3 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg">
                                            <Sparkles className="w-4 h-4" />
                                        </div>
                                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                                            {CHARACTERS[currentIndex].label}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                </div>

                {/* Navigation Controls */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-20">
                    <button
                        onClick={prevSlide}
                        className="p-3 rounded-full bg-white shadow-lg text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label="Previous character"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <div className="flex gap-2">
                        {CHARACTERS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-8 bg-indigo-600" : "w-2 bg-indigo-200"
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextSlide}
                        className="p-3 rounded-full bg-white shadow-lg text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label="Next character"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="text-center mt-8">
                <p className="text-sm font-medium text-indigo-800 bg-indigo-100/50 inline-block px-4 py-2 rounded-full">
                    Same face. Consistent style. Every page.
                </p>
            </div>
        </div>
    );
}
