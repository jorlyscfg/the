'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Calendar,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Wrench,
  DollarSign,
  Phone,
  MessageSquare,
  Clipboard,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrdenConsulta {
  id: string;
  numero_orden: string;
  estado: string;
  fecha_ingreso: string;
  fecha_promesa_entrega: string | null;
  tipo_equipo: {
    nombre: string;
  };
  marca_modelo: {
    marca: string;
    modelo: string;
  } | null;
  numero_serie: string | null;
  problema_reportado: string;
  diagnostico: string | null;
  observaciones: string | null;
  accesorios: string | null;
  saldo_pendiente: number;
  costo_estimado: number | null;
  costo_final: number | null;
  cliente: {
    nombre_completo: string;
  };
  sucursal: {
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    whatsapp: string | null;
    empresa: {
      nombre: string;
      logo_url: string | null;
      email: string | null;
      sitio_web: string | null;
    };
  } | null;
}

export default function ConsultaOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const [orden, setOrden] = useState<OrdenConsulta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.numero) {
      cargarOrden();
    }
  }, [params.numero]);

  const cargarOrden = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from('ordenes_servicio')
        .select(`
          id,
          numero_orden,
          estado,
          fecha_ingreso,
          fecha_promesa_entrega,
          problema_reportado,
          diagnostico,
          observaciones,
          numero_serie,
          accesorios,
          saldo_pendiente,
          costo_estimado,
          costo_final,
          tipo_equipo:tipos_equipos(nombre),
          marca_modelo:marcas_modelos(marca, modelo),
          cliente:clientes(nombre_completo),
          sucursal:sucursales(
            nombre,
            direccion,
            telefono,
            whatsapp,
            empresa:empresas(
              nombre,
              logo_url,
              email,
              sitio_web
            )
          )
        `)
        .eq('numero_orden', params.numero)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          setError('Orden no encontrada. Verifica el número de orden.');
        } else {
          setError('Error al consultar la orden');
        }
        return;
      }

      setOrden(data as any);
    } catch (err) {
      console.error('Error al cargar orden:', err);
      setError('Error al cargar la orden');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoInfo = (estado: string) => {
    const estados = {
      'PENDIENTE': {
        label: 'Pendiente de Revisión',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock,
        description: 'Tu equipo ha sido recibido y está en espera de revisión técnica.'
      },
      'EN_REVISION': {
        label: 'En Revisión',
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: AlertCircle,
        description: 'Nuestro técnico está revisando tu equipo para determinar la falla.'
      },
      'EN_REPARACION': {
        label: 'En Reparación',
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: Wrench,
        description: 'Estamos trabajando en la reparación de tu equipo.'
      },
      'REPARADO': {
        label: 'Reparado',
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle,
        description: 'Tu equipo está listo para ser entregado. ¡Pasa a recogerlo!'
      },
      'ENTREGADO': {
        label: 'Entregado',
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: CheckCircle,
        description: 'Tu equipo ha sido entregado exitosamente.'
      },
    };
    return estados[estado as keyof typeof estados] || estados['PENDIENTE'];
  };

  const formatearMoneda = (monto: number | null) => {
    if (monto === null) return 'Por determinar';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(monto);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Consultando orden {params.numero}...</p>
        </div>
      </div>
    );
  }

  if (error || !orden) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center max-w-md">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Orden no encontrada'}
          </h3>
          <p className="text-gray-600 mb-6 font-medium">
            Verifica que el número de orden sea correcto
          </p>
          <button
            onClick={() => router.push('/consulta')}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl transition-all font-bold shadow-lg shadow-primary-100 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver a consultar
          </button>
        </div>
      </div>
    );
  }

  const estadoInfo = getEstadoInfo(orden.estado);
  const IconoEstado = estadoInfo.icon;
  const nombreEmpresa = orden.sucursal?.empresa.nombre || 'TH EMPRESARIAL';
  const logoUrl = orden.sucursal?.empresa.logo_url;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full p-4 py-8 flex-1">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-4 h-24 w-24 flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={nombreEmpresa} className="max-h-full max-w-full object-contain" />
            ) : (
              <Package className="w-12 h-12 text-primary-600" />
            )}
          </div>
          <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight text-center">
            Estado de Servicio
          </h1>
          <p className="text-xs text-primary-600 font-bold tracking-widest uppercase mt-1">
            {nombreEmpresa}
          </p>
          {orden.sucursal?.nombre && (
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{orden.sucursal.nombre}</p>
          )}
        </div>

        {/* Card Principal: Estado y Fechas */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-white">
          <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-5">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Número de Orden</p>
              <h2 className="text-2xl font-black text-gray-900">#{orden.numero_orden}</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                <p className="text-sm font-black text-gray-700 uppercase tracking-wide">
                  {orden.cliente.nombre_completo}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/consulta')}
              className="text-[10px] font-black text-primary-600 hover:bg-primary-50 uppercase border-2 border-primary-100 px-4 py-2 rounded-xl transition-all"
            >
              Nueva Consulta
            </button>
          </div>

          <div className={`border-2 rounded-2xl p-6 ${estadoInfo.color}`}>
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0 bg-white/50 p-3 rounded-xl">
                <IconoEstado className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">{estadoInfo.label}</h2>
                <p className="text-sm mt-1 font-medium opacity-90">{estadoInfo.description}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ingreso</p>
                <p className="text-sm font-bold text-gray-700">
                  {format(new Date(orden.fecha_ingreso), "dd/MM/yyyy", { locale: es })}
                </p>
              </div>
            </div>
            {orden.fecha_promesa_entrega && (
              <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Clock className="w-4 h-4 text-primary-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-primary-400 uppercase tracking-widest">Entrega Estimada</p>
                  <p className="text-sm font-bold text-primary-700">
                    {format(new Date(orden.fecha_promesa_entrega), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información del Equipo Detallada */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-white">
          <div className="flex items-center gap-2 mb-6 px-1">
            <Package className="w-4 h-4 text-gray-400" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información del Equipo</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Package className="w-3 h-3" /> Tipo / Modelo
                </p>
                <p className="text-sm font-black text-gray-900 uppercase">
                  {orden.tipo_equipo.nombre}
                </p>
                <p className="text-xs font-bold text-primary-600 mt-0.5 uppercase tracking-wider">
                  {orden.marca_modelo ? `${orden.marca_modelo.marca} ${orden.marca_modelo.modelo}` : 'Genérico'}
                </p>
              </div>

              {(orden.numero_serie || orden.accesorios) && (
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                  {orden.numero_serie && (
                    <div className="mb-3">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Hash className="w-3 h-3" /> N/S
                      </p>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{orden.numero_serie}</p>
                    </div>
                  )}
                  {orden.accesorios && (
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Clipboard className="w-3 h-3" /> Accesorios
                      </p>
                      <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">{orden.accesorios}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-orange-50/30 rounded-2xl border border-orange-100">
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Falla Reportada
                </p>
                <p className="text-sm text-gray-800 font-medium leading-relaxed italic border-l-4 border-orange-200 pl-4">
                  "{orden.problema_reportado}"
                </p>
              </div>

              {orden.observaciones && (
                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-200 border-dashed">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Clipboard className="w-3 h-3" /> Observaciones
                  </p>
                  <p className="text-xs text-gray-600 font-medium leading-normal">{orden.observaciones}</p>
                </div>
              )}
            </div>
          </div>

          {orden.diagnostico && (
            <div className="mt-8 p-6 bg-primary-50/30 rounded-2xl border-2 border-dashed border-primary-100">
              <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-2">Diagnóstico del Técnico</p>
              <p className="text-sm text-gray-800 font-bold leading-relaxed">{orden.diagnostico}</p>
            </div>
          )}
        </div>

        {/* Resumen de Cuenta */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border border-white overflow-hidden">
          <div className="flex items-center gap-2 mb-6 px-1">
            <DollarSign className="w-4 h-4 text-primary-600" />
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen de Cuenta</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costo Total</p>
              <p className="text-xl font-black text-gray-900">{formatearMoneda(orden.costo_final || orden.costo_estimado)}</p>
            </div>
            <div className="p-5 bg-white rounded-2xl border-2 border-primary-50 shadow-inner">
              <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1 font-black">Restante</p>
              <p className={`text-xl font-black ${orden.saldo_pendiente > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {formatearMoneda(orden.saldo_pendiente)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer info - Contacto Directo */}
        <div className="text-center p-8 border-t border-gray-200 mt-auto bg-white/50 rounded-b-3xl">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mb-6">{nombreEmpresa}</p>

          <div className="flex flex-col gap-4">
            {orden.sucursal?.direccion && (
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider max-w-xs mx-auto">{orden.sucursal.direccion}</p>
            )}

            <div className="flex items-center justify-center gap-3 mt-2">
              {orden.sucursal?.telefono && (
                <a
                  href={`tel:${orden.sucursal.telefono}`}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-gray-100 text-gray-700 px-6 py-3 rounded-2xl text-xs font-black shadow-sm hover:shadow-md hover:border-primary-100 transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4 text-primary-600" />
                  LLAMAR
                </a>
              )}
              {(orden.sucursal?.whatsapp || orden.sucursal?.telefono) && (
                <a
                  href={`https://wa.me/${(orden.sucursal?.whatsapp || orden.sucursal?.telefono || '').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 bg-[#25D366] text-white rounded-2xl shadow-lg shadow-green-100 hover:shadow-green-200 hover:bg-[#22c35e] transition-all active:scale-95 border-b-4 border-green-700 flex-shrink-0"
                  title="WhatsApp"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-7 h-7 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              )}
            </div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-4">Atención al Cliente • {orden.sucursal?.nombre}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
