-- Crear tabla de empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rfc VARCHAR(13),
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    logo_url TEXT,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear tabla de sucursales
CREATE TABLE IF NOT EXISTS public.sucursales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    es_principal BOOLEAN DEFAULT false,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Crear tabla de empleados
CREATE TABLE IF NOT EXISTS public.empleados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
    sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(50) NOT NULL, -- 'admin', 'tecnico', 'recepcionista'
    activo BOOLEAN DEFAULT true,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Agregar columna empresa_id y sucursal_id a clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL;

-- Agregar columna empresa_id y sucursal_id a ordenes_servicio
ALTER TABLE public.ordenes_servicio ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;
ALTER TABLE public.ordenes_servicio ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL;
ALTER TABLE public.ordenes_servicio ADD COLUMN IF NOT EXISTS tecnico_asignado_id UUID REFERENCES public.empleados(id) ON DELETE SET NULL;

-- Agregar columna empresa_id a equipos
ALTER TABLE public.equipos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Agregar columna empresa_id a tipos_equipos
ALTER TABLE public.tipos_equipos ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_sucursales_empresa_id ON public.sucursales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empleados_empresa_id ON public.empleados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empleados_sucursal_id ON public.empleados(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa_id ON public.clientes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_empresa_id ON public.ordenes_servicio(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_sucursal_id ON public.ordenes_servicio(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_equipos_empresa_id ON public.equipos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tipos_equipos_empresa_id ON public.tipos_equipos(empresa_id);

-- Habilitar RLS (Row Level Security) en las nuevas tablas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para empresas (solo el admin de la empresa puede ver/editar)
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

-- Políticas RLS para sucursales
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

-- Políticas RLS para empleados
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

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear triggers para updated_at
DROP TRIGGER IF EXISTS update_empresas_updated_at ON public.empresas;
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sucursales_updated_at ON public.sucursales;
CREATE TRIGGER update_sucursales_updated_at BEFORE UPDATE ON public.sucursales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_empleados_updated_at ON public.empleados;
CREATE TRIGGER update_empleados_updated_at BEFORE UPDATE ON public.empleados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios en las tablas
COMMENT ON TABLE public.empresas IS 'Tabla de empresas/talleres que usan el sistema';
COMMENT ON TABLE public.sucursales IS 'Sucursales de cada empresa';
COMMENT ON TABLE public.empleados IS 'Empleados de las empresas con acceso al sistema';
COMMENT ON COLUMN public.empleados.rol IS 'Rol del empleado: admin, tecnico, recepcionista';
