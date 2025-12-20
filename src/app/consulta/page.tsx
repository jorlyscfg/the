'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, QrCode, ArrowRight } from 'lucide-react';

/**
 * Página de consulta pública simplificada
 * Permite a los clientes consultar el estado de su orden sin login
 * Estética minimalista y genérica para soporte multi-sucursal
 */
export default function ConsultaPublicaPage() {
  const router = useRouter();
  const [numeroOrden, setNumeroOrden] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConsultar = (e: React.FormEvent) => {
    e.preventDefault();

    if (!numeroOrden.trim()) {
      return;
    }

    setLoading(true);
    // Redirigir a la página de detalle de consulta
    router.push(`/consulta/${numeroOrden.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-10 space-y-8">
          {/* Formulario de Consulta */}
          <form onSubmit={handleConsultar} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-3 ml-1 tracking-tight">
                Número de Orden
              </label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  value={numeroOrden}
                  onChange={(e) => setNumeroOrden(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-100 focus:border-primary-500 text-lg font-bold text-gray-900 transition-all placeholder:text-gray-300 outline-none"
                  placeholder="Ej: ORD-5099"
                  required
                  autoFocus
                />
              </div>
              <p className="mt-3 text-xs text-gray-400 font-medium ml-1">
                Ingresa el número de orden que aparece en tu ticket
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !numeroOrden.trim()}
              className="w-full bg-[#9daaf2] hover:bg-[#8b99e5] text-white py-4 px-6 rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Consultar Estado
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Línea divisoria suave */}
          <div className="border-t border-gray-100"></div>

          {/* Información de QR */}
          <div className="flex items-start gap-4 text-gray-600 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
            <div className="p-2 bg-white rounded-lg shadow-sm">
                <QrCode className="w-5 h-5 text-[#9daaf2]" />
            </div>
            <p className="text-[13px] leading-relaxed font-medium">
              <span className="font-bold text-gray-800">¿Tienes un código QR en tu ticket?</span> Escanéalo para acceder directamente al estado de tu orden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
