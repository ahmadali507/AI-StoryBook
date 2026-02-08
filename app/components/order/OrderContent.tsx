"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/layout";
import {
    ChevronLeft,
    Book,
    Check,
    Truck,
    CreditCard,
    Shield,
    ChevronRight
} from "lucide-react";

const formats = [
    { id: "hardcover", name: "Hardcover", description: "Premium quality, durable binding", price: 29.99, popular: true },
    { id: "softcover", name: "Softcover", description: "Lightweight, flexible cover", price: 19.99, popular: false },
    { id: "digital", name: "Digital PDF", description: "Instant download, print at home", price: 9.99, popular: false },
];

const sizes = [
    { id: "small", name: '6"x6"', description: "Perfect for little hands" },
    { id: "medium", name: '8"x8"', description: "Classic storybook size" },
    { id: "large", name: '10"x10"', description: "Premium display quality" },
];

const features = [
    { icon: Truck, text: "Free shipping on orders $30+" },
    { icon: CreditCard, text: "Secure payment processing" },
    { icon: Shield, text: "100% satisfaction guarantee" },
];

export default function OrderContent() {
    const [selectedFormat, setSelectedFormat] = useState("hardcover");
    const [selectedSize, setSelectedSize] = useState("medium");
    const [quantity, setQuantity] = useState(1);

    const currentFormat = formats.find((f) => f.id === selectedFormat);
    const subtotal = (currentFormat?.price || 0) * quantity;
    const shipping = subtotal >= 30 ? 0 : 4.99;
    const total = subtotal + shipping;

    return (
        <main className="pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Link href="/" className="hover:text-foreground cursor-pointer">
                        Home
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground">Order Print</span>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column - Options */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Format Selection */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                                Book Format
                            </h2>
                            <div className="space-y-3">
                                {formats.map((format) => (
                                    <button
                                        key={format.id}
                                        onClick={() => setSelectedFormat(format.id)}
                                        className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all text-left cursor-pointer ${selectedFormat === format.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedFormat === format.id
                                                ? "border-primary bg-primary"
                                                : "border-border"
                                                }`}>
                                                {selectedFormat === format.id && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-foreground">{format.name}</span>
                                                    {format.popular && (
                                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                            Most Popular
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-muted">{format.description}</p>
                                            </div>
                                        </div>
                                        <span className="font-semibold text-foreground">${format.price}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size Selection */}
                        {selectedFormat !== "digital" && (
                            <div className="bg-surface border border-border rounded-2xl p-6">
                                <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                                    Book Size
                                </h2>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    {sizes.map((size) => (
                                        <button
                                            key={size.id}
                                            onClick={() => setSelectedSize(size.id)}
                                            className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${selectedSize === size.id
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                                }`}
                                        >
                                            <p className="font-semibold text-foreground text-lg">{size.name}</p>
                                            <p className="text-sm text-text-muted">{size.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                                Quantity
                            </h2>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-background transition-colors cursor-pointer text-xl font-semibold"
                                >
                                    -
                                </button>
                                <span className="text-2xl font-bold text-foreground w-12 text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                                    className="w-12 h-12 rounded-xl border border-border flex items-center justify-center hover:bg-background transition-colors cursor-pointer text-xl font-semibold"
                                >
                                    +
                                </button>
                                <p className="text-sm text-text-muted ml-4">
                                    Perfect for gifts!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-surface border border-border rounded-2xl p-6 sticky top-24">
                            {/* Book Preview */}
                            <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center mb-6">
                                <div className="w-32 h-40 bg-white rounded-lg shadow-lg flex items-center justify-center">
                                    <Book className="w-12 h-12 text-primary" />
                                </div>
                            </div>

                            <h3 className="font-heading font-semibold text-foreground mb-1">
                                Luna&apos;s Forest Adventure
                            </h3>
                            <p className="text-sm text-text-muted mb-6">12 pages</p>

                            {/* Order Summary */}
                            <div className="space-y-3 border-t border-border pt-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">{currentFormat?.name} × {quantity}</span>
                                    <span className="text-foreground">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-text-muted">Shipping</span>
                                    <span className={shipping === 0 ? "text-success" : "text-foreground"}>
                                        {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg border-t border-border pt-3">
                                    <span className="text-foreground">Total</span>
                                    <span className="text-foreground">${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <button className="w-full bg-secondary text-white py-4 rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer">
                                Proceed to Checkout
                            </button>

                            {/* Features */}
                            <div className="mt-6 space-y-3">
                                {features.map((feature, index) => {
                                    const Icon = feature.icon;
                                    return (
                                        <div key={index} className="flex items-center gap-3 text-sm text-text-muted">
                                            <Icon className="w-4 h-4" />
                                            <span>{feature.text}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
