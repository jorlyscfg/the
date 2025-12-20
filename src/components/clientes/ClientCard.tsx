'use client';

import { Phone, Mail, Calendar, FileText, Pencil, Trash2 } from 'lucide-react';
import type { Cliente } from '@/app/clientes/actions';
import {
    DataCard,
    DataCardHeader,
    DataCardContent,
    DataCardFooter,
    DataCardStat
} from '@/components/ui/DataCard';
import { Button } from '@/components/ui/Button';

interface ClientCardProps {
    cliente: Cliente;
    onEdit: (cliente: Cliente) => void;
    onDelete: (id: string, nombre: string) => void;
}

export default function ClientCard({
    cliente,
    onEdit,
    onDelete,
}: ClientCardProps) {
    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <DataCard>
            <DataCardHeader
                title={cliente.nombre_completo}
                subtitle={formatearFecha(cliente.created_at)}
                icon={
                    <span className="text-xl font-bold">
                        {cliente.nombre_completo.charAt(0).toUpperCase()}
                    </span>
                }
                actions={
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-100 shadow-sm rounded-lg"
                            onClick={() => onEdit(cliente)}
                            title="Editar"
                        >
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border border-gray-100 shadow-sm rounded-lg"
                            onClick={() => onDelete(cliente.id, cliente.nombre_completo)}
                            title="Eliminar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </>
                }
            />

            <DataCardContent>
                <a
                    href={`https://wa.me/${cliente.telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-gray-700 bg-white hover:bg-green-50 hover:text-green-700 hover:border-green-100 transition-colors px-2.5 py-2 rounded-lg border border-gray-100 group/link"
                >
                    <div className="h-7 w-7 bg-green-50 rounded flex items-center justify-center text-green-600">
                        <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-bold flex-1">{cliente.telefono}</span>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-green-600 opacity-60">WhatsApp</span>
                </a>

                {cliente.email && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50/50 px-2.5 py-2 rounded-lg border border-gray-100/30">
                        <div className="h-7 w-7 bg-white rounded flex items-center justify-center text-gray-400">
                            <Mail className="w-4 h-4" />
                        </div>
                        <span className="truncate font-semibold">{cliente.email}</span>
                    </div>
                )}
            </DataCardContent>

            <DataCardFooter>
                <DataCardStat
                    icon={FileText}
                    label="Órdenes"
                    value={cliente.ordenes_count}
                    variant="primary"
                />
                <DataCardStat
                    icon={Calendar}
                    label="Última"
                    value={cliente.ultima_orden ? formatearFecha(cliente.ultima_orden) : 'N/A'}
                />
            </DataCardFooter>
        </DataCard>
    );
}
