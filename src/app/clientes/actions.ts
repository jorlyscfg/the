'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Cliente {
  id: string;
  nombre_completo: string;
  telefono: string;
  email: string | null;
  created_at: string;
  ordenes_count: number;
  ultima_orden?: string;
}

export async function obtenerClientes() {
  try {
    const supabase = await createClient();

    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener clientes: ${error.message}`);
    }

    // Obtener el conteo de órdenes por cada cliente
    const clientesConOrdenes = await Promise.all(
      (clientes || []).map(async (cliente) => {
        const { count } = await supabase
          .from('ordenes_servicio')
          .select('*', { count: 'exact', head: true })
          .eq('cliente_id', cliente.id);

        // Obtener última orden
        const { data: ultimaOrden } = await supabase
          .from('ordenes_servicio')
          .select('fecha_ingreso')
          .eq('cliente_id', cliente.id)
          .order('fecha_ingreso', { ascending: false })
          .limit(1)
          .single();

        return {
          id: cliente.id,
          nombre_completo: cliente.nombre_completo,
          telefono: cliente.telefono,
          email: cliente.email,
          created_at: cliente.created_at,
          ordenes_count: count || 0,
          ultima_orden: ultimaOrden?.fecha_ingreso,
        };
      })
    );

    return {
      success: true,
      clientes: clientesConOrdenes,
    };
  } catch (error) {
    console.error('Error en obtenerClientes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      clientes: [],
    };
  }
}

export interface ClienteDetalle {
  id: string;
  nombre_completo: string;
  telefono: string;
  email: string | null;
  created_at: string;
  ordenes: Array<{
    id: string;
    numero_orden: string;
    estado: string;
    fecha_ingreso: string;
    tipo_equipo: {
      nombre: string;
    };
  }>;
}

export async function obtenerClientePorId(id: string) {
  try {
    const supabase = await createClient();

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener cliente: ${error.message}`);
    }

    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }

    // Obtener órdenes del cliente
    const { data: ordenes } = await supabase
      .from('ordenes_servicio')
      .select(`
        id,
        numero_orden,
        estado,
        fecha_ingreso,
        tipos_equipos!ordenes_servicio_tipo_equipo_id_fkey (
          nombre
        )
      `)
      .eq('cliente_id', id)
      .order('fecha_ingreso', { ascending: false });

    const clienteDetalle: ClienteDetalle = {
      id: cliente.id,
      nombre_completo: cliente.nombre_completo,
      telefono: cliente.telefono,
      email: cliente.email,
      created_at: cliente.created_at,
      ordenes: (ordenes || []).map((orden: any) => ({
        id: orden.id,
        numero_orden: orden.numero_orden,
        estado: orden.estado,
        fecha_ingreso: orden.fecha_ingreso,
        tipo_equipo: {
          nombre: orden.tipos_equipos?.nombre || 'Sin tipo',
        },
      })),
    };

    return {
      success: true,
      cliente: clienteDetalle,
    };
  } catch (error) {
    console.error('Error en obtenerClientePorId:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export interface ActualizarClienteData {
  id: string;
  nombre_completo: string;
  telefono: string;
  email?: string;
}

export async function actualizarCliente(data: ActualizarClienteData) {
  try {
    const supabase = await createClient();

    const telefonoLimpio = data.telefono.replace(/\D/g, '');

    const { error } = await supabase
      .from('clientes')
      .update({
        nombre_completo: data.nombre_completo,
        telefono: telefonoLimpio,
        email: data.email || null,
      })
      .eq('id', data.id);

    if (error) {
      throw new Error(`Error al actualizar cliente: ${error.message}`);
    }

    revalidatePath('/clientes');

    return {
      success: true,
      message: 'Cliente actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error en actualizarCliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function eliminarCliente(id: string) {
  try {
    const supabase = await createClient();

    // Verificar si el cliente tiene órdenes
    const { count } = await supabase
      .from('ordenes_servicio')
      .select('*', { count: 'exact', head: true })
      .eq('cliente_id', id);

    if (count && count > 0) {
      return {
        success: false,
        error: 'No se puede eliminar un cliente con órdenes de servicio asociadas',
      };
    }

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar cliente: ${error.message}`);
    }

    revalidatePath('/clientes');

    return {
      success: true,
      message: 'Cliente eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error en eliminarCliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function crearCliente(data: {
  nombre_completo: string;
  telefono: string;
  email?: string | null;
}) {
  try {
    const supabase = await createClient();

    // Obtener el ID del usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener la sucursal del empleado
    const { data: empleado, error: empleadoError } = await supabase
      .from('empleados')
      .select('sucursal_id')
      .eq('auth_user_id', user.id)
      .single();

    if (empleadoError || !empleado) {
      throw new Error('No se encontró información del empleado');
    }

    // Limpiar el teléfono (solo dígitos)
    const telefonoLimpio = data.telefono.replace(/\D/g, '');

    if (telefonoLimpio.length < 10) {
      throw new Error('El teléfono debe tener al menos 10 dígitos');
    }

    const { data: nuevoCliente, error } = await supabase
      .from('clientes')
      .insert({
        nombre_completo: data.nombre_completo.trim(),
        telefono: telefonoLimpio,
        email: data.email?.trim() || null,
        sucursal_id: empleado.sucursal_id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear cliente: ${error.message}`);
    }

    revalidatePath('/clientes');

    return {
      success: true,
      message: 'Cliente creado exitosamente',
      cliente: nuevoCliente,
    };
  } catch (error) {
    console.error('Error en crearCliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
