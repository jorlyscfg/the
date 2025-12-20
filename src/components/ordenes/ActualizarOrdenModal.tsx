'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/notifications';
import { actualizarEstadoOrden, type Orden } from '@/app/ordenes/actions';
import { FileText, DollarSign, CheckCircle2, ClipboardList } from 'lucide-react';
import { StatusSelector } from './StatusSelector';

interface ActualizarOrdenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    orden: any;
}

export default function ActualizarOrdenModal({
    isOpen,
    onClose,
    onSuccess,
    orden,
}: ActualizarOrdenModalProps) {
    const { success: showSuccess, error: showError } = useNotification();
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        nuevoEstado: '',
        observaciones: '',
        diagnostico: '',
        reparacionRealizada: '',
        costoEstimado: '',
        costoFinal: '',
    });

    useEffect(() => {
        if (isOpen && orden) {
            setFormData({
                nuevoEstado: orden.estado,
                observaciones: orden.observaciones || '',
                diagnostico: orden.diagnostico || '',
                reparacionRealizada: orden.reparacion_realizada || '',
                costoEstimado: orden.costo_estimado?.toString() || '',
                costoFinal: orden.costo_final?.toString() || '',
            });
        }
    }, [isOpen, orden]);

    const handleActualizarEstado = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const result = await actualizarEstadoOrden({
                ordenId: orden.id,
                nuevoEstado: formData.nuevoEstado,
                observaciones: formData.observaciones || undefined,
                diagnostico: formData.diagnostico || undefined,
                reparacionRealizada: formData.reparacionRealizada || undefined,
                costoEstimado: formData.costoEstimado ? parseFloat(formData.costoEstimado) : undefined,
                costoFinal: formData.costoFinal ? parseFloat(formData.costoFinal) : undefined,
            });

            if (result.success) {
                showSuccess('Estado actualizado', 'La orden se actualizó correctamente');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                showError('Error al actualizar', result.error || 'No se pudo actualizar la orden');
            }
        } catch (err) {
            console.error('Error al actualizar orden:', err);
            showError('Error', 'Ocurrió un error inesperado');
        } finally {
            setUpdating(false);
        }
    };

    const statusOptions = [
        { value: 'PENDIENTE', label: 'Pendiente' },
        { value: 'EN_REVISION', label: 'En Revisión' },
        { value: 'EN_REPARACION', label: 'En Proceso' },
        { value: 'REPARADO', label: 'Lista / Reparada' },
        { value: 'ENTREGADO', label: 'Entregada' },
    ];

    const getEstadoBadgeClass = (estado: string) => {
        const classes = {
            'PENDIENTE': 'bg-yellow-100 text-yellow-700',
            'EN_REVISION': 'bg-blue-100 text-blue-700',
            'EN_REPARACION': 'bg-orange-100 text-orange-700',
            'REPARADO': 'bg-green-100 text-green-700',
            'ENTREGADO': 'bg-gray-100 text-gray-600',
            'CANCELADO': 'bg-red-100 text-red-700',
        };
        return classes[estado as keyof typeof classes] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Actualizar Orden ${orden.numero_orden}`}
        >
            <form onSubmit={handleActualizarEstado} className="space-y-4">
                <div className="w-full">
                    <StatusSelector
                        value={formData.nuevoEstado}
                        onChange={(val) => setFormData({ ...formData, nuevoEstado: val })}
                        options={statusOptions}
                        getBadgeClass={getEstadoBadgeClass}
                        disabled={updating}
                        variant="form"
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        label="Estado *"
                    />
                </div>

                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                        Observaciones
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                            <FileText className="w-4 h-4" />
                        </div>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal min-h-[80px]"
                            placeholder="Notas u observaciones adicionales..."
                        />
                    </div>
                </div>

                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                        Diagnóstico Técnico
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                            <ClipboardList className="w-4 h-4" />
                        </div>
                        <textarea
                            value={formData.diagnostico}
                            onChange={(e) => setFormData({ ...formData, diagnostico: e.target.value })}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal min-h-[80px]"
                            placeholder="¿Cuál es el problema identificado?"
                        />
                    </div>
                </div>

                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                        Reparación Realizada
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <textarea
                            value={formData.reparacionRealizada}
                            onChange={(e) => setFormData({ ...formData, reparacionRealizada: e.target.value })}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal min-h-[80px]"
                            placeholder="¿Qué reparación se realizó?"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Costo Estimado"
                        type="number"
                        step="0.01"
                        value={formData.costoEstimado}
                        onChange={(e) => setFormData({ ...formData, costoEstimado: e.target.value })}
                        icon={<DollarSign className="w-4 h-4" />}
                    />
                    <Input
                        label="Costo Final"
                        type="number"
                        step="0.01"
                        value={formData.costoFinal}
                        onChange={(e) => setFormData({ ...formData, costoFinal: e.target.value })}
                        icon={<DollarSign className="w-4 h-4" />}
                    />
                </div>

                <div className="flex gap-3 pt-5 border-t border-gray-100 mt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1 font-bold uppercase text-[10px] tracking-widest h-11"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={updating}
                        isLoading={updating}
                        className="flex-1 font-bold uppercase text-[10px] tracking-widest h-11 shadow-md"
                    >
                        Actualizar Orden
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
