'use server';

import { createClient } from '@/lib/supabase/server';

export interface DashboardStats {
  ordenesActivas: number;
  enReparacion: number;
  completadasHoy: number;
  totalClientes: number;
}

export interface EstadisticasMensuales {
  mes: number;
  nombre: string;
  total_ordenes: number;
  ingresos: number;
  completadas: number;
}

export interface EstadisticasEstados {
  estado: string;
  cantidad: number;
  color: string;
}

const coloresEstados: Record<string, string> = {
  PENDIENTE: '#eab308',
  EN_REVISION: '#3b82f6',
  EN_REPARACION: '#f97316',
  REPARADO: '#10b981',
  ENTREGADO: '#6b7280',
};

const nombresMeses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Obtiene todos los datos del dashboard en una sola llamada optimizada (RPC)
 */
export async function obtenerDatosCompletosDashboard(prefetchedUserInfo?: any) {
  try {
    const userInfo = prefetchedUserInfo || await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      if (prefetchedUserInfo) return { success: false, error: 'No se pudo identificar la empresa' };
      throw new Error('No se pudo identificar la empresa del usuario');
    }

    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();
    const anioActual = new Date().getFullYear();

    // Llamada única a la función RPC con filtrado por empresa
    const { data, error } = await supabase.rpc('get_dashboard_data', {
      p_anio: anioActual,
      p_empresa_id: empresaId
    });

    if (error) throw error;

    // 1. Procesar Gráfica Mensual (Asegurar que existan los 12 meses)
    const estadisticasMensuales: EstadisticasMensuales[] = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      nombre: nombresMeses[i],
      total_ordenes: 0,
      ingresos: 0,
      completadas: 0,
    }));

    (data.mensual || []).forEach((m: any) => {
      if (m.mes >= 1 && m.mes <= 12) {
        estadisticasMensuales[m.mes - 1] = {
          ...estadisticasMensuales[m.mes - 1],
          total_ordenes: m.total_ordenes,
          ingresos: m.ingresos,
          completadas: m.completadas
        };
      }
    });

    // 2. Procesar Gráfica de Estados
    const estadisticasEstados: EstadisticasEstados[] = (data.estados || []).map((e: any) => ({
      estado: e.estado.replace('_', ' '),
      cantidad: e.cantidad,
      color: coloresEstados[e.estado] || '#6b7280',
    }));

    return {
      success: true,
      stats: data.stats as DashboardStats,
      estadisticasMensuales,
      estadisticasEstados,
    };
  } catch (error) {
    console.error('Error en obtenerDatosCompletosDashboard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stats: { ordenesActivas: 0, enReparacion: 0, completadasHoy: 0, totalClientes: 0 },
      estadisticasMensuales: [],
      estadisticasEstados: [],
    };
  }
}

// Mantenemos las funciones individuales por retrocompatibilidad pero marcadas como DEPRECATED internamente
// si el cliente las sigue usando, ahora también son más eficientes al llamar a la RPC o delegar.

export async function obtenerEstadisticasDashboard() {
  const result = await obtenerDatosCompletosDashboard();
  return { success: result.success, stats: result.stats, error: result.error };
}

export async function obtenerEstadisticasMensuales() {
  const result = await obtenerDatosCompletosDashboard();
  return { success: result.success, estadisticas: result.estadisticasMensuales, error: result.error };
}

export async function obtenerEstadisticasEstados() {
  const result = await obtenerDatosCompletosDashboard();
  return { success: result.success, estadisticas: result.estadisticasEstados, error: result.error };
}

export async function obtenerUserInfo() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // Retornar error silencioso sin loguear en consola de servidor
      return { success: false, error: 'No autenticado' };
    }

    const { data: empleado, error: empleadoError } = await supabase
      .from('empleados')
      .select(`
        *,
        empresa:empresas(*),
        sucursal:sucursales(*)
      `)
      .eq('auth_user_id', user.id)
      .single();

    if (empleadoError) {
      throw new Error(`Error al obtener datos del empleado: ${empleadoError.message}`);
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nombre: empleado.nombre_completo,
        rol: empleado.rol,
        empresa: empleado.empresa,
        sucursal: empleado.sucursal,
      },
    };
  } catch (error) {
    // Solo loguear errores que NO sean de falta de sesión
    console.error('Error técnico en obtenerUserInfo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Función consolidada para inicializar el dashboard en una sola llamada (o ejecución de servidor)
 * Combina información del usuario y estadísticas del dashboard.
 */
const userResult = await obtenerUserInfo();

if (!userResult.success) {
  return { success: false, error: userResult.error };
}

const dashboardResult = await obtenerDatosCompletosDashboard(userResult);

return {
  success: true,
  user: userResult.user,
  dashboard: dashboardResult.success ? {
    stats: dashboardResult.stats,
    estadisticasMensuales: dashboardResult.estadisticasMensuales,
    estadisticasEstados: dashboardResult.estadisticasEstados,
  } : null,
  error: dashboardResult.error
};
  } catch (error) {
  console.error('Error en obtenerDatosInicialesDashboard:', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Error desconocido',
  };
}
}
