'use client';

import { useState } from 'react';
import { DollarSign, CreditCard, Banknote, Smartphone, X, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useNotification } from '@/components/notifications/NotificationContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface RegistroPagosProps {
  ordenId: string;
  saldoPendiente: number;
  onPagoRegistrado: () => void;
  onCerrar?: () => void;
}

type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';
type TipoPago = 'anticipo' | 'pago_final' | 'abono';

export default function RegistroPagos({
  ordenId,
  saldoPendiente,
  onPagoRegistrado,
  onCerrar
}: RegistroPagosProps) {
  const [monto, setMonto] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [tipoPago, setTipoPago] = useState<TipoPago>('abono');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [guardando, setGuardando] = useState(false);
  const { success: showSuccess, error: showError } = useNotification();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoNum = parseFloat(monto);

    if (isNaN(montoNum) || montoNum <= 0) {
      showError('Monto inválido', 'Ingrese un monto válido');
      return;
    }

    if (montoNum > saldoPendiente && tipoPago !== 'pago_final') {
      showError('Monto excedido', 'El monto no puede ser mayor al saldo pendiente');
      return;
    }

    try {
      setGuardando(true);

      // Registrar el pago
      const { error: pagoError } = await supabase
        .from('pagos')
        .insert({
          orden_id: ordenId,
          monto: montoNum,
          metodo_pago: metodoPago,
          tipo_pago: tipoPago,
          referencia: referencia || null,
          notas: notas || null
        });

      if (pagoError) throw pagoError;

      // Actualizar saldo pendiente en la orden
      const nuevoSaldo = Math.max(0, saldoPendiente - montoNum);

      const { error: ordenError } = await supabase
        .from('ordenes_servicio')
        .update({ saldo_pendiente: nuevoSaldo })
        .eq('id', ordenId);

      if (ordenError) throw ordenError;

      // Registrar en historial
      await supabase.from('historial_orden').insert({
        orden_id: ordenId,
        accion: 'pago_registrado',
        observaciones: `Pago de $${montoNum.toFixed(2)} MXN por ${metodoPago}`,
        datos_cambio: {
          monto: montoNum,
          metodo: metodoPago,
          tipo: tipoPago,
          saldo_anterior: saldoPendiente,
          saldo_nuevo: nuevoSaldo
        }
      });

      showSuccess('Pago registrado', 'El pago se registró correctamente');
      onPagoRegistrado();

      // Limpiar formulario
      setMonto('');
      setReferencia('');
      setNotas('');

    } catch (error: any) {
      console.error('Error al registrar pago:', error);
      showError('Error', 'No se pudo registrar el pago');
    } finally {
      setGuardando(false);
    }
  };

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', icon: Banknote },
    { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia', icon: Smartphone }
  ];

  return (
    <div className="bg-white max-w-md mx-auto">
      {/* Header Info */}
      <div className="mb-6 p-4 bg-primary-50/50 rounded-xl border border-primary-100/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Saldo Pendiente</span>
          <span className="text-xl font-bold text-primary-600">
            ${saldoPendiente.toFixed(2)} MXN
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="w-full">
          <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
            Tipo de Pago *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'abono', label: 'Abono' },
              { id: 'pago_final', label: 'Pago Final' },
              { id: 'anticipo', label: 'Anticipo' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTipoPago(t.id as TipoPago);
                  if (t.id === 'pago_final') setMonto(saldoPendiente.toString());
                }}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${tipoPago === t.id
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-primary-200 hover:text-primary-500'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Monto (MXN)"
          type="number"
          step="0.01"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
          icon={<DollarSign className="w-4 h-4" />}
          helperText={tipoPago === 'pago_final' ? `Pago final completo de $${saldoPendiente.toFixed(2)} MXN` : undefined}
        />

        <div className="w-full">
          <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">
            Método de Pago *
          </label>
          <div className="grid grid-cols-3 gap-2">
            {metodosPago.map((metodo) => {
              const Icon = metodo.icon;
              const isActive = metodoPago === metodo.value;
              return (
                <button
                  key={metodo.value}
                  type="button"
                  onClick={() => setMetodoPago(metodo.value as MetodoPago)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${isActive
                    ? 'border-primary-500 bg-primary-50/30'
                    : 'border-gray-100 bg-gray-50/30 hover:border-gray-200'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'
                      }`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-primary-700' : 'text-gray-500'
                      }`}
                  >
                    {metodo.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {(metodoPago === 'tarjeta' || metodoPago === 'transferencia') && (
          <Input
            label="Referencia / Últimos 4 dígitos"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            placeholder="Ej: 1234 o REF-ABC123"
            icon={<X className="w-4 h-4 rotate-45" />}
          />
        )}

        <div className="w-full">
          <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
            Notas (opcional)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
              <FileText className="w-4 h-4" />
            </div>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal min-h-[60px] resize-none"
              placeholder="Información adicional..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-5 border-t border-gray-100 mt-6">
          {onCerrar && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCerrar}
              className="flex-1 font-bold uppercase text-[10px] tracking-widest h-11"
            >
              Cancelar
            </Button>
          )}

          <Button
            type="submit"
            disabled={guardando || !monto}
            isLoading={guardando}
            className="flex-1 font-bold uppercase text-[10px] tracking-widest h-11 shadow-md"
          >
            Registrar Pago
          </Button>
        </div>
      </form>
    </div>
  );
}
