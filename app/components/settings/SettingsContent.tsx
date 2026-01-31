"use client";

import { useState } from "react";
import { Navbar, Footer } from "@/app/components/layout";
import { Toggle } from "@/app/components/common";
import {
    User,
    Bell,
    Shield,
    CreditCard,
    Globe,
    Moon,
    Mail,
    ChevronRight,
    Camera,
    Check
} from "lucide-react";

const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "billing", label: "Billing", icon: CreditCard },
];

function SettingsTabs({
    activeTab,
    onTabChange,
}: {
    activeTab: string;
    onTabChange: (tab: string) => void;
}) {
    return (
        <div className="bg-surface border border-border rounded-2xl p-2 flex flex-col gap-1">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left cursor-pointer ${activeTab === tab.id
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-background"
                            }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
                        {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </button>
                );
            })}
        </div>
    );
}

function ProfileSettings() {
    const [name, setName] = useState("Jane Doe");
    const [email, setEmail] = useState("jane@example.com");

    return (
        <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Profile Settings
            </h2>

            {/* Avatar */}
            <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center hover:opacity-90 transition-all cursor-pointer">
                        <Camera className="w-4 h-4" />
                    </button>
                </div>
                <div>
                    <p className="font-medium text-foreground">{name}</p>
                    <p className="text-sm text-text-muted">{email}</p>
                </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                    />
                </div>
                <button className="bg-secondary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all cursor-pointer">
                    Save Changes
                </button>
            </div>
        </div>
    );
}

function NotificationSettings() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [storyUpdates, setStoryUpdates] = useState(true);
    const [promotions, setPromotions] = useState(false);

    return (
        <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Notification Preferences
            </h2>

            <div className="space-y-6">
                <Toggle
                    checked={emailNotifications}
                    onChange={setEmailNotifications}
                    label="Email Notifications"
                    description="Receive updates about your stories via email"
                />
                <Toggle
                    checked={storyUpdates}
                    onChange={setStoryUpdates}
                    label="Story Updates"
                    description="Get notified when your story is ready"
                />
                <Toggle
                    checked={promotions}
                    onChange={setPromotions}
                    label="Promotional Emails"
                    description="Receive deals and special offers"
                />
            </div>
        </div>
    );
}

function PrivacySettings() {
    const [publicProfile, setPublicProfile] = useState(false);
    const [shareLibrary, setShareLibrary] = useState(false);

    return (
        <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Privacy Settings
            </h2>

            <div className="space-y-6">
                <Toggle
                    checked={publicProfile}
                    onChange={setPublicProfile}
                    label="Public Profile"
                    description="Allow others to see your profile"
                />
                <Toggle
                    checked={shareLibrary}
                    onChange={setShareLibrary}
                    label="Share Library"
                    description="Allow others to see your stories"
                />
            </div>

            <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-medium text-error mb-2">Danger Zone</h3>
                <p className="text-sm text-text-muted mb-4">
                    Once you delete your account, there is no going back.
                </p>
                <button className="text-error border border-error px-4 py-2 rounded-lg hover:bg-error/10 transition-colors cursor-pointer">
                    Delete Account
                </button>
            </div>
        </div>
    );
}

function BillingSettings() {
    return (
        <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Subscription & Billing
            </h2>

            {/* Current Plan */}
            <div className="bg-primary/5 border-2 border-primary rounded-xl p-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-primary font-medium">Current Plan</p>
                        <h3 className="font-heading text-2xl font-bold text-foreground">Free</h3>
                        <p className="text-sm text-text-muted">3 stories per month</p>
                    </div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        Active
                    </span>
                </div>
            </div>

            {/* Upgrade Option */}
            <div className="border border-border rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-heading text-xl font-bold text-foreground">Pro</h3>
                        <p className="text-sm text-text-muted">Unlimited stories + 20% off prints</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                        $9.99<span className="text-sm text-text-muted font-normal">/mo</span>
                    </p>
                </div>
                <button className="w-full bg-secondary text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all cursor-pointer">
                    Upgrade to Pro
                </button>
            </div>
        </div>
    );
}

export default function SettingsContent() {
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <main className="pt-24 pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="font-heading text-3xl font-bold text-foreground mb-8">
                    Settings
                </h1>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-3">
                        {activeTab === "profile" && <ProfileSettings />}
                        {activeTab === "notifications" && <NotificationSettings />}
                        {activeTab === "privacy" && <PrivacySettings />}
                        {activeTab === "billing" && <BillingSettings />}
                    </div>
                </div>
            </div>
        </main>
    );
}
