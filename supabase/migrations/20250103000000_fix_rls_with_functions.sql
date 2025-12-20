-- Crear funciones de seguridad para evitar recursión

-- Función para obtener empresa_id del usuario actual
CREATE OR REPLACE FUNCTION public.current_user_empresa_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT empresa_id
  FROM public.empleados
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.empleados
    WHERE auth_user_id = auth.uid()
    AND rol = 'admin'
  );
$$;

-- Función para verificar si el usuario es admin de una empresa específica
CREATE OR REPLACE FUNCTION public.is_admin_of_empresa(empresa_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.empleados
    WHERE auth_user_id = auth.uid()
    AND empresa_id = empresa_uuid
    AND rol = 'admin'
  );
$$;

-- EMPLEADOS: Recrear políticas usando funciones
DROP POLICY IF EXISTS "Usuarios pueden ver empleados de su empresa" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden crear empleados" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden actualizar empleados" ON public.empleados;
DROP POLICY IF EXISTS "Admins pueden eliminar empleados" ON public.empleados;

CREATE POLICY "Usuarios pueden ver empleados de su empresa" ON public.empleados
    FOR SELECT USING (
        empresa_id = public.current_user_empresa_id()
    );

CREATE POLICY "Admins pueden crear empleados" ON public.empleados
    FOR INSERT WITH CHECK (
        -- Permitir si no hay empleados (primer registro)
        NOT EXISTS (SELECT 1 FROM public.empleados)
        OR
        -- O si es admin de la empresa
        public.is_admin_of_empresa(empresa_id)
    );

CREATE POLICY "Admins pueden actualizar empleados" ON public.empleados
    FOR UPDATE USING (
        public.is_admin_of_empresa(empresa_id)
    );

CREATE POLICY "Admins pueden eliminar empleados" ON public.empleados
    FOR DELETE USING (
        public.is_admin_of_empresa(empresa_id)
    );

-- EMPRESAS: Recrear políticas usando funciones
DROP POLICY IF EXISTS "Usuarios pueden ver su propia empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins pueden actualizar su empresa" ON public.empresas;
DROP POLICY IF EXISTS "Admins pueden insertar empresa" ON public.empresas;

CREATE POLICY "Usuarios pueden ver su propia empresa" ON public.empresas
    FOR SELECT USING (
        id = public.current_user_empresa_id()
    );

CREATE POLICY "Admins pueden actualizar su empresa" ON public.empresas
    FOR UPDATE USING (
        public.is_admin_of_empresa(id)
    );

CREATE POLICY "Admins pueden insertar empresa" ON public.empresas
    FOR INSERT WITH CHECK (true);

-- SUCURSALES: Recrear políticas usando funciones
DROP POLICY IF EXISTS "Usuarios pueden ver sucursales de su empresa" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden crear sucursales" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden actualizar sucursales" ON public.sucursales;
DROP POLICY IF EXISTS "Admins pueden eliminar sucursales" ON public.sucursales;

CREATE POLICY "Usuarios pueden ver sucursales de su empresa" ON public.sucursales
    FOR SELECT USING (
        empresa_id = public.current_user_empresa_id()
    );

CREATE POLICY "Admins pueden crear sucursales" ON public.sucursales
    FOR INSERT WITH CHECK (
        public.is_admin_of_empresa(empresa_id)
    );

CREATE POLICY "Admins pueden actualizar sucursales" ON public.sucursales
    FOR UPDATE USING (
        public.is_admin_of_empresa(empresa_id)
    );

CREATE POLICY "Admins pueden eliminar sucursales" ON public.sucursales
    FOR DELETE USING (
        public.is_admin_of_empresa(empresa_id)
    );
