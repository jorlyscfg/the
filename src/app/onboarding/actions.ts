'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface RegistroEmpresaData {
  // Datos de la empresa
  nombre_empresa: string;
  razon_social?: string;
  rfc?: string;
  telefono_empresa?: string;
  email_empresa?: string;
  sitio_web?: string;

  // Datos de la sucursal principal
  nombre_sucursal: string;
  direccion_sucursal?: string;
  telefono_sucursal?: string;
  email_sucursal?: string;

  // Datos del primer usuario (admin)
  nombre_completo: string;
  telefono_usuario?: string;
}

export async function registrarEmpresaYUsuario(data: RegistroEmpresaData) {
  try {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Verificar que el usuario esté autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Usuario no autenticado',
      };
    }

    // Verificar si el usuario ya tiene una empresa asignada
    const { data: empleadoExistente } = await supabase
      .from('empleados')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (empleadoExistente) {
      return {
        success: false,
        error: 'El usuario ya está registrado en una empresa',
      };
    }

    // 1. Crear la empresa usando adminSupabase (bootstrapping)
    const { data: empresa, error: errorEmpresa } = await adminSupabase
      .from('empresas')
      .insert({
        nombre: data.nombre_empresa,
        razon_social: data.razon_social,
        rfc: data.rfc,
        telefono: data.telefono_empresa,
        email: data.email_empresa,
        sitio_web: data.sitio_web,
        activa: true,
      })
      .select()
      .single();

    if (errorEmpresa || !empresa) {
      throw new Error(`Error al crear empresa: ${errorEmpresa?.message}`);
    }

    // 2. Crear la sucursal principal
    const { data: sucursal, error: errorSucursal } = await adminSupabase
      .from('sucursales')
      .insert({
        empresa_id: empresa.id,
        nombre: data.nombre_sucursal,
        direccion: data.direccion_sucursal,
        telefono: data.telefono_sucursal,
        activa: true,
      })
      .select()
      .single();

    if (errorSucursal || !sucursal) {
      // Si falla, intentar eliminar la empresa creada
      await adminSupabase.from('empresas').delete().eq('id', empresa.id);
      throw new Error(`Error al crear sucursal: ${errorSucursal?.message}`);
    }

    // 3. Crear configuración de sucursal
    const { error: errorConfigSucursal } = await adminSupabase
      .from('configuracion_sucursal')
      .insert({
        sucursal_id: sucursal.id,
        costo_minimo_revision: 250,
        dias_limite_reciclaje: 30,
        notificar_whatsapp_ingreso: true,
        notificar_whatsapp_diagnostico: true,
        notificar_whatsapp_listo: true,
        ultimo_numero_orden: 0,
        prefijo_orden: sucursal.nombre.substring(0, 3).toUpperCase(),
      });

    if (errorConfigSucursal) {
      console.error('Error al crear configuración de sucursal:', errorConfigSucursal);
    }

    // 4. Crear el primer empleado (administrador)
    const { error: errorEmpleado } = await adminSupabase.from('empleados').insert({
      empresa_id: empresa.id,
      sucursal_id: sucursal.id,
      auth_user_id: user.id,
      nombre_completo: data.nombre_completo,
      email: user.email,
      telefono: data.telefono_usuario,
      rol: 'admin',
      activo: true,
    });

    if (errorEmpleado) {
      // Si falla, intentar eliminar empresa y sucursal
      await adminSupabase.from('sucursales').delete().eq('id', sucursal.id);
      await adminSupabase.from('empresas').delete().eq('id', empresa.id);
      throw new Error(`Error al crear empleado: ${errorEmpleado.message}`);
    }

    revalidatePath('/');
    revalidatePath('/', 'layout');

    return {
      success: true,
      message: '¡Empresa registrada con éxito! Ya puedes empezar a trabajar.',
    };
  } catch (error) {
    console.error('Error en registrarEmpresaYUsuario:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function verificarSiTieneEmpresa() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        tieneEmpresa: false,
      };
    }

    const { data: empleado } = await supabase
      .from('empleados')
      .select('id, empresa_id, sucursal_id, rol')
      .eq('auth_user_id', user.id)
      .single();

    return {
      success: true,
      tieneEmpresa: !!empleado,
      empleado: empleado || null,
    };
  } catch (error) {
    console.error('Error en verificarSiTieneEmpresa:', error);
    return {
      success: false,
      tieneEmpresa: false,
    };
  }
}
