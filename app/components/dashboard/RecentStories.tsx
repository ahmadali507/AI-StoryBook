import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { Badge } from "@/app/components/common";

const recentStories = [
    { id: 1, title: "Luna's Forest Adventure", date: "2 days ago", status: "complete" },
    { id: 2, title: "The Space Cat Journey", date: "5 days ago", status: "draft" },
    { id: 3, title: "Under the Sea Magic", date: "1 week ago", status: "complete" },
];

export default function RecentStories() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                    Recent Stories
                </h2>
                <Link
                    href="/library"
                    className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                    View all
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="bg-surface border border-border rounded-2xl divide-y divide-border">
                {recentStories.map((story) => (
                    <Link
                        key={story.id}
                        href={`/story/${story.id}`}
                        className="flex items-center gap-4 p-4 hover:bg-background/50 transition-colors cursor-pointer first:rounded-t-2xl last:rounded-b-2xl"
                    >
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">{story.title}</h3>
                            <p className="text-sm text-text-muted">{story.date}</p>
                        </div>
                        <Badge
                            variant={story.status === "complete" ? "success" : "warning"}
                        >
                            {story.status}
                        </Badge>
                    </Link>
                ))}
            </div>
        </div>
    );
}
