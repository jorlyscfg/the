'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Banknote, CreditCard, Smartphone, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Pago {
  id: string;
  monto: number;
  metodo_pago: string;
  tipo_pago: string;
  referencia: string | null;
  notas: string | null;
  created_at: string;
}

interface HistorialPagosProps {
  ordenId: string;
}

export default function HistorialPagos({ ordenId }: HistorialPagosProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    cargarPagos();
  }, [ordenId]);

  const cargarPagos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('orden_id', ordenId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPagos(data || []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetodoIcon = (metodo: string) => {
    switch (metodo) {
      case 'efectivo':
        return <Banknote className="w-5 h-5" />;
      case 'tarjeta':
        return <CreditCard className="w-5 h-5" />;
      case 'transferencia':
        return <Smartphone className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getMetodoColor = (metodo: string) => {
    switch (metodo) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'tarjeta':
        return 'bg-blue-100 text-blue-800';
      case 'transferencia':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'anticipo':
        return 'Anticipo';
      case 'abono':
        return 'Abono';
      case 'pago_final':
        return 'Pago Final';
      default:
        return tipo;
    }
  };

  const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Cargando pagos...</p>
      </div>
    );
  }

  if (pagos.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No hay pagos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Total Pagado</p>
            <p className="text-3xl font-bold">${totalPagado.toFixed(2)}</p>
            <p className="text-xs opacity-75 mt-1">{pagos.length} pago(s) registrado(s)</p>
          </div>
          <DollarSign className="w-12 h-12 opacity-50" />
        </div>
      </div>

      {/* Lista de pagos */}
      <div className="space-y-3">
        {pagos.map((pago) => (
          <div
            key={pago.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Izquierda: Monto y método */}
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${getMetodoColor(pago.metodo_pago)}`}
                >
                  {getMetodoIcon(pago.metodo_pago)}
                </div>

                <div>
                  <p className="text-xl font-bold text-gray-900">
                    ${pago.monto.toFixed(2)} MXN
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {pago.metodo_pago}
                    {pago.referencia && (
                      <span className="ml-2 text-gray-500">• {pago.referencia}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Derecha: Tipo y fecha */}
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  {getTipoLabel(pago.tipo_pago)}
                </span>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(pago.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
            </div>

            {/* Notas */}
            {pago.notas && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notas:</span> {pago.notas}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
