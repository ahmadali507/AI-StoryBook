import Link from "next/link";
import { Book, Edit3, Printer, Trash2, Eye } from "lucide-react";
import { Badge } from "@/app/components/common";

interface BookCardProps {
    id: string | number;
    title: string;
    status: string;
    date: string;
    pages: number;
    cover: string;
}

export default function BookCard({ id, title, status, date, pages, cover }: BookCardProps) {
    return (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group">
            {/* Cover Image */}
            <div className="h-48 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
                {cover ? (
                    <img
                        src={cover}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-24 h-32 bg-white rounded-lg shadow-lg flex items-center justify-center">
                        <Book className="w-10 h-10 text-primary" />
                    </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link
                        href={`/story/${id}`}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                    >
                        <Eye className="w-5 h-5 text-foreground" />
                    </Link>
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                        <Edit3 className="w-5 h-5 text-foreground" />
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                        <Printer className="w-5 h-5 text-foreground" />
                    </button>
                    <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                        <Trash2 className="w-5 h-5 text-error" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-foreground truncate">
                        {title}
                    </h3>
                    <Badge variant={status === "complete" ? "success" : status === "draft" ? "warning" : "primary"}>
                        {status}
                    </Badge>
                </div>
                <p className="text-sm text-text-muted">
                    {pages} pages • {date}
                </p>
            </div>
        </div>
    );
}
