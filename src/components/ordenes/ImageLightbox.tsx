'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface Photo {
    id: string;
    url_foto: string;
    tipo_foto: string;
}

interface ImageLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    photos: Photo[];
    initialIndex?: number;
}

export default function ImageLightbox({
    isOpen,
    onClose,
    photos,
    initialIndex = 0
}: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialIndex]);

    const handleNext = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };

    const handlePrev = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };

    if (!isOpen || photos.length === 0) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all group"
            >
                <X className="w-6 h-6 group-hover:scale-110" />
            </button>

            {/* Navigation Buttons */}
            {photos.length > 1 && (
                <>
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 z-[110] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all group"
                    >
                        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-4 z-[110] p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all group"
                    >
                        <ChevronRight className="w-8 h-8 group-hover:translate-x-1" />
                    </button>
                </>
            )}

            {/* Image Container */}
            <div
                className="relative w-full h-full flex items-center justify-center p-4 md:p-12"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4">
                    <img
                        src={photos[currentIndex].url_foto}
                        alt={`Foto ${photos[currentIndex].tipo_foto}`}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500"
                    />

                    {/* Caption / Info */}
                    <div className="text-center">
                        <p className="text-white font-bold uppercase tracking-widest text-sm">
                            {photos[currentIndex].tipo_foto.replace('_', ' ')}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            Imagen {currentIndex + 1} de {photos.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Thumbnails (optional but nice) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-white/5 rounded-full backdrop-blur-md">
                {photos.map((_, idx) => (
                    <div
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-primary-500 w-4' : 'bg-white/20'}`}
                    />
                ))}
            </div>
        </div>
    );
}
