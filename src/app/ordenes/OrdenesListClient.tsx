'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, Filter, X } from 'lucide-react';
import type { Orden } from './actions';

// UI Components
import { Button } from '@/components/ui/Button';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';

// Orden Components
import OrdenCard from '@/components/ordenes/OrdenCard';
import OrdenFiltros from '@/components/ordenes/OrdenFiltros';
import { useDebounce } from '@/hooks/useDebounce';

interface OrdenesListClientProps {
    initialOrdenes: Orden[];
}

export default function OrdenesListClient({ initialOrdenes: ordenes }: OrdenesListClientProps) {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [busqueda, setBusqueda] = useState(initialQuery);
    const debouncedBusqueda = useDebounce(busqueda, 400);
    const [statusFilter, setStatusFilter] = useState('all');
    const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
    const [filtrosAvanzados, setFiltrosAvanzados] = useState({
        fechaInicio: '',
        fechaFin: '',
        tipoEquipo: 'all',
        costoMin: '',
        costoMax: '',
    });

    // Búsqueda Inteligente Multitérmino
    const ordenesFiltradas = ordenes.filter((orden) => {
        // Términos de búsqueda
        const terminos = debouncedBusqueda.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
        const matchSearch = terminos.length === 0 || terminos.every(t =>
            orden.numero_orden.toLowerCase().includes(t) ||
            orden.id.toLowerCase().includes(t) || // Permitir búsqueda por UUID (escáner)
            orden.cliente.nombre_completo.toLowerCase().includes(t) ||
            orden.cliente.telefono.includes(t) ||
            orden.tipo_equipo.nombre.toLowerCase().includes(t) ||
            orden.marca_modelo?.marca.toLowerCase().includes(t) ||
            orden.marca_modelo?.modelo.toLowerCase().includes(t)
        );

        const matchStatus = statusFilter === 'all' || orden.estado === statusFilter;

        // Filtros avanzados
        const matchFechaInicio = !filtrosAvanzados.fechaInicio ||
            new Date(orden.fecha_ingreso) >= new Date(filtrosAvanzados.fechaInicio);

        const matchFechaFin = !filtrosAvanzados.fechaFin ||
            new Date(orden.fecha_ingreso) <= new Date(filtrosAvanzados.fechaFin);

        const matchTipoEquipo = filtrosAvanzados.tipoEquipo === 'all' ||
            orden.tipo_equipo.nombre === filtrosAvanzados.tipoEquipo;

        const matchCostoMin = !filtrosAvanzados.costoMin ||
            (orden.costo_final !== null && orden.costo_final !== undefined && orden.costo_final >= parseFloat(filtrosAvanzados.costoMin)) ||
            (orden.costo_estimado !== null && orden.costo_estimado !== undefined && orden.costo_estimado >= parseFloat(filtrosAvanzados.costoMin));

        const matchCostoMax = !filtrosAvanzados.costoMax ||
            (orden.costo_final !== null && orden.costo_final !== undefined && orden.costo_final <= parseFloat(filtrosAvanzados.costoMax)) ||
            (orden.costo_estimado !== null && orden.costo_estimado !== undefined && orden.costo_estimado <= parseFloat(filtrosAvanzados.costoMax));

        return matchSearch && matchStatus && matchFechaInicio && matchFechaFin &&
            matchTipoEquipo && matchCostoMin && matchCostoMax;
    });

    const limpiarFiltros = () => {
        setBusqueda('');
        setStatusFilter('all');
        setFiltrosAvanzados({
            fechaInicio: '',
            fechaFin: '',
            tipoEquipo: 'all',
            costoMin: '',
            costoMax: '',
        });
    };

    const tiposEquiposUnicos = Array.from(
        new Set(ordenes.map((o) => o.tipo_equipo.nombre))
    ).sort();

    return (
        <>
            {/* Herramientas de búsqueda y acción - Sticky */}
            <div className="sticky top-16 z-20 bg-gray-50/80 backdrop-blur-md -mx-4 px-4 py-2 mb-3 border-b border-gray-100 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:px-0 sm:mx-0 sm:py-0 sm:mb-4">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-row gap-2 items-center">
                        <div className="relative flex-1 group">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${busqueda ? 'text-primary-500' : 'text-gray-400 group-focus-within:text-primary-500'}`} />
                            <input
                                type="text"
                                placeholder="Buscar orden, cliente o equipo..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 h-12 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
                            />
                        </div>

                        <Button
                            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
                            variant={mostrarFiltrosAvanzados ? 'primary' : 'ghost'}
                            className={`h-12 w-12 rounded-xl shadow-md p-0 shrink-0 flex items-center justify-center transition-all ${mostrarFiltrosAvanzados ? 'bg-primary-600 text-white' : 'bg-white text-gray-400 hover:text-primary-600'
                                }`}
                            title="Filtros avanzados"
                        >
                            <Filter className="w-6 h-6" strokeWidth={2.5} />
                        </Button>

                        <Link href="/ordenes/nueva">
                            <Button
                                className="h-12 w-12 rounded-xl shadow-md p-0 shrink-0 bg-primary-600 hover:bg-primary-700 flex items-center justify-center translate-y-0 active:translate-y-0.5 transition-transform"
                                title="Nueva Orden"
                            >
                                <Plus className="w-8 h-8" strokeWidth={2.5} />
                            </Button>
                        </Link>
                    </div>

                    {/* Quick Status Filter Tabs */}
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 w-full overflow-x-auto no-scrollbar h-11 shrink-0">
                        {[
                            { val: 'all', label: 'Todas', count: ordenes.length },
                            { val: 'PENDIENTES', label: 'Pendientes', count: ordenes.filter(o => o.estado === 'PENDIENTES').length },
                            { val: 'EN PROCESO', label: 'En Proceso', count: ordenes.filter(o => o.estado === 'EN PROCESO').length },
                            { val: 'LISTOS', label: 'Listos', count: ordenes.filter(o => o.estado === 'LISTOS').length },
                            { val: 'SIN SOLUCION', label: 'Sin Solución', count: ordenes.filter(o => o.estado === 'SIN SOLUCION').length },
                            { val: 'ENTREGADOS', label: 'Entregados', count: ordenes.filter(o => o.estado === 'ENTREGADOS').length }
                        ].map((tab) => (
                            <button
                                key={tab.val}
                                onClick={() => setStatusFilter(tab.val)}
                                className={`flex-1 min-w-fit px-4 py-0 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2 ${statusFilter === tab.val
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${statusFilter === tab.val
                                        ? 'bg-white/20 text-white'
                                        : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filtros Avanzados Expandibles */}
            {mostrarFiltrosAvanzados && (
                <OrdenFiltros
                    filtros={filtrosAvanzados}
                    onFilterChange={setFiltrosAvanzados}
                    onClear={limpiarFiltros}
                    tiposEquipos={tiposEquiposUnicos}
                />
            )}

            {/* Lista de Órdenes */}
            {ordenesFiltradas.length > 0 ? (
                <ResponsiveGrid>
                    {ordenesFiltradas.map((orden) => (
                        <OrdenCard key={orden.id} orden={orden} />
                    ))}
                </ResponsiveGrid>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Search className="w-10 h-10" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 uppercase tracking-tight">No hay órdenes</h3>
                    <p className="text-gray-500 max-w-xs text-sm">
                        {ordenes.length === 0
                            ? 'Aún no has registrado ninguna orden de servicio.'
                            : `No encontramos resultados para tu búsqueda.`}
                    </p>
                    {ordenes.length === 0 ? (
                        <Link href="/ordenes/nueva" className="mt-6">
                            <Button className="px-8 font-bold uppercase text-[10px] tracking-widest h-11">
                                Crear mi primera orden
                            </Button>
                        </Link>
                    ) : (
                        <Button onClick={limpiarFiltros} variant="ghost" className="mt-4 text-primary-600 font-bold uppercase text-[10px] tracking-widest">
                            Limpiar Filtros
                        </Button>
                    )}
                </div>
            )}
        </>
    );
}
