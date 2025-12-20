'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useNotification } from '@/components/notifications/NotificationContext';
import { createClient } from '@/lib/supabase/client';
import { Package, Laptop, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MarcaModelo } from './MarcaModeloCard';
import type { TipoEquipo } from './TipoEquipoCard';

interface ModalMarcaModeloProps {
    marca: MarcaModelo | null;
    empresaId: string;
    onClose: () => void;
    onGuardar: () => void;
}

export default function ModalMarcaModelo({
    marca,
    empresaId,
    onClose,
    onGuardar,
}: ModalMarcaModeloProps) {
    const [tipoEquipoId, setTipoEquipoId] = useState(marca?.tipo_equipo_id || '');
    const [nombreMarca, setNombreMarca] = useState(marca?.marca || '');
    const [modelo, setModelo] = useState(marca?.modelo || '');
    const [tiposEquipos, setTiposEquipos] = useState<TipoEquipo[]>([]);
    const [guardando, setGuardando] = useState(false);
    const { success: showSuccess, error: showError } = useNotification();
    const supabase = createClient();

    useEffect(() => {
        cargarTiposEquipos();
    }, []);

    const cargarTiposEquipos = async () => {
        const { data } = await supabase
            .from('tipos_equipos')
            .select('*')
            .eq('activo', true)
            .eq('empresa_id', empresaId)
            .order('nombre');

        setTiposEquipos(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tipoEquipoId || !nombreMarca.trim() || !modelo.trim()) {
            showError('Todos los campos son requeridos');
            return;
        }

        try {
            setGuardando(true);

            if (marca) {
                // Actualizar
                const { error } = await supabase
                    .from('marcas_modelos')
                    .update({
                        tipo_equipo_id: tipoEquipoId,
                        marca: nombreMarca.trim().toUpperCase(),
                        modelo: modelo.trim().toUpperCase(),
                    })
                    .eq('id', marca.id);

                if (error) throw error;
                showSuccess('Marca/Modelo actualizado');
            } else {
                // Crear
                const { error } = await supabase
                    .from('marcas_modelos')
                    .insert({
                        tipo_equipo_id: tipoEquipoId,
                        marca: nombreMarca.trim().toUpperCase(),
                        modelo: modelo.trim().toUpperCase(),
                        empresa_id: empresaId,
                    });

                if (error) throw error;
                showSuccess('Marca/Modelo creado');
            }

            onGuardar();
        } catch (error: any) {
            console.error('Error:', error);
            if (error.code === '23505') {
                showError('Esta combinación ya existe');
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
            title={`${marca ? 'Editar' : 'Nueva'} Marca/Modelo`}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="w-full">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                        Tipo de Equipo *
                    </label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <Package className="w-4 h-4" />
                        </div>
                        <select
                            value={tipoEquipoId}
                            onChange={(e) => setTipoEquipoId(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-gray-700 bg-white"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {tiposEquipos.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <Input
                    label="Marca *"
                    value={nombreMarca}
                    onChange={(e) => setNombreMarca(e.target.value)}
                    placeholder="Ej: HP"
                    required
                    icon={<Tag className="w-4 h-4" />}
                />

                <Input
                    label="Modelo *"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Ej: LASERJET 1020"
                    required
                    icon={<Laptop className="w-4 h-4" />}
                />

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
