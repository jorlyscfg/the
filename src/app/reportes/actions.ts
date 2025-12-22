'use server';

import { createClient } from '@/lib/supabase/server';
import { obtenerUserInfo } from '@/app/actions';

export interface ReporteOrdenesData {
  ordenes: Array<{
    numero_orden: string;
    fecha_ingreso: string;
    fecha_salida: string | null;
    cliente: string;
    telefono: string;
    tipo_equipo: string;
    marca_modelo: string;
    estado: string;
    costo_estimado: number | null;
    costo_final: number | null;
  }>;
  totales: {
    total_ordenes: number;
    total_estimado: number;
    total_final: number;
    ordenes_completadas: number;
    ordenes_pendientes: number;
  };
}

export async function obtenerReporteOrdenes(
  fechaInicio?: string,
  fechaFin?: string,
  estado?: string
) {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.sucursal?.id) {
      throw new Error('No se pudo identificar la sucursal del usuario');
    }
    const sucursalId = userInfo.user.sucursal.id;
    const supabase = await createClient();

    let query = supabase
      .from('ordenes_servicio')
      .select(`
          numero_orden,
          fecha_ingreso,
          fecha_salida,
          estado,
          costo_estimado,
          costo_final,
          clientes!ordenes_servicio_cliente_id_fkey (
            nombre_completo,
            telefono
          ),
          tipos_equipos!ordenes_servicio_tipo_equipo_id_fkey (
            nombre
          ),
          marcas_modelos!ordenes_servicio_marca_modelo_id_fkey (
            marca,
            modelo
          )
        `)
      .eq('sucursal_id', sucursalId)
      .order('fecha_ingreso', { ascending: false });

    // Filtrar por fecha de inicio
    if (fechaInicio) {
      query = query.gte('fecha_ingreso', fechaInicio);
    }

    // Filtrar por fecha fin
    if (fechaFin) {
      query = query.lte('fecha_ingreso', fechaFin);
    }

    // Filtrar por estado
    if (estado && estado !== 'TODOS') {
      query = query.eq('estado', estado);
    }

    const { data: ordenes, error } = await query;

    if (error) {
      throw new Error(`Error al obtener órdenes: ${error.message}`);
    }

    // Transformar datos
    const ordenesFormateadas = (ordenes || []).map((orden: any) => ({
      numero_orden: orden.numero_orden,
      fecha_ingreso: orden.fecha_ingreso,
      fecha_salida: orden.fecha_salida,
      cliente: orden.clientes?.nombre_completo || 'Sin nombre',
      telefono: orden.clientes?.telefono || '',
      tipo_equipo: orden.tipos_equipos?.nombre || 'Sin tipo',
      marca_modelo: orden.marcas_modelos
        ? `${orden.marcas_modelos.marca} ${orden.marcas_modelos.modelo}`
        : 'N/A',
      estado: orden.estado,
      costo_estimado: orden.costo_estimado,
      costo_final: orden.costo_final,
    }));

    // Calcular totales
    const totales = {
      total_ordenes: ordenesFormateadas.length,
      total_estimado: ordenesFormateadas.reduce(
        (sum, o) => sum + (o.costo_estimado || 0),
        0
      ),
      total_final: ordenesFormateadas.reduce(
        (sum, o) => sum + (o.costo_final || 0),
        0
      ),
      ordenes_completadas: ordenesFormateadas.filter(
        (o) => o.estado === 'ENTREGADOS'
      ).length,
      ordenes_pendientes: ordenesFormateadas.filter(
        (o) => o.estado !== 'ENTREGADOS'
      ).length,
    };

    return {
      success: true,
      data: {
        ordenes: ordenesFormateadas,
        totales,
      } as ReporteOrdenesData,
    };
  } catch (error) {
    console.error('Error en obtenerReporteOrdenes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function obtenerEstadisticasMensuales(anio: number) {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.sucursal?.id) {
      throw new Error('No se pudo identificar la sucursal del usuario');
    }
    const sucursalId = userInfo.user.sucursal.id;
    const supabase = await createClient();

    const { data: ordenes, error } = await supabase
      .from('ordenes_servicio')
      .select('fecha_ingreso, estado, costo_final')
      .eq('sucursal_id', sucursalId)
      .gte('fecha_ingreso', `${anio}-01-01`)
      .lt('fecha_ingreso', `${anio + 1}-01-01`);

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    // Inicializar estadísticas por mes
    const estadisticas = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      nombre: new Date(anio, i, 1).toLocaleDateString('es-MX', {
        month: 'long',
      }),
      total_ordenes: 0,
      ingresos: 0,
      completadas: 0,
    }));

    // Procesar órdenes
    (ordenes || []).forEach((orden: any) => {
      const fecha = new Date(orden.fecha_ingreso);
      const mes = fecha.getMonth();

      estadisticas[mes].total_ordenes++;
      if (orden.estado === 'ENTREGADOS') {
        estadisticas[mes].completadas++;
        estadisticas[mes].ingresos += orden.costo_final || 0;
      }
    });

    return {
      success: true,
      estadisticas,
    };
  } catch (error) {
    console.error('Error en obtenerEstadisticasMensuales:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      estadisticas: [],
    };
  }
}

// Nueva función: Estadísticas por tipo de equipo
export async function obtenerEstadisticasPorTipoEquipo(
  fechaInicio?: string,
  fechaFin?: string
) {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      throw new Error('No se pudo identificar la empresa del usuario');
    }
    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();

    let query = supabase
      .from('ordenes_servicio')
      .select(`
          tipo_equipo_id,
          tipos_equipos!ordenes_servicio_tipo_equipo_id_fkey (nombre),
          sucursales!inner(empresa_id)
        `)
      .eq('sucursales.empresa_id', empresaId);

    if (fechaInicio) query = query.gte('fecha_ingreso', fechaInicio);
    if (fechaFin) query = query.lte('fecha_ingreso', fechaFin);

    const { data: ordenes, error } = await query;

    if (error) {
      throw new Error(`Error al obtener estadísticas por tipo: ${error.message}`);
    }

    // Contar por tipo de equipo
    const conteo: Record<string, number> = {};
    (ordenes || []).forEach((orden: any) => {
      const tipo = orden.tipos_equipos?.nombre || 'Sin tipo';
      conteo[tipo] = (conteo[tipo] || 0) + 1;
    });

    // Convertir a array y ordenar
    const estadisticas = Object.entries(conteo)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    return {
      success: true,
      estadisticas,
    };
  } catch (error) {
    console.error('Error en obtenerEstadisticasPorTipoEquipo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      estadisticas: [],
    };
  }
}

// Nueva función: Tiempo promedio de reparación
export async function obtenerTiempoPromedioReparacion(
  fechaInicio?: string,
  fechaFin?: string
) {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      throw new Error('No se pudo identificar la empresa del usuario');
    }
    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();

    let query = supabase
      .from('ordenes_servicio')
      .select(`
          fecha_ingreso,
          fecha_salida,
          estado,
          tipos_equipos!ordenes_servicio_tipo_equipo_id_fkey (nombre),
          sucursales!inner(empresa_id)
        `)
      .eq('sucursales.empresa_id', empresaId)
      .not('fecha_salida', 'is', null)
      .in('estado', ['ENTREGADOS', 'LISTOS']);

    if (fechaInicio) query = query.gte('fecha_ingreso', fechaInicio);
    if (fechaFin) query = query.lte('fecha_ingreso', fechaFin);

    const { data: ordenes, error } = await query;

    if (error) {
      throw new Error(`Error al calcular tiempo promedio: ${error.message}`);
    }

    if (!ordenes || ordenes.length === 0) {
      return {
        success: true,
        estadisticas: {
          promedio_general_dias: 0,
          por_tipo: [],
        },
      };
    }

    // Calcular diferencias en días
    const tiemposPorTipo: Record<string, number[]> = {};
    let totalDias = 0;

    ordenes.forEach((orden: any) => {
      const fechaIngreso = new Date(orden.fecha_ingreso);
      const fechaSalida = new Date(orden.fecha_salida);
      const dias = Math.ceil((fechaSalida.getTime() - fechaIngreso.getTime()) / (1000 * 60 * 60 * 24));

      totalDias += dias;

      const tipo = orden.tipos_equipos?.nombre || 'Sin tipo';
      if (!tiemposPorTipo[tipo]) {
        tiemposPorTipo[tipo] = [];
      }
      tiemposPorTipo[tipo].push(dias);
    });

    // Calcular promedios
    const porTipo = Object.entries(tiemposPorTipo).map(([tipo, dias]) => ({
      tipo,
      promedio_dias: dias.reduce((a, b) => a + b, 0) / dias.length,
      cantidad_ordenes: dias.length,
    })).sort((a, b) => b.cantidad_ordenes - a.cantidad_ordenes);

    return {
      success: true,
      estadisticas: {
        promedio_general_dias: totalDias / ordenes.length,
        por_tipo: porTipo,
      },
    };
  } catch (error) {
    console.error('Error en obtenerTiempoPromedioReparacion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      estadisticas: {
        promedio_general_dias: 0,
        por_tipo: [],
      },
    };
  }
}

// Nueva función: Clientes más frecuentes
export async function obtenerClientesFrecuentes(limite = 10) {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      throw new Error('No se pudo identificar la empresa del usuario');
    }
    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();

    const { data: ordenes, error } = await supabase
      .from('ordenes_servicio')
      .select(`
          cliente_id,
          costo_final,
          clientes!ordenes_servicio_cliente_id_fkey (
            nombre_completo,
            telefono
          ),
          sucursales!inner(empresa_id)
        `)
      .eq('sucursales.empresa_id', empresaId);

    if (error) {
      throw new Error(`Error al obtener clientes frecuentes: ${error.message}`);
    }

    // Agrupar por cliente
    const clientesMap: Record<string, {
      nombre: string;
      telefono: string;
      cantidad_ordenes: number;
      gasto_total: number;
    }> = {};

    (ordenes || []).forEach((orden: any) => {
      const clienteId = orden.cliente_id;
      const nombre = orden.clientes?.nombre_completo || 'Sin nombre';
      const telefono = orden.clientes?.telefono || '';

      if (!clientesMap[clienteId]) {
        clientesMap[clienteId] = {
          nombre,
          telefono,
          cantidad_ordenes: 0,
          gasto_total: 0,
        };
      }

      clientesMap[clienteId].cantidad_ordenes++;
      clientesMap[clienteId].gasto_total += orden.costo_final || 0;
    });

    // Convertir a array y ordenar
    const clientes = Object.values(clientesMap)
      .sort((a, b) => b.cantidad_ordenes - a.cantidad_ordenes)
      .slice(0, limite);

    return {
      success: true,
      clientes,
    };
  } catch (error) {
    console.error('Error en obtenerClientesFrecuentes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      clientes: [],
    };
  }
}
