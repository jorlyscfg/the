'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmarEliminacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    nombre: string;
}

export default function ConfirmarEliminacionModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    nombre,
}: ConfirmarEliminacionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmar Eliminación"
        >
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <div className="h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-red-900 font-bold">¿Eliminar cliente?</h3>
                        <p className="text-red-700 text-sm leading-relaxed">
                            Estás por eliminar a <strong className="font-extrabold">{nombre}</strong>. Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>

                <p className="text-[11px] font-medium text-gray-400 italic px-1 leading-relaxed">
                    Solo puedes eliminar clientes que no tengan órdenes de servicio registradas. Si el cliente tiene historial, el sistema rechazará la eliminación por integridad de datos.
                </p>

                <div className="flex gap-3 justify-end pt-5 border-t border-gray-100 mt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="font-bold uppercase text-[10px] tracking-widest h-11"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onConfirm}
                        isLoading={isLoading}
                        disabled={isLoading}
                        className="font-bold uppercase text-[10px] tracking-widest h-11 px-6 shadow-md shadow-red-100"
                    >
                        Eliminar permanentemente
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
