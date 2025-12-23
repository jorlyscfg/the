import Navbar from '@/components/layout/Navbar';
import { obtenerOrdenes } from './actions';
import OrdenesListClient from './OrdenesListClient';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrdenesPage() {
  const result = await obtenerOrdenes();

  if (!result.success && result.error === 'AUTH_SESSION_EXPIRED') {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar title="Órdenes de Servicio" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-32">
        {!result.success ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
              <X className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Error al cargar</h3>
            <p className="text-gray-500 max-w-xs">{result.error || 'No se pudieron cargar las órdenes'}</p>
            {/* Como es un Server Component, el reintento simplemente recarga la página */}
            <form action="/ordenes">
              <Button type="submit" className="mt-4" variant="ghost">Reintentar</Button>
            </form>
          </div>
        ) : (
          <OrdenesListClient initialOrdenes={result.ordenes || []} />
        )}
      </main>
    </div>
  );
}
