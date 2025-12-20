'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
}

export function ConfirmarModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    title,
    description,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}: ConfirmarModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
        >
            <div className="space-y-6">
                <div className={`flex items-center gap-4 p-4 rounded-2xl border ${variant === 'danger'
                        ? 'bg-red-50 border-red-100'
                        : 'bg-primary-50 border-primary-100'
                    }`}>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${variant === 'danger'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-primary-100 text-primary-600'
                        }`}>
                        {variant === 'danger' ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className={`font-bold ${variant === 'danger' ? 'text-red-900' : 'text-primary-900'
                            }`}>
                            {title}
                        </h3>
                        <p className={`text-sm ${variant === 'danger' ? 'text-red-700' : 'text-primary-700'
                            }`}>
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="font-bold uppercase text-[10px] tracking-widest h-11"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onClick={onConfirm}
                        isLoading={isLoading}
                        disabled={isLoading}
                        className={`font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-md ${variant === 'danger' ? 'shadow-red-100' : 'shadow-primary-100'
                            }`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
