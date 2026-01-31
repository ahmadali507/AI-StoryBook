"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

interface SearchFilterProps {
    onSearch: (query: string) => void;
    onFilter: (filter: string) => void;
    currentFilter: string;
}

const filters = [
    { value: "all", label: "All Stories" },
    { value: "complete", label: "Completed" },
    { value: "draft", label: "Drafts" },
    { value: "printed", label: "Printed" },
];

export default function SearchFilter({ onSearch, onFilter, currentFilter }: SearchFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                    type="text"
                    placeholder="Search stories..."
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
            </div>

            {/* Filter Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface hover:bg-background transition-colors cursor-pointer min-w-[160px]"
                >
                    <Filter className="w-5 h-5 text-text-muted" />
                    <span className="text-foreground font-medium">
                        {filters.find((f) => f.value === currentFilter)?.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-text-muted ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                        {filters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => {
                                    onFilter(filter.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left hover:bg-background transition-colors cursor-pointer ${currentFilter === filter.value
                                        ? "text-primary bg-primary/5"
                                        : "text-foreground"
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
