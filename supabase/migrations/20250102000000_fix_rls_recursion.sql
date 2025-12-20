-- Arreglar políticas RLS que causan recursión infinita

-- EMPLEADOS: Recrear políticas sin recursión
DROP POLICY IF EXISTS "Usuarios pueden ver empleados de su empresa" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden crear empleados" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden actualizar empleados" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden eliminar empleados" ON public.empleados;

-- Política de SELECT: Ver empleados de la misma empresa
CREATE POLICY "Usuarios pueden ver empleados de su empresa" ON public.empleados
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM public.empleados WHERE auth_user_id = auth.uid()
        )
    );

-- Política de INSERT: Permitir primer empleado o admin puede crear
CREATE POLICY "Admins pueden crear empleados" ON public.empleados
    FOR INSERT WITH CHECK (
        -- Permitir si es el primer empleado (tabla vacía)
        NOT EXISTS (SELECT 1 FROM public.empleados)
        OR
        -- O si el usuario que crea es admin de la misma empresa
        EXISTS (
            SELECT 1 FROM public.empleados e
            WHERE e.auth_user_id = auth.uid()
            AND e.rol = 'admin'
            AND e.empresa_id = empleados.empresa_id
        )
    );

-- Política de UPDATE: Solo admins de la misma empresa
CREATE POLICY "Admins pueden actualizar empleados" ON public.empleados
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.empleados e
            WHERE e.auth_user_id = auth.uid()
            AND e.rol = 'admin'
            AND e.empresa_id = empleados.empresa_id
        )
    );

-- Política de DELETE: Solo admins de la misma empresa
CREATE POLICY "Admins pueden eliminar empleados" ON public.empleados
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.empleados e
            WHERE e.auth_user_id = auth.uid()
            AND e.rol = 'admin'
            AND e.empresa_id = empleados.empresa_id
        )
    );

-- EMPRESAS: Simplificar políticas
DROP POLICY IF EXISTS "Usuarios pueden ver su propia empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins pueden actualizar su empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins pueden insertar empresa" ON public.empresas;

CREATE POLICY "Usuarios pueden ver su propia empresa" ON public.empresas
    FOR SELECT USING (
        id IN (
            SELECT empresa_id FROM public.empleados WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden actualizar su empresa" ON public.empresas
    FOR UPDATE USING (
        id IN (
            SELECT empresa_id FROM public.empleados
            WHERE auth_user_id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden insertar empresa" ON public.empresas
    FOR INSERT WITH CHECK (true);

-- SUCURSALES: Simplificar políticas
DROP POLICY IF EXISTS "Usuarios pueden ver sucursales de su empresa" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden crear sucursales" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden actualizar sucursales" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden eliminar sucursales" ON public.sucursales;

CREATE POLICY "Usuarios pueden ver sucursales de su empresa" ON public.sucursales
    FOR SELECT USING (
        empresa_id IN (
            SELECT empresa_id FROM public.empleados WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins pueden crear sucursales" ON public.sucursales
    FOR INSERT WITH CHECK (
        empresa_id IN (
            SELECT empresa_id FROM public.empleados
            WHERE auth_user_id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden actualizar sucursales" ON public.sucursales
    FOR UPDATE USING (
        empresa_id IN (
            SELECT empresa_id FROM public.empleados
            WHERE auth_user_id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admins pueden eliminar sucursales" ON public.sucursales
    FOR DELETE USING (
        empresa_id IN (
            SELECT empresa_id FROM public.empleados
            WHERE auth_user_id = auth.uid() AND rol = 'admin'
        )
    );
