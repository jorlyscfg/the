'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/notifications';
import { crearTipoEquipo } from '@/app/ordenes/actions';
import { Laptop, Save } from 'lucide-react';

interface NuevoTipoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (nuevoTipo: string) => void;
}

export default function NuevoTipoModal({
    isOpen,
    onClose,
    onSuccess,
}: NuevoTipoModalProps) {
    const [nombre, setNombre] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success: showSuccess, error: showError } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await crearTipoEquipo(nombre);
            if (res.success && res.tipo) {
                showSuccess('Tipo creado', `${res.tipo} ha sido agregado al catálogo.`);
                onSuccess(res.tipo);
                setNombre('');
                onClose();
            } else {
                showError('Error', res.error || 'No se pudo crear el tipo de equipo');
            }
        } catch (error) {
            console.error(error);
            showError('Error', 'Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Tipo de Equipo" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Agrega un nuevo tipo de equipo al catálogo (ej. Impresora 3D, Plotter, Reloj).
                    </p>
                    <Input
                        label="Nombre del Tipo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Impresora 3D"
                        icon={<Laptop className="w-4 h-4" />}
                        required
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        isLoading={isSubmitting}
                        disabled={!nombre.trim() || isSubmitting}
                        className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                        Guardar
                        <Save className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
