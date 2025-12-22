'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useNotification } from '@/components/notifications';
import {
  Download,
  FileText,
  Filter,
  Calendar,
  TrendingUp,
  DollarSign,
  Package,
  FileSpreadsheet,
  Users,
  Clock,
} from 'lucide-react';
import type { ReporteOrdenesData } from './actions';
import {
  obtenerReporteOrdenes,
  obtenerEstadisticasPorTipoEquipo,
  obtenerTiempoPromedioReparacion,
  obtenerClientesFrecuentes,
} from './actions';
import {
  GraficaTiposEquipos,
  GraficaTiempoPromedio,
  TablaClientesFrecuentes,
} from '@/components/reportes/GraficasAvanzadas';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportesPage() {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState<ReporteOrdenesData | null>(null);
  const [tiposEquipo, setTiposEquipo] = useState<any[]>([]);
  const [tiempoPromedio, setTiempoPromedio] = useState<any>(null);
  const [clientesFrecuentes, setClientesFrecuentes] = useState<any[]>([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: 'TODOS',
  });

  const estados = [
    'TODOS',
    'PENDIENTES',
    'EN PROCESO',
    'LISTOS',
    'SIN SOLUCION',
    'ENTREGADOS',
  ];

  const cargarReporte = async () => {
    try {
      setLoading(true);


      const [
        reporteResult,
        tiposResult,
        tiempoResult,
        clientesResult,
      ] = await Promise.all([
        obtenerReporteOrdenes(
          filtros.fechaInicio || undefined,
          filtros.fechaFin || undefined,
          filtros.estado
        ),
        obtenerEstadisticasPorTipoEquipo(
          filtros.fechaInicio || undefined,
          filtros.fechaFin || undefined
        ),
        obtenerTiempoPromedioReparacion(
          filtros.fechaInicio || undefined,
          filtros.fechaFin || undefined
        ),
        obtenerClientesFrecuentes(10),
      ]);

      if (reporteResult.success && reporteResult.data) {
        setReporteData(reporteResult.data);
      } else {
        showError('Error al cargar reporte', reporteResult.error || 'Error desconocido');
      }

      if (tiposResult.success) {
        setTiposEquipo(tiposResult.estadisticas);
      }

      if (tiempoResult.success) {
        setTiempoPromedio(tiempoResult.estadisticas);
      }

      if (clientesResult.success) {
        setClientesFrecuentes(clientesResult.clientes);
      }
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      showError('Error al cargar reporte', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReporte();
  }, []);

  const exportarExcel = () => {
    if (!reporteData) return;

    try {
      const datosExcel = reporteData.ordenes.map((orden) => ({
        'Número de Orden': orden.numero_orden,
        'Fecha de Ingreso': new Date(orden.fecha_ingreso).toLocaleDateString('es-MX'),
        'Fecha de Salida': orden.fecha_salida
          ? new Date(orden.fecha_salida).toLocaleDateString('es-MX')
          : 'N/A',
        Cliente: orden.cliente,
        Teléfono: orden.telefono,
        'Tipo de Equipo': orden.tipo_equipo,
        'Marca/Modelo': orden.marca_modelo,
        Estado: orden.estado,
        'Costo Estimado': orden.costo_estimado || 0,
        'Costo Final': orden.costo_final || 0,
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosExcel);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes');

      // Agregar hoja de totales
      const totalesData = [
        { Concepto: 'Total de Órdenes', Valor: reporteData.totales.total_ordenes },
        { Concepto: 'Órdenes Completadas', Valor: reporteData.totales.ordenes_completadas },
        { Concepto: 'Órdenes Pendientes', Valor: reporteData.totales.ordenes_pendientes },
        {
          Concepto: 'Total Estimado',
          Valor: `$${reporteData.totales.total_estimado.toFixed(2)}`,
        },
        {
          Concepto: 'Total Final',
          Valor: `$${reporteData.totales.total_final.toFixed(2)}`,
        },
      ];

      const worksheetTotales = XLSX.utils.json_to_sheet(totalesData);
      XLSX.utils.book_append_sheet(workbook, worksheetTotales, 'Resumen');

      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `reporte_ordenes_${fecha}.xlsx`);

      success('Reporte exportado', 'El archivo Excel se descargó correctamente');
    } catch (err) {
      console.error('Error al exportar Excel:', err);
      showError('Error al exportar', 'No se pudo generar el archivo Excel');
    }
  };

  const exportarPDF = () => {
    if (!reporteData) return;

    try {
      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text('Reporte de Órdenes de Servicio', 14, 20);

      // Información del reporte
      doc.setFontSize(10);
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 14, 30);
      doc.text(`Total de Órdenes: ${reporteData.totales.total_ordenes}`, 14, 36);

      // Tabla de órdenes
      const datosTabla = reporteData.ordenes.map((orden) => [
        orden.numero_orden,
        new Date(orden.fecha_ingreso).toLocaleDateString('es-MX'),
        orden.cliente,
        orden.tipo_equipo,
        orden.estado,
        orden.costo_final ? `$${orden.costo_final.toFixed(2)}` : 'N/A',
      ]);

      autoTable(doc, {
        head: [['Orden', 'Fecha', 'Cliente', 'Equipo', 'Estado', 'Costo']],
        body: datosTabla,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      // Totales
      const finalY = (doc as any).lastAutoTable.finalY || 45;
      doc.setFontSize(10);
      doc.text('Resumen:', 14, finalY + 10);
      doc.text(
        `Total Estimado: $${reporteData.totales.total_estimado.toFixed(2)}`,
        14,
        finalY + 16
      );
      doc.text(
        `Total Final: $${reporteData.totales.total_final.toFixed(2)}`,
        14,
        finalY + 22
      );
      doc.text(
        `Completadas: ${reporteData.totales.ordenes_completadas}`,
        14,
        finalY + 28
      );
      doc.text(
        `Pendientes: ${reporteData.totales.ordenes_pendientes}`,
        14,
        finalY + 34
      );

      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`reporte_ordenes_${fecha}.pdf`);

      success('Reporte exportado', 'El archivo PDF se descargó correctamente');
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      showError('Error al exportar', 'No se pudo generar el archivo PDF');
    }
  };

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(monto);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Genera y exporta reportes de órdenes de servicio
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaInicio: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) =>
                  setFiltros({ ...filtros, fechaFin: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) =>
                  setFiltros({ ...filtros, estado: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {estados.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={cargarReporte}
              disabled={loading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Aplicar Filtros'}
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {reporteData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Órdenes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reporteData.totales.total_ordenes}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-primary-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {reporteData.totales.ordenes_completadas}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Estimado</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatearMoneda(reporteData.totales.total_estimado)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Final</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatearMoneda(reporteData.totales.total_final)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Acciones de Exportación */}
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Exportar Reporte
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={exportarExcel}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  Exportar a Excel
                </button>
                <button
                  onClick={exportarPDF}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  Exportar a PDF
                </button>
              </div>
            </div>

            {/* Vista Previa de Datos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Vista Previa ({reporteData.ordenes.length} órdenes)
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Orden
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Equipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Costo Final
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reporteData.ordenes.slice(0, 10).map((orden) => (
                      <tr key={orden.numero_orden} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {orden.numero_orden}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(orden.fecha_ingreso).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {orden.cliente}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {orden.tipo_equipo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {orden.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {orden.costo_final ? formatearMoneda(orden.costo_final) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reporteData.ordenes.length > 10 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando 10 de {reporteData.ordenes.length} órdenes. Exporta el
                    reporte para ver todos los datos.
                  </p>
                </div>
              )}
            </div>

            {/* Gráficas Adicionales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Tipos de Equipos Más Atendidos */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tipos de Equipos Más Atendidos
                  </h3>
                </div>
                <GraficaTiposEquipos data={tiposEquipo} />
              </div>

              {/* Tiempo Promedio de Reparación */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tiempo Promedio de Reparación
                  </h3>
                </div>
                {tiempoPromedio && tiempoPromedio.promedio_general_dias > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Promedio General</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {tiempoPromedio.promedio_general_dias.toFixed(1)} días
                    </p>
                  </div>
                )}
                <GraficaTiempoPromedio
                  data={tiempoPromedio?.por_tipo || []}
                />
              </div>
            </div>

            {/* Clientes Más Frecuentes */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Top 10 Clientes Más Frecuentes
                </h3>
              </div>
              <TablaClientesFrecuentes data={clientesFrecuentes} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
