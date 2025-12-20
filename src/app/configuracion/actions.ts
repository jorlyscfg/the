'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { obtenerUserInfo } from '@/app/actions';

export interface Empresa {
  id: string;
  nombre: string;
  razon_social: string | null;
  rfc: string | null;
  logo_url: string | null;
  telefono: string | null;
  email: string | null;
  sitio_web: string | null;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  activa: boolean;
  created_at: string;
}

export interface Empleado {
  id: string;
  empresa_id: string | null;
  sucursal_id: string | null;
  auth_user_id: string | null;
  nombre_completo: string;
  telefono: string | null;
  email: string | null;
  rol: string;
  foto_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  sucursal?: {
    nombre: string;
  };
}

export async function obtenerConfiguracionCompleta() {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      throw new Error('No se pudo identificar la empresa del usuario');
    }
    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();

    const [empresaRes, sucursalesRes, empleadosRes] = await Promise.all([
      supabase.from('empresas').select('*').eq('id', empresaId).single(),
      supabase.from('sucursales').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: true }),
      supabase.from('empleados').select('*, sucursal:sucursales(nombre)').eq('empresa_id', empresaId).order('created_at', { ascending: true })
    ]);

    if (empresaRes.error && empresaRes.error.code !== 'PGRST116') throw empresaRes.error;
    if (sucursalesRes.error) throw sucursalesRes.error;
    if (empleadosRes.error) throw empleadosRes.error;

    return {
      success: true,
      empresa: empresaRes.data || null,
      sucursales: sucursalesRes.data || [],
      empleados: empleadosRes.data || [],
    };
  } catch (error) {
    console.error('Error en obtenerConfiguracionCompleta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      sucursales: [],
      empleados: [],
    };
  }
}

export async function obtenerEmpresa() {
  try {
    const supabase = await createClient();

    const { data: empresa, error } = await supabase
      .from('empresas')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error al obtener empresa: ${error.message}`);
    }

    return {
      success: true,
      empresa: empresa || null,
    };
  } catch (error) {
    console.error('Error en obtenerEmpresa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function actualizarEmpresa(data: Partial<Empresa>) {
  try {
    const supabase = await createClient();

    // Obtener empresa existente
    const { data: empresaExistente } = await supabase
      .from('empresas')
      .select('id')
      .limit(1)
      .single();

    let result;

    if (empresaExistente) {
      // Actualizar empresa existente
      const { error } = await supabase
        .from('empresas')
        .update({
          nombre: data.nombre,
          razon_social: data.razon_social,
          rfc: data.rfc,
          telefono: data.telefono,
          email: data.email,
          sitio_web: data.sitio_web,
          updated_at: new Date().toISOString(),
        })
        .eq('id', empresaExistente.id);

      if (error) {
        throw new Error(`Error al actualizar empresa: ${error.message}`);
      }
    } else {
      // Crear nueva empresa
      const { error } = await supabase.from('empresas').insert({
        nombre: data.nombre || 'Mi Empresa',
        razon_social: data.razon_social,
        rfc: data.rfc,
        telefono: data.telefono,
        email: data.email,
        sitio_web: data.sitio_web,
      });

      if (error) {
        throw new Error(`Error al crear empresa: ${error.message}`);
      }
    }

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Información de empresa actualizada exitosamente',
    };
  } catch (error) {
    console.error('Error en actualizarEmpresa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function subirLogoEmpresa(empresaId: string, formData: FormData) {
  try {
    const supabase = await createClient();
    const logoFile = formData.get('logo') as File;
    if (!logoFile) throw new Error('No se recibió ninguna imagen');

    const extension = logoFile.name.split('.').pop() || 'png';
    const nombreArchivo = `logos/${empresaId}-${Date.now()}.${extension}`;

    // Subir a Supabase Storage
    const arrayBuffer = await logoFile.arrayBuffer();
    const { error: errorStorage } = await supabase.storage
      .from('configuracion') // Usando un bucket general de configuración
      .upload(nombreArchivo, Buffer.from(arrayBuffer), {
        contentType: logoFile.type,
        cacheControl: '3600',
        upsert: true
      });

    if (errorStorage) throw errorStorage;

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('configuracion')
      .getPublicUrl(nombreArchivo);

    // Actualizar registro de empresa
    const { error: errorUpdate } = await supabase
      .from('empresas')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', empresaId);

    if (errorUpdate) throw errorUpdate;

    revalidatePath('/configuracion');

    return {
      success: true,
      logoUrl: urlData.publicUrl,
      message: 'Logo actualizado correctamente',
    };
  } catch (error) {
    console.error('Error en subirLogoEmpresa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function obtenerSucursales() {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      throw new Error('No se pudo identificar la empresa del usuario');
    }
    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();

    const { data: sucursales, error } = await supabase
      .from('sucursales')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener sucursales: ${error.message}`);
    }

    return {
      success: true,
      sucursales: sucursales || [],
    };
  } catch (error) {
    console.error('Error en obtenerSucursales:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      sucursales: [],
    };
  }
}

export interface CrearSucursalData {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export async function crearSucursal(data: CrearSucursalData) {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      throw new Error('No se pudo identificar la empresa del usuario');
    }
    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();

    const { error } = await supabase.from('sucursales').insert({
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono,
      email: data.email,
      empresa_id: empresaId,
      activa: true,
    });

    if (error) {
      throw new Error(`Error al crear sucursal: ${error.message}`);
    }

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Sucursal creada exitosamente',
    };
  } catch (error) {
    console.error('Error en crearSucursal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function actualizarSucursal(id: string, data: Partial<Sucursal>) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('sucursales')
      .update({
        nombre: data.nombre,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        activa: data.activa,
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al actualizar sucursal: ${error.message}`);
    }

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Sucursal actualizada exitosamente',
    };
  } catch (error) {
    console.error('Error en actualizarSucursal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function eliminarSucursal(id: string) {
  try {
    const supabase = await createClient();

    // Verificar si hay órdenes asociadas
    const { count } = await supabase
      .from('ordenes_servicio')
      .select('*', { count: 'exact', head: true })
      .eq('sucursal_id', id);

    if (count && count > 0) {
      return {
        success: false,
        error: 'No se puede eliminar una sucursal con órdenes de servicio asociadas',
      };
    }

    const { error } = await supabase.from('sucursales').delete().eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar sucursal: ${error.message}`);
    }

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Sucursal eliminada exitosamente',
    };
  } catch (error) {
    console.error('Error en eliminarSucursal:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

// ============== EMPLEADOS ==============

export async function obtenerEmpleados() {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.empresa?.id) {
      throw new Error('No se pudo identificar la empresa del usuario');
    }
    const empresaId = userInfo.user.empresa.id;
    const supabase = await createClient();

    const { data: empleados, error } = await supabase
      .from('empleados')
      .select(`
        *,
        sucursal:sucursales(nombre)
      `)
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error al obtener empleados: ${error.message}`);
    }

    return {
      success: true,
      empleados: empleados || [],
    };
  } catch (error) {
    console.error('Error en obtenerEmpleados:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      empleados: [],
    };
  }
}

export interface CrearEmpleadoData {
  nombre_completo: string;
  email: string;
  telefono?: string;
  rol: string;
  sucursal_id: string;
  empresa_id: string;
}

export async function crearEmpleado(data: CrearEmpleadoData) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from('empleados').insert({
      nombre_completo: data.nombre_completo,
      email: data.email,
      telefono: data.telefono,
      rol: data.rol,
      sucursal_id: data.sucursal_id,
      empresa_id: data.empresa_id,
      activo: true,
    });

    if (error) {
      throw new Error(`Error al crear empleado: ${error.message}`);
    }

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Empleado creado exitosamente',
    };
  } catch (error) {
    console.error('Error en crearEmpleado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function actualizarEmpleado(id: string, data: Partial<Empleado>) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('empleados')
      .update({
        nombre_completo: data.nombre_completo,
        email: data.email,
        telefono: data.telefono,
        rol: data.rol,
        sucursal_id: data.sucursal_id,
        activo: data.activo,
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Error al actualizar empleado: ${error.message}`);
    }

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Empleado actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error en actualizarEmpleado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function eliminarEmpleado(id: string) {
  try {
    const supabase = await createClient();

    // Verificar si hay órdenes asociadas como empleado que recibe
    const { count: countRecibe } = await supabase
      .from('ordenes_servicio')
      .select('*', { count: 'exact', head: true })
      .eq('empleado_recibe_id', id);

    // Verificar si hay órdenes asociadas como empleado asignado
    const { count: countAsignado } = await supabase
      .from('ordenes_servicio')
      .select('*', { count: 'exact', head: true })
      .eq('empleado_asignado_id', id);

    if ((countRecibe && countRecibe > 0) || (countAsignado && countAsignado > 0)) {
      return {
        success: false,
        error: 'No se puede eliminar un empleado con órdenes de servicio asociadas',
      };
    }

    const { error } = await supabase.from('empleados').delete().eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar empleado: ${error.message}`);
    }

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Empleado eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error en eliminarEmpleado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function eliminarLogoEmpresa(empresaId: string) {
  try {
    const supabase = await createClient();

    // 1. Obtener la empresa para saber si hay un logo que borrar del storage
    const { data: empresa, error: errorEmpresa } = await supabase
      .from('empresas')
      .select('logo_url')
      .eq('id', empresaId)
      .single();

    if (errorEmpresa) throw new Error(`Error al obtener empresa: ${errorEmpresa.message}`);

    // Nota: Simplificación - solo borramos la referencia en BD por ahora
    const { error: errorUpdate } = await supabase
      .from('empresas')
      .update({ logo_url: null })
      .eq('id', empresaId);

    if (errorUpdate) throw new Error(`Error al eliminar referencia de logo: ${errorUpdate.message}`);

    revalidatePath('/configuracion');

    return {
      success: true,
      message: 'Logo eliminado correctamente',
    };
  } catch (error) {
    console.error('Error en eliminarLogoEmpresa:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
