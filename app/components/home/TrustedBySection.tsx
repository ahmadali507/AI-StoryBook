import { Star } from "lucide-react";

const partners = [
    "ParentCircle",
    "KidTech Innovators",
    "Storytime Alliance",
    "FutureReaders",
    "LearningLounge",
];

export default function TrustedBySection() {
    return (
        <section className="py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-text-muted mb-8">
                    Trusted by 1000+ Families and Partners
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-60">
                    {partners.map((partner) => (
                        <div key={partner} className="flex items-center gap-2 text-text-muted">
                            <Star className="w-5 h-5" />
                            <span className="font-medium">{partner}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
