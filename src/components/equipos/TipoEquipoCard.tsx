'use client';

import { Package, Pencil, Trash2 } from 'lucide-react';
import {
    DataCard,
    DataCardHeader,
    DataCardContent,
    DataCardFooter
} from '@/components/ui/DataCard';
import { Button } from '@/components/ui/Button';

export interface TipoEquipo {
    id: string;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    veces_usado: number;
    created_at: string;
}

interface TipoEquipoCardProps {
    tipo: TipoEquipo;
    onEdit: (tipo: TipoEquipo) => void;
    onEliminar: (id: string) => void;
    onToggleActivo: (id: string, activo: boolean) => void;
}

export default function TipoEquipoCard({
    tipo,
    onEdit,
    onEliminar,
    onToggleActivo,
}: TipoEquipoCardProps) {
    return (
        <DataCard>
            <DataCardHeader
                title={tipo.nombre}
                icon={<Package className="w-5 h-5" />}
                actions={
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-100 shadow-sm rounded-lg"
                            onClick={() => onEdit(tipo)}
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border border-gray-100 shadow-sm rounded-lg"
                            onClick={() => onEliminar(tipo.id)}
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </>
                }
                subtitle={
                    <button
                        onClick={() => onToggleActivo(tipo.id, tipo.activo)}
                        className={`text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded ${tipo.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {tipo.activo ? 'Activo' : 'Inactivo'}
                    </button>
                }
                subtitleClassName="mt-1"
            />

            <DataCardContent className="justify-between">
                {tipo.descripcion ? (
                    <p className="text-xs text-gray-600 line-clamp-2 italic">
                        {tipo.descripcion}
                    </p>
                ) : (
                    <p className="text-xs text-gray-400 italic">Sin descripción</p>
                )}
            </DataCardContent>

            <DataCardFooter className="grid-cols-1 pt-0 mt-0">
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary-50/50 border border-primary-100/20">
                    <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Veces Usado</span>
                    <span className="text-sm font-black text-primary-900">{tipo.veces_usado}</span>
                </div>
            </DataCardFooter>
        </DataCard>
    );
}
