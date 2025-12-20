'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Phone, Mail, Save } from 'lucide-react';
import { crearCliente } from '@/app/clientes/actions';
import { useNotification } from '@/components/notifications/NotificationContext';

interface NuevoClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (nuevoCliente: any) => void;
}

export default function NuevoClienteModal({
    isOpen,
    onClose,
    onSuccess,
}: NuevoClienteModalProps) {
    const { success, error: showError } = useNotification();
    const [guardando, setGuardando] = useState(false);
    const [formData, setFormData] = useState({
        nombre_completo: '',
        telefono: '',
        email: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre_completo.trim() || !formData.telefono.trim()) {
            showError('Faltan campos', 'Por favor completa los campos obligatorios');
            return;
        }

        try {
            setGuardando(true);
            const result = await crearCliente(formData);

            if (result.success) {
                success('¡Éxito!', 'Cliente registrado correctamente');
                setFormData({ nombre_completo: '', telefono: '', email: '' });
                if (onSuccess) onSuccess(result.cliente);
                onClose();
            } else {
                showError('Error al registrar', result.error || 'Error desconocido');
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
            title="Registrar Nuevo Cliente"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-[11px] font-medium text-gray-500 italic px-1">
                    Ingresa la información del cliente para registrarlo en el sistema.
                </p>

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
                        Guardar Cliente
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
