'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/notifications';
import { crearMarcaModelo } from '@/app/ordenes/actions';
import { Tag, Package, Save } from 'lucide-react';

interface NuevaMarcaModeloModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (marca: string, modelo: string) => void;
    initialMarca?: string;
}

export default function NuevaMarcaModeloModal({
    isOpen,
    onClose,
    onSuccess,
    initialMarca = ''
}: NuevaMarcaModeloModalProps) {
    const [marca, setMarca] = useState(initialMarca);
    const [modelo, setModelo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { success: showSuccess, error: showError } = useNotification();

    // Update marca if initialMarca changes when modal opens
    // (Optional, might need useEffect if using same instance, but usually remounts)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!marca.trim() || !modelo.trim()) return;

        setIsSubmitting(true);
        try {
            const res = await crearMarcaModelo(marca, modelo);
            if (res.success && res.marca && res.modelo) {
                showSuccess('Modelo creado', `${res.marca} - ${res.modelo} agregado al catálogo.`);
                onSuccess(res.marca, res.modelo);
                setModelo(''); // Reset only model usually, but keeping marca stickiness is fine
                // setMarca(''); // Optional reset
                onClose();
            } else {
                showError('Error', res.error || 'No se pudo crear la marca/modelo');
            }
        } catch (error) {
            console.error(error);
            showError('Error', 'Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nueva Marca y Modelo" maxWidth="max-w-md">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Registra una nueva combinación de marca y modelo en el sistema.
                    </p>
                    <div className="space-y-4">
                        <Input
                            label="Marca"
                            value={marca}
                            onChange={(e) => setMarca(e.target.value)}
                            placeholder="Ej: Epson"
                            icon={<Tag className="w-4 h-4" />}
                            required
                            autoFocus
                        />
                        <Input
                            label="Modelo"
                            value={modelo}
                            onChange={(e) => setModelo(e.target.value)}
                            placeholder="Ej: L3150"
                            icon={<Package className="w-4 h-4" />}
                            required
                        />
                    </div>
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
                        disabled={!marca.trim() || !modelo.trim() || isSubmitting}
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
