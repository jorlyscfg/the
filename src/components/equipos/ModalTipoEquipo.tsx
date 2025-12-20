'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useNotification } from '@/components/notifications/NotificationContext';
import { createClient } from '@/lib/supabase/client';
import { Package, AlignLeft } from 'lucide-react';
import type { TipoEquipo } from './TipoEquipoCard';

interface ModalTipoEquipoProps {
    tipo: TipoEquipo | null;
    onClose: () => void;
    onGuardar: () => void;
}

export default function ModalTipoEquipo({
    tipo,
    onClose,
    onGuardar,
}: ModalTipoEquipoProps) {
    const [nombre, setNombre] = useState(tipo?.nombre || '');
    const [descripcion, setDescripcion] = useState(tipo?.descripcion || '');
    const [guardando, setGuardando] = useState(false);
    const { success: showSuccess, error: showError } = useNotification();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim()) {
            showError('El nombre es requerido');
            return;
        }

        try {
            setGuardando(true);

            if (tipo) {
                // Actualizar
                const { error } = await supabase
                    .from('tipos_equipos')
                    .update({
                        nombre: nombre.trim().toUpperCase(),
                        descripcion: descripcion.trim() || null,
                    })
                    .eq('id', tipo.id);

                if (error) throw error;
                showSuccess('Tipo de equipo actualizado');
            } else {
                // Crear
                const { error } = await supabase
                    .from('tipos_equipos')
                    .insert({
                        nombre: nombre.trim().toUpperCase(),
                        descripcion: descripcion.trim() || null,
                    });

                if (error) throw error;
                showSuccess('Tipo de equipo creado');
            }

            onGuardar();
        } catch (error: any) {
            console.error('Error:', error);
            if (error.code === '23505') {
                showError('Este tipo de equipo ya existe');
            } else {
                showError('Error al guardar');
            }
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`${tipo ? 'Editar' : 'Nuevo'} Tipo de Equipo`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                    label="Nombre del Tipo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: IMPRESORA"
                    required
                    autoFocus
                    icon={<Package className="w-4 h-4" />}
                />

                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                        Descripción
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                            <AlignLeft className="w-4 h-4" />
                        </div>
                        <textarea
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal min-h-[100px]"
                            placeholder="Descripción opcional (opcional)"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
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
                        isLoading={guardando}
                        disabled={guardando}
                        className="flex-1 font-bold uppercase text-[10px] tracking-widest h-11 shadow-md"
                    >
                        {guardando ? 'Guardando...' : 'Guardar'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
