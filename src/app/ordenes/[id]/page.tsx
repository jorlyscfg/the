'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useNotification } from '@/components/notifications';
import {
  ArrowLeft,
  Calendar,
  User,
  Phone,
  Mail,
  Package,
  FileText,
  DollarSign,
  Clock,
  Image as ImageIcon,
  Edit,
  X,
  Printer,
  Plus,
} from 'lucide-react';
import type { OrdenDetalle } from '../actions';
import { obtenerOrdenPorId } from '../actions';
import RegistroPagos from '@/components/ordenes/RegistroPagos';
import HistorialPagos from '@/components/ordenes/HistorialPagos';
import ActualizarOrdenModal from '@/components/ordenes/ActualizarOrdenModal';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { Loading } from '@/components/ui/Loading';
import TicketModal from '@/components/ordenes/TicketModal';

export default function OrdenDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { success, error: showError } = useNotification();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showEstadoModal, setShowEstadoModal] = useState(false);
  const [showPagosModal, setShowPagosModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  useEffect(() => {
    cargarOrden();
  }, [params.id]);

  const cargarOrden = async () => {
    try {
      setLoading(true);
      const result = await obtenerOrdenPorId(params.id as string);

      if (result.success && result.orden) {
        setOrden(result.orden);
      } else {
        setError(result.error || 'Error al cargar la orden');
      }
    } catch (err) {
      setError('Error al cargar la orden');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeClass = (estado: string) => {
    const classes = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'EN_REVISION': 'bg-blue-100 text-blue-800',
      'EN_REPARACION': 'bg-orange-100 text-orange-800',
      'REPARADO': 'bg-green-100 text-green-800',
      'ENTREGADO': 'bg-gray-100 text-gray-800',
      'CANCELADO': 'bg-red-100 text-red-800',
    };
    return classes[estado as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearMoneda = (monto: number | null) => {
    if (monto === null) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(monto);
  };

  const abrirModalEstado = () => {
    setShowEstadoModal(true);
  };

  // Removed: handleActualizarEstado function

  const estados = [
    'PENDIENTE',
    'EN_REVISION',
    'EN_REPARACION',
    'REPARADO',
    'ENTREGADO',
  ];

  if (loading) {
    return <Loading mode="fullscreen" message="Cargando orden..." />;
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Error" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {error || 'Orden no encontrada'}
            </h3>
            <button
              onClick={() => router.push('/ordenes')}
              className="mt-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a Órdenes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        title={`Orden ${orden.numero_orden}`}
      />

      {/* Botón volver */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <button
          onClick={() => router.push('/ordenes')}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a Órdenes
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Encabezado con estado */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {orden.numero_orden}
            </h2>
            <div className="flex items-center gap-3">
              <span
                className={`px-4 py-2 text-sm font-semibold rounded-full ${getEstadoBadgeClass(
                  orden.estado
                )}`}
              >
                {orden.estado.replace('_', ' ')}
              </span>
              <button
                onClick={() => setShowTicketModal(true)}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                title="Ver Ticket"
              >
                <Printer className="w-4 h-4" />
                Ticket
              </button>
              <button
                onClick={abrirModalEstado}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Ingreso: {formatearFecha(orden.fecha_ingreso)}</span>
            </div>
            {orden.fecha_salida && (
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Salida: {formatearFecha(orden.fecha_salida)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Información del Cliente
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre</label>
              <p className="text-gray-900">{orden.cliente.nombre_completo}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  Teléfono
                </label>
                <p className="text-gray-900">{orden.cliente.telefono}</p>
              </div>
              {orden.cliente.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <p className="text-gray-900">{orden.cliente.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Información del Equipo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Información del Equipo
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo de Equipo</label>
                <p className="text-gray-900">{orden.tipo_equipo.nombre}</p>
              </div>
              {orden.marca_modelo && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Marca / Modelo</label>
                  <p className="text-gray-900">
                    {orden.marca_modelo.marca} {orden.marca_modelo.modelo}
                  </p>
                </div>
              )}
            </div>
            {orden.numero_serie && (
              <div>
                <label className="text-sm font-medium text-gray-500">Número de Serie</label>
                <p className="text-gray-900">{orden.numero_serie}</p>
              </div>
            )}
            {orden.accesorios && (
              <div>
                <label className="text-sm font-medium text-gray-500">Accesorios</label>
                <p className="text-gray-900">{orden.accesorios}</p>
              </div>
            )}
          </div>
        </div>

        {/* Problema y Diagnóstico */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Problema y Diagnóstico
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Problema Reportado</label>
              <p className="text-gray-900 whitespace-pre-wrap">{orden.problema_reportado}</p>
            </div>
            {orden.diagnostico && (
              <div>
                <label className="text-sm font-medium text-gray-500">Diagnóstico</label>
                <p className="text-gray-900 whitespace-pre-wrap">{orden.diagnostico}</p>
              </div>
            )}
            {orden.reparacion_realizada && (
              <div>
                <label className="text-sm font-medium text-gray-500">Reparación Realizada</label>
                <p className="text-gray-900 whitespace-pre-wrap">{orden.reparacion_realizada}</p>
              </div>
            )}
          </div>
        </div>

        {/* Costos y Pagos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Información de Costos y Pagos
            </h3>
            {orden.saldo_pendiente > 0 && (
              <button
                onClick={() => setShowPagosModal(true)}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Pago
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Costo Estimado</label>
              <p className="text-2xl font-bold text-gray-900">
                {formatearMoneda(orden.costo_estimado)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Costo Final</label>
              <p className="text-2xl font-bold text-green-600">
                {formatearMoneda(orden.costo_final)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Saldo Pendiente</label>
              <p className={`text-2xl font-bold ${orden.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatearMoneda(orden.saldo_pendiente)}
              </p>
            </div>
          </div>

          {/* Historial de Pagos */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Historial de Pagos</h4>
            <HistorialPagos ordenId={orden.id} />
          </div>
        </div>

        {/* Fotos del Equipo */}
        {orden.fotos.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Fotos del Equipo ({orden.fotos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {orden.fotos.map((foto) => (
                <div key={foto.id} className="relative aspect-square">
                  <img
                    src={foto.url_foto}
                    alt={`Foto ${foto.tipo_foto}`}
                    className="w-full h-full object-cover rounded-lg border border-gray-200"
                  />
                  <span className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {foto.tipo_foto}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historial de Cambios */}
        {orden.historial.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Historial de Cambios
            </h3>
            <div className="space-y-3">
              {orden.historial.map((item) => (
                <div key={item.id} className="border-l-4 border-primary-500 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">
                      {item.estado_anterior ? `${item.estado_anterior} → ` : ''}
                      {item.estado_nuevo}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatearFecha(item.created_at)}
                    </span>
                  </div>
                  {item.observaciones && (
                    <p className="text-sm text-gray-600">{item.observaciones}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Registro de Pagos */}
      <Modal
        isOpen={showPagosModal && !!orden}
        onClose={() => setShowPagosModal(false)}
        title="Registrar Pago"
      >
        {orden && (
          <RegistroPagos
            ordenId={orden.id}
            saldoPendiente={orden.saldo_pendiente}
            onPagoRegistrado={() => {
              setShowPagosModal(false);
              cargarOrden(); // Recargar la orden para actualizar el saldo
            }}
            onCerrar={() => setShowPagosModal(false)}
          />
        )}
      </Modal>

      {/* Modal de Actualización de Estado */}
      {orden && (
        <ActualizarOrdenModal
          isOpen={showEstadoModal}
          onClose={() => setShowEstadoModal(false)}
          onSuccess={cargarOrden}
          orden={orden}
        />
      )}

      {/* Modal de Ticket de Servicio */}
      {orden && (
        <TicketModal
          isOpen={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          orden={orden}
        />
      )}
    </div>
  );
}
