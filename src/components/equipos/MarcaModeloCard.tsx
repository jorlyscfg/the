'use client';

import { Laptop, Pencil, Trash2 } from 'lucide-react';
import {
    DataCard,
    DataCardHeader,
    DataCardContent,
    DataCardFooter,
    DataCardStat
} from '@/components/ui/DataCard';

export interface MarcaModelo {
    id: string;
    tipo_equipo_id: string;
    marca: string;
    modelo: string;
    activo: boolean;
    veces_usado: number;
    tipos_equipos?: {
        nombre: string;
    };
}

interface MarcaModeloCardProps {
    marca: MarcaModelo;
    onEdit: (marca: MarcaModelo) => void;
    onEliminar: (id: string) => void;
    onToggleActivo: (id: string, activo: boolean) => void;
}

export default function MarcaModeloCard({
    marca,
    onEdit,
    onEliminar,
    onToggleActivo,
}: MarcaModeloCardProps) {
    return (
        <DataCard>
            <DataCardHeader
                title={marca.marca}
                icon={<Laptop className="w-5 h-5" />}
                actions={
                    <>
                        <button
                            onClick={() => onEdit(marca)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(id) => onEliminar(marca.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                }
                subtitle={
                    <button
                        onClick={() => onToggleActivo(marca.id, marca.activo)}
                        className={`inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-md ${marca.activo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                        title={marca.activo ? 'Desactivar' : 'Activar'}
                    >
                        {marca.activo ? 'Activo' : 'Inactivo'}
                    </button>
                }
                subtitleClassName="mt-1"
            />
            <DataCardContent className="justify-between">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modelo</span>
                    <span className="text-sm font-bold text-gray-700">{marca.modelo}</span>
                </div>

                <div className="flex flex-col mt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tipo</span>
                    <span className="text-xs font-semibold text-gray-600 underline decoration-primary-200 underline-offset-2">
                        {marca.tipos_equipos?.nombre || '-'}
                    </span>
                </div>
            </DataCardContent>

            <DataCardFooter>
                <DataCardStat
                    icon={Laptop}
                    label="Veces Usado"
                    value={marca.veces_usado}
                    variant="primary"
                    className="w-full col-span-2"
                />
            </DataCardFooter>
        </DataCard>
    );
}
