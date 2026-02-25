"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
    Lock, Palette, Bell, AlertTriangle, Save, Loader2,
    CheckCircle, BookOpen, Users, ShoppingBag, Camera, Pencil,
} from "lucide-react";
import type { Profile } from "@/actions/profile";
import { updateProfileAction, deleteAccountAction } from "@/actions/profile";
import { uploadProfilePicture } from "@/actions/upload-avatar";
import ImageCropper from "./ImageCropper";

const ART_STYLE_OPTIONS = [
    { value: "", label: "No preference" },
    { value: "whimsical-watercolor", label: "Whimsical & Watercolor" },
    { value: "classic-illustration", label: "Classic Illustration" },
    { value: "modern-digital", label: "Modern Digital" },
    { value: "comic-book", label: "Comic Book" },
    { value: "pastel-dreamy", label: "Pastel & Dreamy" },
    { value: "bold-graphic", label: "Bold & Graphic" },
];

interface ProfileFormProps {
    profile: Profile;
    isOwner: boolean;
}

function getInitials(name: string | null, email: string | null): string {
    if (name) {
        return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return (email ?? "?")[0].toUpperCase();
}

export default function ProfileForm({ profile, isOwner }: ProfileFormProps) {
    const router = useRouter();

    // ── Form state ──────────────────────────────────────────────────────
    const [fullName, setFullName] = useState(profile.fullName ?? "");
    const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
    const [preferredArtStyle, setPreferredArtStyle] = useState(profile.preferredArtStyle ?? "");
    const [emailNotifications, setEmailNotifications] = useState(profile.emailNotifications);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    // ── Cropper state ───────────────────────────────────────────────────
    const [cropperSrc, setCropperSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Save profile mutation ───────────────────────────────────────────
    const saveMutation = useMutation({
        mutationFn: () =>
            updateProfileAction({
                fullName,
                avatarUrl,
                preferredArtStyle,
                emailNotifications,
            }),
        onSuccess: (result) => {
            if (!result.success) {
                alert(result.error ?? "Failed to save changes.");
                return;
            }
            router.refresh();
        },
    });

    // ── Upload avatar mutation ──────────────────────────────────────────
    const uploadMutation = useMutation({
        mutationFn: (base64Data: string) => uploadProfilePicture(base64Data),
        onSuccess: (result) => {
            if (!result.success) {
                alert(result.error ?? "Failed to upload photo.");
                return;
            }
            if (result.avatarUrl) {
                setAvatarUrl(result.avatarUrl);
            }
            setCropperSrc(null);
            router.refresh();
        },
    });

    // ── Delete mutation ─────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: () => deleteAccountAction(),
        onSuccess: (result) => {
            if (!result.success) {
                alert(result.error ?? "Failed to delete account.");
            }
        },
    });

    // ── File selection → open cropper ───────────────────────────────────
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setCropperSrc(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Reset input so the same file can be re-selected
        e.target.value = "";
    }, []);

    // ── Cropper confirm → upload ────────────────────────────────────────
    const handleCropConfirm = useCallback(
        (croppedBase64: string) => {
            uploadMutation.mutate(croppedBase64);
        },
        [uploadMutation]
    );

    const initials = getInitials(profile.fullName, profile.email);
    const lastUpdated = new Date(profile.updatedAt).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
    });
    const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long", year: "numeric",
    });

    return (
        <div className="min-h-screen bg-slate-50 pt-24 pb-16 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* ── Page header ──────────────────────────────────── */}
                <div className="mb-2">
                    <h1 className="text-3xl font-bold text-slate-800 font-heading">
                        Account Settings
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isOwner
                            ? "Manage your personal information and preferences"
                            : `Viewing ${profile.fullName ?? "user"}'s profile`}
                    </p>
                </div>

                {/* ── Main profile card ────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Avatar + name strip */}
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-5">
                        <div className="relative group">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg shadow-indigo-200 overflow-hidden">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    initials
                                )}
                            </div>
                            {isOwner && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                        aria-label="Change profile photo"
                                    >
                                        <Camera className="w-5 h-5 text-white" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-800 font-semibold text-lg truncate">
                                {profile.fullName || "Your Name"}
                            </p>
                            <p className="text-slate-400 text-sm truncate">{profile.email}</p>
                            <p className="text-slate-300 text-xs mt-0.5">Member since {memberSince}</p>
                        </div>
                        {/* Edit existing photo button */}
                        {isOwner && avatarUrl && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50"
                            >
                                <Pencil className="w-3 h-3" />
                                Edit Photo
                            </button>
                        )}
                    </div>

                    {/* ── Stats row ────────────────────────────────── */}
                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                        <StatCard
                            icon={<BookOpen className="w-4 h-4 text-indigo-400" />}
                            label="Stories"
                            value={profile.storiesCreated}
                        />
                        <StatCard
                            icon={<Users className="w-4 h-4 text-violet-400" />}
                            label="Characters"
                            value={profile.charactersCreated}
                        />
                        <StatCard
                            icon={<ShoppingBag className="w-4 h-4 text-emerald-400" />}
                            label="Orders"
                            value={profile.totalOrders}
                        />
                    </div>

                    {/* ── Form fields ──────────────────────────────── */}
                    <div className="px-8 py-6 space-y-6">

                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Personal Information
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700" htmlFor="fullName">
                                    Full Name
                                </label>
                                <input
                                    id="fullName"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={!isOwner}
                                    placeholder="Your full name"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all text-sm bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Email — always read only */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5" htmlFor="email">
                                    Email Address
                                    <Lock className="w-3.5 h-3.5 text-slate-300" />
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={profile.email ?? ""}
                                    readOnly
                                    className="w-full border border-slate-100 rounded-xl px-4 py-3 text-slate-400 bg-slate-50 text-sm cursor-not-allowed"
                                />
                            </div>

                            {/* Subscription tier — read only */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700" htmlFor="tier">
                                    Subscription
                                </label>
                                <input
                                    id="tier"
                                    type="text"
                                    value={profile.subscriptionTier.charAt(0).toUpperCase() + profile.subscriptionTier.slice(1)}
                                    readOnly
                                    className="w-full border border-slate-100 rounded-xl px-4 py-3 text-slate-400 bg-slate-50 text-sm cursor-not-allowed capitalize"
                                />
                            </div>

                            {/* Preferred Art Style */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-700 flex items-center gap-1.5" htmlFor="artStyle">
                                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                                    Preferred Art Style
                                </label>
                                <select
                                    id="artStyle"
                                    value={preferredArtStyle}
                                    onChange={(e) => setPreferredArtStyle(e.target.value)}
                                    disabled={!isOwner}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 transition-all text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                                >
                                    {ART_STYLE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── Divider ────────────────────────────────── */}
                        <div className="border-t border-slate-100" />

                        {/* ── Preferences ────────────────────────────── */}
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Preferences
                        </p>

                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    <Bell className="w-3.5 h-3.5 text-indigo-400" />
                                    Email Notifications
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Receive updates about your stories and new features
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={emailNotifications}
                                onClick={() => isOwner && setEmailNotifications(!emailNotifications)}
                                disabled={!isOwner}
                                className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${emailNotifications ? "bg-indigo-600" : "bg-slate-200"
                                    } ${!isOwner ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span
                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${emailNotifications ? "translate-x-5" : "translate-x-0"
                                        }`}
                                />
                            </button>
                        </div>

                        {/* ── Divider + save ────────────────────────── */}
                        {isOwner && (
                            <>
                                <div className="border-t border-slate-100" />
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-xs text-slate-400">
                                        Last updated {lastUpdated}
                                    </p>
                                    <button
                                        onClick={() => saveMutation.mutate()}
                                        disabled={saveMutation.isPending}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {saveMutation.isPending ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                                        ) : (
                                            <><Save className="w-4 h-4" /> Save Changes</>
                                        )}
                                    </button>
                                </div>

                                {saveMutation.isSuccess && saveMutation.data?.success && (
                                    <p className="text-sm text-emerald-600 text-right flex items-center justify-end gap-1.5">
                                        <CheckCircle className="w-4 h-4" /> Changes saved successfully
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Danger Zone (owner only) ─────────────────────── */}
                {isOwner && (
                    <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                        <div className="px-8 py-6">
                            <div className="flex items-start gap-3 mb-4">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h2 className="text-base font-bold text-slate-800">
                                        Danger Zone
                                    </h2>
                                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                        Once you delete your account, there is no going back. All your storybooks,
                                        characters, orders, and personal data will be permanently removed.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-5 py-2.5 rounded-xl border border-red-300 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors"
                                >
                                    Delete Your Account
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Image Cropper modal ──────────────────────────────── */}
            {cropperSrc && (
                <ImageCropper
                    imageSrc={cropperSrc}
                    onCropComplete={handleCropConfirm}
                    onCancel={() => setCropperSrc(null)}
                    isUploading={uploadMutation.isPending}
                />
            )}

            {/* ── Delete confirmation modal ────────────────────────── */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <h3 className="text-lg font-bold text-slate-800">Delete Account</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                            This action is <strong className="text-slate-800">permanent and irreversible</strong>. Type{" "}
                            <code className="bg-red-50 px-1.5 py-0.5 rounded text-red-500 text-xs border border-red-100">
                                DELETE
                            </code>{" "}
                            to confirm.
                        </p>
                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-red-300 text-sm mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeleteConfirmText("");
                                }}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate()}
                                disabled={deleteConfirmText !== "DELETE" || deleteMutation.isPending}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {deleteMutation.isPending ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />Deleting…
                                    </span>
                                ) : (
                                    "Delete Account"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Stat card sub-component ──────────────────────────────────────────────────

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
}

function StatCard({ icon, label, value }: StatCardProps) {
    return (
        <div className="flex flex-col items-center justify-center py-4 gap-1">
            <div className="flex items-center gap-1.5">
                {icon}
                <span className="text-xl font-bold text-slate-800">{value}</span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{label}</span>
        </div>
    );
}
