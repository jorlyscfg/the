-- Agregar empresa_id a empleados (falta en la estructura actual)
ALTER TABLE public.empleados ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Crear índice para empresa_id en empleados
CREATE INDEX IF NOT EXISTS idx_empleados_empresa_id ON public.empleados(empresa_id);

-- Actualizar las políticas RLS existentes para multi-tenancy

-- EMPRESAS: Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver su propia empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins pueden actualizar su empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins pueden insertar empresa" ON public.empresas;

CREATE POLICY "Usuarios pueden ver su propia empresa" ON public.empresas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.empresa_id = empresas.id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden actualizar su empresa" ON public.empresas
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.empresa_id = empresas.id
            AND empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden insertar empresa" ON public.empresas
    FOR INSERT WITH CHECK (true); -- Solo durante el registro inicial

-- SUCURSALES: Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver sucursales de su empresa" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden crear sucursales" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden actualizar sucursales" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden eliminar sucursales" ON public.sucursales;

CREATE POLICY "Usuarios pueden ver sucursales de su empresa" ON public.sucursales
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.empresa_id = sucursales.empresa_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden crear sucursales" ON public.sucursales
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.empresa_id = sucursales.empresa_id
            AND empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden actualizar sucursales" ON public.sucursales
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.empresa_id = sucursales.empresa_id
            AND empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden eliminar sucursales" ON public.sucursales
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.empresa_id = sucursales.empresa_id
            AND empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

-- EMPLEADOS: Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver empleados de su empresa" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden crear empleados" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden actualizar empleados" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden eliminar empleados" ON public.empleados;

CREATE POLICY "Usuarios pueden ver empleados de su empresa" ON public.empleados
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados e
            WHERE e.empresa_id = empleados.empresa_id
            AND e.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden crear empleados" ON public.empleados
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.empleados e
            WHERE e.empresa_id = empleados.empresa_id
            AND e.auth_user_id = auth.uid()
            AND e.rol = 'admin'
        )
        OR NOT EXISTS (SELECT 1 FROM public.empleados) -- Permitir primer empleado
    );

CREATE POLICY "Admins pueden actualizar empleados" ON public.empleados
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados e
            WHERE e.empresa_id = empleados.empresa_id
            AND e.auth_user_id = auth.uid()
            AND e.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden eliminar empleados" ON public.empleados
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.empleados e
            WHERE e.empresa_id = empleados.empresa_id
            AND e.auth_user_id = auth.uid()
            AND e.rol = 'admin'
        )
    );

-- CLIENTES: Políticas RLS actualizadas
DROP POLICY IF EXISTS "Usuarios pueden ver clientes de su sucursal" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios pueden crear clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios pueden actualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios pueden eliminar clientes" ON public.clientes;

CREATE POLICY "Usuarios pueden ver clientes de su sucursal" ON public.clientes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.sucursal_id = clientes.sucursal_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden crear clientes" ON public.clientes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.sucursal_id = clientes.sucursal_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden actualizar clientes" ON public.clientes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.sucursal_id = clientes.sucursal_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden eliminar clientes" ON public.clientes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.sucursal_id = clientes.sucursal_id
            AND empleados.auth_user_id = auth.uid()
            AND empleados.rol IN ('admin', 'recepcionista')
        )
    );

-- ORDENES_SERVICIO: Políticas RLS actualizadas
DROP POLICY IF EXISTS "Usuarios pueden ver ordenes de su sucursal" ON public.ordenes_servicio;
DROP POLICY IF EXISTS "Usuarios pueden crear ordenes" ON public.ordenes_servicio;
DROP POLICY IF EXISTS "Usuarios pueden actualizar ordenes" ON public.ordenes_servicio;

CREATE POLICY "Usuarios pueden ver ordenes de su sucursal" ON public.ordenes_servicio
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.sucursal_id = ordenes_servicio.sucursal_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden crear ordenes" ON public.ordenes_servicio
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.sucursal_id = ordenes_servicio.sucursal_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden actualizar ordenes" ON public.ordenes_servicio
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.sucursal_id = ordenes_servicio.sucursal_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

-- TIPOS_EQUIPOS: Políticas RLS (compartido entre todas las empresas o por empresa)
DROP POLICY IF EXISTS "Todos pueden ver tipos de equipos" ON public.tipos_equipos;
DROP POLICY IF EXISTS "Admins pueden crear tipos de equipos" ON public.tipos_equipos;
DROP POLICY IF EXISTS "Admins pueden actualizar tipos de equipos" ON public.tipos_equipos;

CREATE POLICY "Todos pueden ver tipos de equipos" ON public.tipos_equipos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden crear tipos de equipos" ON public.tipos_equipos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden actualizar tipos de equipos" ON public.tipos_equipos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

-- MARCAS_MODELOS: Políticas RLS
DROP POLICY IF EXISTS "Todos pueden ver marcas y modelos" ON public.marcas_modelos;
DROP POLICY IF EXISTS "Admins pueden crear marcas y modelos" ON public.marcas_modelos;
DROP POLICY IF EXISTS "Admins pueden actualizar marcas y modelos" ON public.marcas_modelos;

CREATE POLICY "Todos pueden ver marcas y modelos" ON public.marcas_modelos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden crear marcas y modelos" ON public.marcas_modelos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden actualizar marcas y modelos" ON public.marcas_modelos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            WHERE empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

-- CONFIGURACION_SUCURSAL: Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver config de su sucursal" ON public.configuracion_sucursal;
DROP POLICY IF EXISTS "Admins pueden actualizar config de su sucursal" ON public.configuracion_sucursal;

CREATE POLICY "Usuarios pueden ver config de su sucursal" ON public.configuracion_sucursal
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            INNER JOIN public.sucursales ON sucursales.id = empleados.sucursal_id
            WHERE sucursales.id = configuracion_sucursal.sucursal_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden actualizar config de su sucursal" ON public.configuracion_sucursal
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.empleados
            INNER JOIN public.sucursales ON sucursales.id = empleados.sucursal_id
            WHERE sucursales.id = configuracion_sucursal.sucursal_id
            AND empleados.auth_user_id = auth.uid()
            AND empleados.rol = 'admin'
        )
    );

-- FOTOS_EQUIPOS: Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver fotos de ordenes de su sucursal" ON public.fotos_equipos;
DROP POLICY IF EXISTS "Usuarios pueden crear fotos" ON public.fotos_equipos;

CREATE POLICY "Usuarios pueden ver fotos de ordenes de su sucursal" ON public.fotos_equipos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordenes_servicio
            INNER JOIN public.empleados ON empleados.sucursal_id = ordenes_servicio.sucursal_id
            WHERE ordenes_servicio.id = fotos_equipos.orden_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden crear fotos" ON public.fotos_equipos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ordenes_servicio
            INNER JOIN public.empleados ON empleados.sucursal_id = ordenes_servicio.sucursal_id
            WHERE ordenes_servicio.id = fotos_equipos.orden_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

-- HISTORIAL_ORDEN: Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver historial de ordenes de su sucursal" ON public.historial_orden;
DROP POLICY IF EXISTS "Usuarios pueden crear historial" ON public.historial_orden;

CREATE POLICY "Usuarios pueden ver historial de ordenes de su sucursal" ON public.historial_orden
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordenes_servicio
            INNER JOIN public.empleados ON empleados.sucursal_id = ordenes_servicio.sucursal_id
            WHERE ordenes_servicio.id = historial_orden.orden_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden crear historial" ON public.historial_orden
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ordenes_servicio
            INNER JOIN public.empleados ON empleados.sucursal_id = ordenes_servicio.sucursal_id
            WHERE ordenes_servicio.id = historial_orden.orden_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

-- PAGOS: Políticas RLS
DROP POLICY IF EXISTS "Usuarios pueden ver pagos de ordenes de su sucursal" ON public.pagos;
DROP POLICY IF EXISTS "Usuarios pueden crear pagos" ON public.pagos;

CREATE POLICY "Usuarios pueden ver pagos de ordenes de su sucursal" ON public.pagos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ordenes_servicio
            INNER JOIN public.empleados ON empleados.sucursal_id = ordenes_servicio.sucursal_id
            WHERE ordenes_servicio.id = pagos.orden_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Usuarios pueden crear pagos" ON public.pagos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ordenes_servicio
            INNER JOIN public.empleados ON empleados.sucursal_id = ordenes_servicio.sucursal_id
            WHERE ordenes_servicio.id = pagos.orden_id
            AND empleados.auth_user_id = auth.uid()
        )
    );

-- Comentarios
COMMENT ON COLUMN public.empleados.empresa_id IS 'ID de la empresa a la que pertenece el empleado';
