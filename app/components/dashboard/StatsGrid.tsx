import { Book, Users, Star, Clock } from "lucide-react";

const stats = [
    { icon: Book, label: "Stories Created", value: "12", color: "bg-primary/10 text-primary" },
    { icon: Users, label: "Characters", value: "8", color: "bg-secondary/10 text-secondary" },
    { icon: Star, label: "Printed Books", value: "5", color: "bg-success/10 text-success" },
    { icon: Clock, label: "Reading Time", value: "24h", color: "bg-warning/10 text-warning" },
];

export default function StatsGrid() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.label}
                        className="bg-surface border border-border rounded-2xl p-5 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                                <p className="text-sm text-text-muted">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
