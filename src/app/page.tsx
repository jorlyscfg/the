import Navbar from '@/components/layout/Navbar';
import DashboardUI from '@/components/dashboard/DashboardUI';
import { obtenerDatosInicialesDashboard } from './actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Esta llamada ocurre en el servidor ANTES de enviar el HTML al navegador.
  // No genera peticiones POST visibles en el cliente.
  const result = await obtenerDatosInicialesDashboard();

  if (!result.success) {
    // Si no está autenticado o hay un error de sesión, el middleware debería haberlo atrapado,
    // pero por seguridad redirigimos a login.
    redirect('/login');
  }

  const { user, dashboard } = result;

  // Si el dashboard es null pero el usuario existe, inicializamos con ceros
  const stats = dashboard?.stats || {
    ordenesActivas: 0,
    enReparacion: 0,
    completadasHoy: 0,
    totalClientes: 0,
  };

  const estadisticasMensuales = dashboard?.estadisticasMensuales || [];
  const estadisticasEstados = dashboard?.estadisticasEstados || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pasamos userInfo al Navbar para evitar que tenga que hacer su propia petición */}
      <Navbar title="Inicio" userInfo={user} />

      <DashboardUI
        stats={stats}
        estadisticasMensuales={estadisticasMensuales}
        estadisticasEstados={estadisticasEstados}
      />
    </div>
  );
}
