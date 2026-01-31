"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Book } from "lucide-react";
import SearchFilter from "./SearchFilter";
import BookCard from "./BookCard";

const books = [
    { id: 1, title: "Luna's Forest Adventure", status: "complete", date: "Jan 28, 2026", pages: 12, cover: "" },
    { id: 2, title: "The Space Cat Journey", status: "draft", date: "Jan 25, 2026", pages: 8, cover: "" },
    { id: 3, title: "Under the Sea Magic", status: "complete", date: "Jan 20, 2026", pages: 15, cover: "" },
    { id: 4, title: "Dragon's Hidden Castle", status: "printed", date: "Jan 15, 2026", pages: 12, cover: "" },
    { id: 5, title: "The Magical Garden", status: "draft", date: "Jan 10, 2026", pages: 6, cover: "" },
    { id: 6, title: "Adventure in Rainbow Land", status: "complete", date: "Jan 5, 2026", pages: 10, cover: "" },
];

export default function LibraryContent() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all");

    const filteredBooks = useMemo(() => {
        return books.filter((book) => {
            const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = filter === "all" || book.status === filter;
            return matchesSearch && matchesFilter;
        });
    }, [searchQuery, filter]);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Book className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
                        My Library
                    </h1>
                </div>
                <Link
                    href="/create"
                    className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                    Create Story
                </Link>
            </div>

            {/* Search & Filter */}
            <SearchFilter
                onSearch={setSearchQuery}
                onFilter={setFilter}
                currentFilter={filter}
            />

            {/* Books Grid */}
            {filteredBooks.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBooks.map((book) => (
                        <BookCard key={book.id} {...book} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-border rounded-full flex items-center justify-center mx-auto mb-4">
                        <Book className="w-10 h-10 text-text-muted" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                        No stories found
                    </h3>
                    <p className="text-text-muted mb-6">
                        {searchQuery
                            ? "Try adjusting your search or filter"
                            : "Start creating your first magical story!"}
                    </p>
                    <Link
                        href="/create"
                        className="inline-flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        Create Your First Story
                    </Link>
                </div>
            )}
        </>
    );
}
