'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Trash2, X } from 'lucide-react';

interface FotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    fotoUrl: string;
    onDelete: () => void;
}

export default function FotoModal({
    isOpen,
    onClose,
    fotoUrl,
    onDelete,
}: FotoModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
            >
                <X className="w-8 h-8" />
            </button>

            <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center">
                <img
                    src={fotoUrl}
                    alt="Vista previa"
                    className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl mb-6"
                />

                <Button
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                    variant="ghost"
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-3 h-auto text-base font-bold uppercase tracking-wider gap-2 rounded-xl backdrop-blur-md"
                >
                    <Trash2 className="w-5 h-5" />
                    Eliminar Foto
                </Button>
            </div>
        </div>,
        document.body
    );
}

