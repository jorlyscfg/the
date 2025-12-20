'use client';

import {
    ClipboardList,
    Users,
    Settings,
    BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import {
    GraficaOrdenesBarras,
    GraficaIngresosLinea,
    GraficaEstadosPie,
} from '@/components/dashboard/GraficaOrdenes';
import type { DashboardStats, EstadisticasMensuales, EstadisticasEstados } from '@/app/actions';

interface DashboardUIProps {
    stats: DashboardStats;
    estadisticasMensuales: EstadisticasMensuales[];
    estadisticasEstados: EstadisticasEstados[];
}

export default function DashboardUI({
    stats,
    estadisticasMensuales,
    estadisticasEstados,
}: DashboardUIProps) {
    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
            {/* Stats - Optimizado para móvil: 4 cards en una fila */}
            <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-8">
                <div className="bg-white rounded-lg shadow p-3 sm:p-6 transition-all hover:shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                        <div className="text-center sm:text-left w-full">
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Órdenes Activas</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {stats.ordenesActivas}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-3 sm:p-6 transition-all hover:shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                        <div className="text-center sm:text-left w-full">
                            <p className="text-xs sm:text-sm text-gray-600 truncate">En Reparación</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {stats.enReparacion}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-3 sm:p-6 transition-all hover:shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                        <div className="text-center sm:text-left w-full">
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Completadas Hoy</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {stats.completadasHoy}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-3 sm:p-6 transition-all hover:shadow-md border border-gray-100">
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                        <div className="text-center sm:text-left w-full">
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Total Clientes</p>
                            <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {stats.totalClientes}
                            </p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Acciones Rápidas
                </h2>
                <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            href="/ordenes/nueva"
                            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors shadow-sm hover:shadow-md"
                        >
                            + Nueva Orden de Servicio
                        </Link>
                        <Link
                            href="/clientes/nuevo"
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg text-center transition-colors shadow-sm hover:shadow-md"
                        >
                            + Nuevo Cliente
                        </Link>
                    </div>
                </div>
            </div>

            {/* Gráficas y Análisis */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Análisis de Órdenes ({new Date().getFullYear()})
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfica de Órdenes por Mes */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">
                                Órdenes por Mes
                            </h3>
                            <GraficaOrdenesBarras data={estadisticasMensuales} />
                        </div>

                        {/* Gráfica de Ingresos */}
                        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                            <h3 className="text-base font-semibold text-gray-900 mb-4">
                                Ingresos Mensuales
                            </h3>
                            <GraficaIngresosLinea data={estadisticasMensuales} />
                        </div>
                    </div>
                </div>

                {/* Gráfica de Estados */}
                {estadisticasEstados.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">
                            Distribución por Estado
                        </h3>
                        <GraficaEstadosPie data={estadisticasEstados} />
                    </div>
                )}
            </div>
        </main>
    );
}
