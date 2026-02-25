"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Loader2 } from "lucide-react";

interface ImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedBase64: string) => void;
    onCancel: () => void;
    isUploading?: boolean;
}

/**
 * Crops the image canvas given an Area and returns a base64 JPEG.
 */
async function getCroppedImg(src: string, cropArea: Area): Promise<string> {
    const image = new Image();
    image.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = src;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
    );

    return canvas.toDataURL("image/jpeg", 0.92);
}

export default function ImageCropper({
    imageSrc,
    onCropComplete,
    onCancel,
    isUploading = false,
}: ImageCropperProps) {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropAreaChange = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = useCallback(async () => {
        if (!croppedAreaPixels) return;
        const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
        onCropComplete(croppedBase64);
    }, [croppedAreaPixels, imageSrc, onCropComplete]);

    const handleZoomIn = () => setZoom((z) => Math.min(z + 0.2, 3));
    const handleZoomOut = () => setZoom((z) => Math.max(z - 0.2, 1));
    const handleReset = () => {
        setZoom(1);
        setCrop({ x: 0, y: 0 });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">
                        Crop Your Photo
                    </h3>
                    <button
                        onClick={onCancel}
                        disabled={isUploading}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 disabled:opacity-50"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Crop area */}
                <div className="relative w-full aspect-square bg-slate-900">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropAreaChange}
                    />
                </div>

                {/* Controls */}
                <div className="px-6 py-4 space-y-4">
                    {/* Zoom slider row */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleZoomOut}
                            disabled={isUploading}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50"
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="w-4 h-4" />
                        </button>

                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            disabled={isUploading}
                            className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                        />

                        <button
                            onClick={handleZoomIn}
                            disabled={isUploading}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600 disabled:opacity-50"
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="w-4 h-4" />
                        </button>

                        <button
                            onClick={handleReset}
                            disabled={isUploading}
                            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 disabled:opacity-50"
                            aria-label="Reset"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isUploading}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isUploading}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Save Photo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
