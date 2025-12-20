'use client';

import { Calendar, DollarSign, Package, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Combobox } from '@/components/ui/Combobox';

interface OrdenFiltrosProps {
    filtros: {
        fechaInicio: string;
        fechaFin: string;
        tipoEquipo: string;
        costoMin: string;
        costoMax: string;
    };
    onFilterChange: (nuevosFiltros: any) => void;
    onClear: () => void;
    tiposEquipos: string[];
}

export default function OrdenFiltros({
    filtros,
    onFilterChange,
    onClear,
    tiposEquipos
}: OrdenFiltrosProps) {
    const handleChange = (campo: string, valor: string) => {
        onFilterChange({ ...filtros, [campo]: valor });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                        <Filter className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Filtros Avanzados</h3>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-primary-600"
                >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Limpiar
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                    label="Fecha Inicio"
                    type="date"
                    value={filtros.fechaInicio}
                    onChange={(e) => handleChange('fechaInicio', e.target.value)}
                    icon={<Calendar className="w-4 h-4" />}
                />

                <Input
                    label="Fecha Fin"
                    type="date"
                    value={filtros.fechaFin}
                    onChange={(e) => handleChange('fechaFin', e.target.value)}
                    icon={<Calendar className="w-4 h-4" />}
                />

                <div className="w-full">
                    <Combobox
                        label="Tipo de Equipo"
                        value={filtros.tipoEquipo === 'all' ? 'Todos los tipos' : filtros.tipoEquipo}
                        onChange={(val) => {
                            handleChange('tipoEquipo', val === 'Todos los tipos' ? 'all' : val);
                        }}
                        options={['Todos los tipos', ...tiposEquipos]}
                        icon={<Package className="w-4 h-4" />}
                        placeholder="Filtrar por tipo..."
                    />
                </div>

                <Input
                    label="Costo Mínimo"
                    type="number"
                    placeholder="0.00"
                    value={filtros.costoMin}
                    onChange={(e) => handleChange('costoMin', e.target.value)}
                    icon={<DollarSign className="w-4 h-4" />}
                />

                <Input
                    label="Costo Máximo"
                    type="number"
                    placeholder="0.00"
                    value={filtros.costoMax}
                    onChange={(e) => handleChange('costoMax', e.target.value)}
                    icon={<DollarSign className="w-4 h-4" />}
                />
            </div>
        </div>
    );
}
