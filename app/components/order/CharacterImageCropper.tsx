"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import "./CharacterImageCropper.css"; // Optional: Custom handle styling
import { Check, X, Loader2, Maximize, Square, RectangleVertical, RectangleHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CharacterImageCropperProps {
    imageSrc: string;
    onCropComplete: (croppedBase64: string) => void;
    onCancel: () => void;
    isUploading?: boolean;
}

const PRESETS = [
    { id: "freeform", label: "Freeform", aspect: undefined, icon: Maximize },
    { id: "square", label: "Square (1:1)", aspect: 1, icon: Square },
    { id: "portrait", label: "Portrait (3:4)", aspect: 3 / 4, icon: RectangleVertical },
    { id: "landscape", label: "Landscape (16:9)", aspect: 16 / 9, icon: RectangleHorizontal },
];

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export default function CharacterImageCropper({
    imageSrc,
    onCropComplete,
    onCancel,
    isUploading = false,
}: CharacterImageCropperProps) {
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [activePreset, setActivePreset] = useState<typeof PRESETS[0]>(PRESETS[0]); // Default Freeform

    // Initialize crop when image loads
    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        if (activePreset.aspect) {
            setCrop(centerAspectCrop(width, height, activePreset.aspect));
        } else {
            // Default freeform crop
            setCrop(centerCrop(
                {
                    unit: '%',
                    width: 90,
                    height: 90,
                },
                width,
                height
            ));
        }
    }, [activePreset.aspect]);

    const handlePresetChange = (preset: typeof PRESETS[0]) => {
        setActivePreset(preset);
        if (imgRef.current && preset.aspect) {
            const { width, height } = imgRef.current;
            setCrop(centerAspectCrop(width, height, preset.aspect));
        }
    };

    const handleConfirm = async () => {
        if (!completedCrop || !imgRef.current) return;

        const image = imgRef.current;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("No 2d context");

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        const pixelRatio = window.devicePixelRatio;

        canvas.width = Math.floor(completedCrop.width * scaleX * pixelRatio);
        canvas.height = Math.floor(completedCrop.height * scaleY * pixelRatio);

        ctx.scale(pixelRatio, pixelRatio);
        ctx.imageSmoothingQuality = "high";

        const cropX = completedCrop.x * scaleX;
        const cropY = completedCrop.y * scaleY;
        const cropWidth = completedCrop.width * scaleX;
        const cropHeight = completedCrop.height * scaleY;

        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );

        const base64Image = canvas.toDataURL("image/jpeg", 0.92);
        onCropComplete(base64Image);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col relative max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-slate-800">
                        Adjust Character Photo
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

                {/* Crop Area */}
                <div className="relative bg-[#111] w-full flex-1 flex flex-col items-center justify-center p-4 min-h-[350px]">
                    <div className="relative flex items-center justify-center w-full h-full">
                        <ReactCrop
                            crop={crop}
                            onChange={(pixelCrop) => setCrop(pixelCrop)}
                            onComplete={(c) => setCompletedCrop(c)}
                            aspect={activePreset.aspect}
                            className="max-h-[65vh] max-w-full overflow-visible"
                        >
                            <img
                                ref={imgRef}
                                alt="Crop me"
                                src={imageSrc}
                                onLoad={onImageLoad}
                                className="max-h-[65vh] max-w-full object-contain"
                            />
                        </ReactCrop>
                    </div>
                </div>

                {/* Preset Selector Area */}
                <div className="bg-white border-t border-slate-100 p-4 shrink-0 z-10 flex flex-col items-center gap-3">
                    <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                        Drag handles to resize. Select a preset below:
                    </span>
                    <div className="flex justify-center items-center gap-2 sm:gap-4 w-full px-2">
                        {PRESETS.map((preset) => {
                            const Icon = preset.icon;
                            const isActive = activePreset.id === preset.id;
                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetChange(preset)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl transition-all flex-1 max-w-[90px]",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    )}
                                >
                                    <div className={cn("p-1.5 rounded-lg", isActive ? "bg-white shadow-sm" : "")}>
                                        <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                                    </div>
                                    <span className="text-[10px] font-semibold tracking-tight">{preset.label.split(' ')[0]}</span>
                                    {isActive && <span className="text-[8px] opacity-70 mt-[-2px]">{preset.label.split(' ')[1] || ""}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 shrink-0 z-10">
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isUploading}
                            className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isUploading || !completedCrop?.width || !completedCrop?.height}
                            className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
