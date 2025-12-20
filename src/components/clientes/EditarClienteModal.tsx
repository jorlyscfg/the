'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Phone, Mail, Save } from 'lucide-react';
import { actualizarCliente } from '@/app/clientes/actions';
import { useNotification } from '@/components/notifications/NotificationContext';
import type { Cliente } from '@/app/clientes/actions';

interface EditarClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    cliente: Cliente | null;
    onSuccess?: () => void;
}

export default function EditarClienteModal({
    isOpen,
    onClose,
    cliente,
    onSuccess,
}: EditarClienteModalProps) {
    const { success, error: showError } = useNotification();
    const [guardando, setGuardando] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        email: '',
    });

    useEffect(() => {
        if (cliente) {
            setFormData({
                nombre_completo: cliente.nombre_completo,
                telefono: cliente.telefono,
                email: cliente.email || '',
            });
        }
    }, [cliente]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!cliente) return;

        if (!formData.nombre_completo.trim() || !formData.telefono.trim()) {
            showError('Faltan campos', 'Por favor completa los campos obligatorios');
            return;
        }

        try {
            setGuardando(true);
            const result = await actualizarCliente({
                id: cliente.id,
                ...formData
            });

            if (result.success) {
                success('¡Actualizado!', 'La información del cliente ha sido actualizada');
                if (onSuccess) onSuccess();
                onClose();
            } else {
                showError('Error al actualizar', result.error || 'Error desconocido');
            }
        } catch (err) {
            console.error('Error:', err);
            showError('Error', 'Ocurrió un error inesperado');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Cliente"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <Input
                        label="Nombre Completo"
                        placeholder="Ej: Juan Pérez García"
                        value={formData.nombre_completo}
                        onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                        required
                        icon={<User className="w-4 h-4" />}
                    />

                    <Input
                        label="Teléfono"
                        placeholder="Ej: 3331234567"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        required
                        type="tel"
                        helperText="10 dígitos sin espacios ni guiones"
                        icon={<Phone className="w-4 h-4" />}
                    />

                    <Input
                        label="Email (opcional)"
                        placeholder="Ej: cliente@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        type="email"
                        icon={<Mail className="w-4 h-4" />}
                    />
                </div>

                <div className="flex gap-3 justify-end pt-5 border-t border-gray-100 mt-6">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={guardando}
                        className="font-bold uppercase text-[10px] tracking-widest h-11"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        isLoading={guardando}
                        disabled={guardando}
                        className="gap-2 font-bold uppercase text-[10px] tracking-widest h-11 px-8 shadow-md"
                    >
                        {!guardando && <Save className="w-5 h-5" />}
                        Guardar Cambios
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
