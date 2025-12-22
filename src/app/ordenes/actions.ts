'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { obtenerUserInfo } from '@/app/actions';

export interface NuevaOrdenData {
  nombreCliente: string;
  telefonoCliente: string;
  emailCliente?: string;
  tipoEquipo: string;
  marca?: string;
  modelo?: string;
  serie?: string;
  accesorios?: string;
  problema: string;
  firma?: string; // Base64 de la firma
}

// Nuevas acciones para catálogos dinámicos
export async function obtenerTiposEquipos() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('tipos_equipos')
      .select('nombre')
      .eq('activo', true)
      .order('veces_usado', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      tipos: data?.map(t => t.nombre) || [],
    };
  } catch (error) {
    console.error('Error al obtener tipos de equipos:', error);
    return { success: false, tipos: [] };
  }
}

export async function obtenerMarcasModelos() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('marcas_modelos')
      .select('marca, modelo')
      .eq('activo', true)
      .order('veces_usado', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      marcas: Array.from(new Set(data?.map(m => m.marca) || [])),
      modelos: Array.from(new Set(data?.map(m => m.modelo) || [])),
    };
  } catch (error) {
    console.error('Error al obtener marcas/modelos:', error);
    return { success: false, marcas: [], modelos: [] };
  }
}

export async function obtenerCatalogosOrden() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_catalogos_orden');

    if (error) throw error;

    return {
      success: true,
      tipos: data.tipos || [],
      marcas: data.marcas || [],
      modelos: data.modelos || [],
    };
  } catch (error) {
    console.error('Error al obtener catálogos:', error);
    return { success: false, tipos: [], marcas: [], modelos: [] };
  }
}

export async function crearTipoEquipo(nombre: string) {
  try {
    const supabase = await createClient();
    const nombreNormalizado = nombre.toUpperCase().trim();

    // Verificar si ya existe
    const { data: existente } = await supabase
      .from('tipos_equipos')
      .select('nombre')
      .eq('nombre', nombreNormalizado)
      .single();

    if (existente) {
      return { success: false, error: 'Este tipo de equipo ya existe' };
    }

    const { data, error } = await supabase
      .from('tipos_equipos')
      .insert({ nombre: nombreNormalizado, activo: true })
      .select('nombre')
      .single();

    if (error) throw error;

    return { success: true, tipo: data.nombre };
  } catch (error) {
    console.error('Error al crear tipo de equipo:', error);
    return { success: false, error: 'Error al crear el tipo de equipo' };
  }
}

export async function crearMarcaModelo(marca: string, modelo: string) {
  try {
    const supabase = await createClient();
    const marcaNormalizada = marca.toUpperCase().trim();
    const modeloNormalizado = modelo.toUpperCase().trim();

    // Verificar si ya existe la combinación exact
    const { data: existente } = await supabase
      .from('marcas_modelos')
      .select('id')
      .eq('marca', marcaNormalizada)
      .eq('modelo', modeloNormalizado)
      .single();

    if (existente) {
      return { success: false, error: 'Esta combinación de marca y modelo ya existe' };
    }

    const { data, error } = await supabase
      .from('marcas_modelos')
      .insert({
        marca: marcaNormalizada,
        modelo: modeloNormalizado,
        activo: true
      })
      .select('marca, modelo')
      .single();

    if (error) throw error;

    return { success: true, marca: data.marca, modelo: data.modelo };
  } catch (error) {
    console.error('Error al crear marca/modelo:', error);
    return { success: false, error: 'Error al crear marca y modelo' };
  }
}

export async function buscarClientes(termino: string) {
  try {
    const supabase = await createClient();

    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.sucursal?.id) {
      throw new Error('No se pudo identificar la sucursal del usuario');
    }
    const sucursalId = userInfo.user.sucursal.id;

    // Buscar por nombre, teléfono o email, filtrado por sucursal
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('id, nombre_completo, telefono, email')
      .eq('sucursal_id', sucursalId)
      .or(`nombre_completo.ilike.%${termino}%,telefono.ilike.%${termino}%,email.ilike.%${termino}%`)
      .order('nombre_completo', { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(`Error al buscar clientes: ${error.message}`);
    }

    return {
      success: true,
      clientes: clientes || [],
    };
  } catch (error) {
    console.error('Error en buscarClientes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      clientes: [],
    };
  }
}

export async function crearOrden(data: NuevaOrdenData) {
  try {
    const supabase = await createClient();
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.sucursal?.id) {
      throw new Error('No se pudo identificar la sucursal del usuario');
    }

    const { user: usuarioActual } = userInfo;
    const sucursalId = usuarioActual.sucursal.id;
    const empleadoId = usuarioActual.id;

    // 1. Buscar o crear cliente
    const telefonoLimpio = data.telefonoCliente.replace(/\D/g, '');
    console.log('Creando orden - Datos recibidos:', { nombre: data.nombreCliente, telefono: data.telefonoCliente, telefonoLimpio, sucursalId });

    let cliente = null;
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefonoLimpio)
      .eq('sucursal_id', sucursalId)
      .single();

    console.log('Cliente existente:', clienteExistente);

    if (clienteExistente) {
      cliente = clienteExistente;

      // Actualizar datos del cliente si han cambiado
      if (clienteExistente.nombre_completo !== data.nombreCliente ||
        (data.emailCliente && clienteExistente.email !== data.emailCliente)) {
        const { data: clienteActualizado } = await supabase
          .from('clientes')
          .update({
            nombre_completo: data.nombreCliente,
            email: data.emailCliente || clienteExistente.email,
          })
          .eq('id', clienteExistente.id)
          .select()
          .single();

        cliente = clienteActualizado;
      }
    } else {
      // Crear nuevo cliente
      const { data: nuevoCliente, error: errorCliente } = await supabase
        .from('clientes')
        .insert({
          nombre_completo: data.nombreCliente,
          telefono: telefonoLimpio,
          email: data.emailCliente,
          sucursal_id: sucursalId,
        })
        .select()
        .single();

      if (errorCliente) {
        throw new Error(`Error al crear cliente: ${errorCliente.message}`);
      }

      cliente = nuevoCliente;
    }

    if (!cliente) {
      throw new Error(`No es posible crear u obtener el cliente. Datos: ${JSON.stringify({ nombre: data.nombreCliente, telefono: telefonoLimpio })}`);
    }

    // 2. Buscar o crear tipo de equipo
    let tipoEquipoId = null;
    const { data: tipoExistente } = await supabase
      .from('tipos_equipos')
      .select('id')
      .eq('nombre', data.tipoEquipo.toUpperCase())
      .single();

    if (tipoExistente) {
      tipoEquipoId = tipoExistente.id;
    } else {
      const { data: nuevoTipo, error: errorTipo } = await supabase
        .from('tipos_equipos')
        .insert({ nombre: data.tipoEquipo.toUpperCase() })
        .select()
        .single();

      if (errorTipo) {
        throw new Error(`Error al crear tipo de equipo: ${errorTipo.message}`);
      }

      tipoEquipoId = nuevoTipo.id;
    }

    // 3. Buscar o crear marca/modelo
    let marcaModeloId = null;
    if (data.marca || data.modelo) {
      const { data: marcaExistente } = await supabase
        .from('marcas_modelos')
        .select('id')
        .eq('marca', data.marca?.toUpperCase() || 'SIN MARCA')
        .eq('modelo', data.modelo?.toUpperCase() || 'SIN MODELO')
        .single();

      if (marcaExistente) {
        marcaModeloId = marcaExistente.id;
      } else {
        const { data: nuevaMarca, error: errorMarca } = await supabase
          .from('marcas_modelos')
          .insert({
            marca: data.marca?.toUpperCase() || 'SIN MARCA',
            modelo: data.modelo?.toUpperCase() || 'SIN MODELO',
          })
          .select()
          .single();

        if (errorMarca) {
          throw new Error(`Error al crear marca/modelo: ${errorMarca.message}`);
        }

        marcaModeloId = nuevaMarca.id;
      }
    }

    let empleado_recibe_id = empleadoId;
    let sucursal_id = sucursalId;

    // Si no se encontró sucursal del empleado, buscar la primera disponible
    if (!sucursal_id) {
      const { data: sucursalPrincipal } = await supabase
        .from('sucursales')
        .select('id')
        .limit(1)
        .single();

      sucursal_id = sucursalPrincipal?.id;
    }

    if (!sucursal_id) {
      throw new Error('No se encontró ninguna sucursal configurada');
    }

    // 5. Subir firma si existe
    let firmaUrl = null;
    if (data.firma) {
      try {
        const firmaBase64 = data.firma.split(',')[1];
        const firmaBuffer = Buffer.from(firmaBase64, 'base64');
        const nombreArchivoFirma = `firmas/${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

        const { error: errorFirma } = await supabase.storage
          .from('equipos-fotos')
          .upload(nombreArchivoFirma, firmaBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
          });

        if (!errorFirma) {
          const { data: urlData } = supabase.storage
            .from('equipos-fotos')
            .getPublicUrl(nombreArchivoFirma);
          firmaUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error('Error al subir firma:', err);
      }
    }

    // 6. Crear orden de servicio
    // Generar número de orden único (Formato: ORD-timestamp-random)
    const numeroOrden = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const { data: orden, error: errorOrden } = await supabase
      .from('ordenes_servicio')
      .insert({
        cliente_id: cliente.id,
        sucursal_id: sucursal_id,
        tipo_equipo_id: tipoEquipoId,
        marca_modelo_id: marcaModeloId,
        empleado_recibe_id: empleado_recibe_id,
        numero_serie: data.serie,
        accesorios: data.accesorios,
        problema_reportado: data.problema,
        estado: 'PENDIENTES',
        numero_orden: numeroOrden,
        firma_cliente_url: firmaUrl,
      })
      .select()
      .single();

    if (errorOrden) {
      throw new Error(`Error al crear orden: ${errorOrden.message}`);
    }

    // 7. Registrar creación en historial
    await supabase.from('historial_orden').insert({
      orden_id: orden.id,
      estado_nuevo: 'PENDIENTES',
      accion: 'creacion',
      observaciones: 'Orden de servicio creada inicialmente.'
    });

    // Revalidar las páginas relevantes
    revalidatePath('/');
    revalidatePath('/ordenes');

    return {
      success: true,
      orden,
      message: `Orden ${orden.numero_orden} creada exitosamente`,
    };
  } catch (error) {
    console.error('Error en crearOrden:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function subirFotosOrden(ordenId: string, fotos: FormData) {
  try {
    const supabase = await createClient();
    // Obtener todos los archivos del FormData
    const archivos = fotos.getAll('fotos') as File[];

    // Subir fotos en paralelo para mejor performance
    const promesasSubida = archivos.map(async (archivo, i) => {
      try {
        const extension = archivo.name.split('.').pop() || 'jpg';
        const nombreArchivo = `${ordenId}/${Date.now()}-${i}.${extension}`;

        // Subir a Supabase Storage
        const arrayBuffer = await archivo.arrayBuffer();
        const { error: errorStorage } = await supabase.storage
          .from('equipos-fotos')
          .upload(nombreArchivo, Buffer.from(arrayBuffer), {
            contentType: archivo.type,
            cacheControl: '3600',
          });

        if (errorStorage) throw errorStorage;

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('equipos-fotos')
          .getPublicUrl(nombreArchivo);

        // Guardar registro en la tabla fotos_equipos
        // Usamos ambos campos url y url_foto por compatibilidad con el esquema
        const { data: fotoRegistro, error: errorRegistro } = await supabase
          .from('fotos_equipos')
          .insert({
            orden_id: ordenId,
            url_foto: urlData.publicUrl,
            url: urlData.publicUrl,
            tipo_foto: 'INGRESO',
            tipo: 'INGRESO'
          })
          .select()
          .single();

        if (errorRegistro) throw errorRegistro;
        return fotoRegistro;
      } catch (err) {
        console.error(`Error al procesar foto ${i}:`, err);
        return null;
      }
    });

    const resultados = await Promise.all(promesasSubida);
    const fotosSubidas = resultados.filter(f => f !== null);

    revalidatePath(`/ordenes/${ordenId}`);

    return {
      success: true,
      fotos: fotosSubidas,
      message: `${fotosSubidas.length} foto(s) subida(s) exitosamente`,
    };
  } catch (error) {
    console.error('Error en subirFotosOrden:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export interface Orden {
  id: string;
  numero_orden: string;
  estado: string;
  fecha_ingreso: string;
  updated_at?: string;
  fecha_salida?: string | null;
  costo_estimado?: number | null;
  costo_final?: number | null;
  saldo_pendiente: number;
  observaciones?: string | null;
  cliente: {
    nombre_completo: string;
    telefono: string;
    email?: string | null;
  };
  tipo_equipo: {
    nombre: string;
  };
  marca_modelo?: {
    marca: string;
    modelo: string;
  };
  numero_serie?: string | null;
  accesorios?: string | null;
  problema_reportado?: string;
  diagnostico?: string | null;
  reparacion_realizada?: string | null;
  firma_cliente_url?: string | null;
  sucursal?: {
    id: string;
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    whatsapp: string | null;
    empresa: {
      nombre: string;
      logo_url: string | null;
      email: string | null;
      sitio_web: string | null;
      telefono: string | null;
      dias_almacenamiento?: number;
    };
  } | null;
  empleado_recibe?: {
    id: string;
    nombre_completo: string;
  } | null;
  fotos: Array<{
    id: string;
    url_foto: string;
    tipo_foto: string;
  }>;
  historial: Array<{
    id: string;
    estado_anterior: string | null;
    estado_nuevo: string;
    accion: string;
    observaciones: string | null;
    created_at: string;
  }>;
}

export async function obtenerOrdenes() {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.sucursal?.id) {
      throw new Error('No se pudo identificar la sucursal del usuario');
    }

    const sucursalId = userInfo.user.sucursal.id;
    const supabase = await createClient();

    const { data: ordenes, error } = await supabase
      .from('ordenes_servicio')
      .select(`
        id,
        numero_orden,
        estado,
        fecha_ingreso,
        updated_at,
        fecha_salida,
        costo_estimado,
        costo_final,
        saldo_pendiente,
        numero_serie,
        accesorios,
        problema_reportado,
        diagnostico,
        reparacion_realizada,
        observaciones,
        firma_cliente_url,
        sucursales!ordenes_servicio_sucursal_id_fkey (
          id,
          nombre,
          direccion,
          telefono,
          whatsapp,
          empresa:empresas!sucursales_empresa_id_fkey (
            email,
            sitio_web,
            telefono,
            dias_almacenamiento
          )
        ),
        empleado_recibe:empleados!ordenes_servicio_empleado_recibe_id_fkey (
          id,
          nombre_completo
        ),
        clientes!ordenes_servicio_cliente_id_fkey (
          nombre_completo,
          telefono,
          email
        ),
        tipos_equipos!ordenes_servicio_tipo_equipo_id_fkey (
          nombre
        ),
        marcas_modelos!ordenes_servicio_marca_modelo_id_fkey (
          marca,
          modelo
        ),
        fotos:fotos_equipos (
          id,
          url_foto,
          tipo_foto
        ),
        historial:historial_orden (
          id,
          estado_anterior,
          estado_nuevo,
          accion,
          observaciones,
          created_at
        )
      `)
      .eq('sucursal_id', sucursalId)
      .order('fecha_ingreso', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener órdenes: ${error.message}`);
    }

    // Transformar los datos a la estructura esperada
    const ordenesFormateadas = ordenes?.map((orden: any) => ({
      id: orden.id,
      numero_orden: orden.numero_orden,
      estado: orden.estado,
      fecha_ingreso: orden.fecha_ingreso,
      updated_at: orden.updated_at,
      fecha_salida: orden.fecha_salida,
      costo_estimado: orden.costo_estimado,
      costo_final: orden.costo_final,
      saldo_pendiente: orden.saldo_pendiente || 0,
      sucursal: orden.sucursales ? {
        id: orden.sucursales.id,
        nombre: orden.sucursales.nombre,
        direccion: orden.sucursales.direccion,
        telefono: orden.sucursales.telefono,
        whatsapp: orden.sucursales.whatsapp,
        empresa: {
          nombre: orden.sucursales.empresa?.nombre || 'Taller',
          email: orden.sucursales.empresa?.email,
          sitio_web: orden.sucursales.empresa?.sitio_web,
          telefono: orden.sucursales.empresa?.telefono,
          dias_almacenamiento: orden.sucursales.empresa?.dias_almacenamiento,
        }
      } : null,
      empleado_recibe: orden.empleado_recibe ? {
        id: orden.empleado_recibe.id,
        nombre_completo: orden.empleado_recibe.nombre_completo,
      } : null,
      cliente: {
        nombre_completo: orden.clientes?.nombre_completo || 'Sin nombre',
        telefono: orden.clientes?.telefono || '',
        email: orden.clientes?.email || null,
      },
      tipo_equipo: {
        nombre: orden.tipos_equipos?.nombre || 'Sin tipo',
      },
      marca_modelo: orden.marcas_modelos ? {
        marca: orden.marcas_modelos.marca,
        modelo: orden.marcas_modelos.modelo,
      } : undefined,
      numero_serie: orden.numero_serie,
      accesorios: orden.accesorios,
      problema_reportado: orden.problema_reportado,
      diagnostico: orden.diagnostico,
      reparacion_realizada: orden.reparacion_realizada,
      observaciones: orden.observaciones,
      firma_cliente_url: orden.firma_cliente_url,
      fotos: orden.fotos || [],
      historial: orden.historial || [],
    })) || [];

    return {
      success: true,
      ordenes: ordenesFormateadas,
    };
  } catch (error) {
    console.error('Error en obtenerOrdenes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      ordenes: [],
    };
  }
}

export interface OrdenDetalle {
  id: string;
  numero_orden: string;
  estado: string;
  fecha_ingreso: string;
  updated_at?: string;
  fecha_salida?: string | null;
  cliente: {
    id: string;
    nombre_completo: string;
    telefono: string;
    email: string | null;
  };
  tipo_equipo: {
    nombre: string;
  };
  marca_modelo?: {
    marca: string;
    modelo: string;
  };
  numero_serie: string | null;
  accesorios: string | null;
  problema_reportado: string;
  diagnostico: string | null;
  reparacion_realizada: string | null;
  observaciones: string | null;
  costo_estimado: number | null;
  costo_final: number | null;
  saldo_pendiente: number;
  firma_cliente_url: string | null;
  fotos: Array<{
    id: string;
    url_foto: string;
    tipo_foto: string;
  }>;
  historial: Array<{
    id: string;
    estado_anterior: string | null;
    estado_nuevo: string;
    accion: string;
    observaciones: string | null;
    created_at: string;
  }>;
  sucursal?: {
    nombre: string;
    direccion: string | null;
    telefono: string | null;
    empresa: {
      nombre: string;
      logo_url: string | null;
      telefono: string | null;
      sitio_web: string | null;
      dias_almacenamiento?: number;
    };
    whatsapp: string | null;
  };
  empleado_recibe?: {
    id: string;
    nombre_completo: string;
  } | null;
}

export async function obtenerOrdenPorId(id: string) {
  try {
    const userInfo = await obtenerUserInfo();
    if (!userInfo.success || !userInfo.user?.sucursal?.id) {
      throw new Error('No se pudo identificar la sucursal del usuario');
    }

    const sucursalId = userInfo.user.sucursal.id;
    const supabase = await createClient();

    const { data: orden, error } = await supabase
      .from('ordenes_servicio')
      .select(`
        id,
        numero_orden,
        estado,
        fecha_ingreso,
        updated_at,
        fecha_salida,
        numero_serie,
        accesorios,
        problema_reportado,
        diagnostico,
        reparacion_realizada,
        observaciones,
        costo_estimado,
        costo_final,
        saldo_pendiente,
        firma_cliente_url,
        clientes!ordenes_servicio_cliente_id_fkey (
          id,
          nombre_completo,
          telefono,
          email
        ),
        tipos_equipos!ordenes_servicio_tipo_equipo_id_fkey (
          nombre
        ),
        marcas_modelos!ordenes_servicio_marca_modelo_id_fkey (
          marca,
          modelo
        ),
        sucursal:sucursales(
          nombre,
          direccion,
          telefono,
          whatsapp,
          empresa:empresas(
            nombre,
            logo_url,
            telefono,
            email,
            sitio_web,
            dias_almacenamiento
          )
        ),
        empleado_recibe:empleados!ordenes_servicio_empleado_recibe_id_fkey(
          id,
          nombre_completo
        )
      `)
      .eq('id', id)
      .eq('sucursal_id', sucursalId)
      .single();

    if (error) {
      throw new Error(`Error al obtener orden: ${error.message}`);
    }

    if (!orden) {
      throw new Error('Orden no encontrada');
    }

    // Obtener fotos
    const { data: fotos } = await supabase
      .from('fotos_equipos')
      .select('id, url_foto, tipo_foto')
      .eq('orden_id', id);

    // Obtener historial
    const { data: historial } = await supabase
      .from('historial_orden')
      .select('id, estado_anterior, estado_nuevo, accion, observaciones, created_at')
      .eq('orden_id', id)
      .order('created_at', { ascending: false });

    const clienteData = Array.isArray(orden.clientes) ? orden.clientes[0] : orden.clientes;
    const tipoEquipoData = Array.isArray(orden.tipos_equipos) ? orden.tipos_equipos[0] : orden.tipos_equipos;
    const marcaModeloData = Array.isArray(orden.marcas_modelos) ? orden.marcas_modelos[0] : orden.marcas_modelos;
    const sucursalData = Array.isArray(orden.sucursal) ? orden.sucursal[0] : orden.sucursal;
    const empleadoRecibeData = Array.isArray(orden.empleado_recibe) ? orden.empleado_recibe[0] : orden.empleado_recibe;

    const ordenDetalle: OrdenDetalle = {
      id: orden.id,
      numero_orden: orden.numero_orden,
      estado: orden.estado,
      fecha_ingreso: orden.fecha_ingreso,
      fecha_salida: orden.fecha_salida,
      cliente: {
        id: clienteData?.id || '',
        nombre_completo: clienteData?.nombre_completo || 'Sin nombre',
        telefono: clienteData?.telefono || '',
        email: clienteData?.email || null,
      },
      tipo_equipo: {
        nombre: tipoEquipoData?.nombre || 'Sin tipo',
      },
      marca_modelo: marcaModeloData ? {
        marca: marcaModeloData.marca,
        modelo: marcaModeloData.modelo,
      } : undefined,
      numero_serie: orden.numero_serie,
      accesorios: orden.accesorios,
      problema_reportado: orden.problema_reportado,
      diagnostico: orden.diagnostico,
      reparacion_realizada: orden.reparacion_realizada,
      observaciones: orden.observaciones,
      costo_estimado: orden.costo_estimado,
      costo_final: orden.costo_final,
      saldo_pendiente: orden.saldo_pendiente || 0,
      firma_cliente_url: orden.firma_cliente_url,
      fotos: fotos || [],
      historial: historial || [],
      sucursal: sucursalData ? {
        nombre: sucursalData.nombre,
        direccion: sucursalData.direccion,
        telefono: sucursalData.telefono,
        whatsapp: sucursalData.whatsapp,
        empresa: Array.isArray(sucursalData.empresa) ? sucursalData.empresa[0] : sucursalData.empresa,
      } : undefined,
      empleado_recibe: empleadoRecibeData ? {
        id: empleadoRecibeData.id,
        nombre_completo: empleadoRecibeData.nombre_completo,
      } : null,
    };

    return {
      success: true,
      orden: ordenDetalle,
    };
  } catch (error) {
    console.error('Error en obtenerOrdenPorId:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export interface ActualizarEstadoData {
  ordenId: string;
  nuevoEstado: string;
  observaciones?: string;
  diagnostico?: string;
  reparacionRealizada?: string;
  costoEstimado?: number;
  costoFinal?: number;
}

export async function actualizarEstadoOrden(data: ActualizarEstadoData) {
  try {
    const supabase = await createClient();

    // Obtener estado actual
    const { data: ordenActual, error: errorOrden } = await supabase
      .from('ordenes_servicio')
      .select('estado')
      .eq('id', data.ordenId)
      .single();

    if (errorOrden) {
      throw new Error(`Error al obtener orden: ${errorOrden.message}`);
    }

    const estadoAnterior = ordenActual.estado;

    // Preparar datos de actualización
    const datosActualizacion: any = {
      estado: data.nuevoEstado,
    };

    if (data.diagnostico !== undefined) {
      datosActualizacion.diagnostico = data.diagnostico;
    }

    if (data.reparacionRealizada !== undefined) {
      datosActualizacion.reparacion_realizada = data.reparacionRealizada;
    }

    if (data.observaciones !== undefined) {
      datosActualizacion.observaciones = data.observaciones;
    }

    if (data.costoEstimado !== undefined) {
      datosActualizacion.costo_estimado = data.costoEstimado;
    }

    if (data.costoFinal !== undefined) {
      datosActualizacion.costo_final = data.costoFinal;
    }

    // Si el nuevo estado es ENTREGADO, establecer fecha de salida
    if (data.nuevoEstado === 'ENTREGADO') {
      datosActualizacion.fecha_salida = new Date().toISOString();
    }

    // Actualizar orden
    const { error: errorActualizar } = await supabase
      .from('ordenes_servicio')
      .update(datosActualizacion)
      .eq('id', data.ordenId);

    if (errorActualizar) {
      throw new Error(`Error al actualizar orden: ${errorActualizar.message}`);
    }

    // Registrar en historial
    const { error: errorHistorial } = await supabase
      .from('historial_orden')
      .insert({
        orden_id: data.ordenId,
        estado_anterior: estadoAnterior,
        estado_nuevo: data.nuevoEstado,
        accion: 'cambio_estado',
        observaciones: data.observaciones,
      });

    if (errorHistorial) {
      console.error('Error al registrar historial:', errorHistorial);
    }

    revalidatePath(`/ordenes/${data.ordenId}`);
    revalidatePath('/ordenes');

    return {
      success: true,
      message: 'Estado actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error en actualizarEstadoOrden:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

export async function eliminarOrden(id: string) {
  try {
    const supabase = await createClient();

    console.log(`Intentando eliminar orden ID: ${id}`);

    // Gracias al ON DELETE CASCADE, esto borrará también fotos e historial
    const { error, count } = await supabase
      .from('ordenes_servicio')
      .delete({ count: 'exact' })
      .eq('id', id);

    console.log(`Resultado eliminación - Error:`, error, `Count:`, count);

    if (error) {
      throw new Error(`Error al eliminar orden: ${error.message}`);
    }

    if (count === 0) {
      return {
        success: false,
        error: "No se encontró la orden o no tienes permisos para eliminarla.",
      };
    }

    revalidatePath('/ordenes');
    revalidatePath(`/ordenes/${id}`);

    return {
      success: true,
      message: 'Orden eliminada exitosamente',
    };
  } catch (error) {
    console.error('Error en eliminarOrden:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}
