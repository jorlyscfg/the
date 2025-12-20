# Plan de Implementación - Sistema de Gestión de Taller de Reparaciones

## 1. INFORMACIÓN DEL PROYECTO

**Nombre:** TH Empresarial - Sistema de Gestión de Taller
**Tipo:** Aplicación Web (Mobile First - PWA)
**Stack Tecnológico:**
- Next.js 16 con App Router
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- Supabase (Backend & Base de Datos PostgreSQL)
- NextAuth para autenticación
- Generación de QR Codes

---

## 2. ANÁLISIS DEL TICKET FÍSICO ACTUAL

Del ticket proporcionado se identifican los siguientes campos:

### Información de la Empresa
- Logo y nombre: "TINTA HOUSE" y "TH Empresarial"
- Horario de atención
- Teléfono de contacto WhatsApp

### Información de la Orden
- **Fecha:** Campo manual
- **Orden de Servicio:** Número correlativo (ej: 5099)

### Información del Cliente
- **Nombre:** Campo de texto libre
- **Teléfono:** Campo de texto libre

### Datos del Equipo
- **Tipo de equipo:** Buscador/Selector con autocompletado (IMPRESORA, LAPTOP, CPU, DVR, etc.) - Lista creciente
- **Marca/Modelo:** Buscador con autocompletado - Se registra automáticamente si no existe
- **Detalles del equipo:** Campo de texto largo para descripción del problema/estado
- **Fotos del equipo:** Múltiples fotos desde cámara o galería (evidencia visual)
- **Cargador:** Checkbox (SÍ / NO)
- **Anticipo:** Campo numérico para pago adelantado

### Términos y Condiciones
- Revisión: costo mínimo de $250 pesos
- Política de reciclaje después de 30 días
- Aceptación de condiciones al recibir

### Firmas
- **Firma de conformidad:** Cliente
- **Técnico que recibe:** Empleado del taller

---

## 3. ARQUITECTURA DE BASE DE DATOS

### 3.1. Diagrama Entidad-Relación

```
┌─────────────────┐
│    empresas     │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────┴────────┐              ┌──────────────────┐
│    sucursales   │              │ tipos_equipos    │
└────────┬────────┘              └──────────────────┘
         │ 1                              │ 1
         ├─────────────┐                  │
         │ N           │ N                │ N
┌────────┴────────┐ ┌──┴──────────┐   ┌──┴──────────────┐
│   empleados     │ │   clientes  │   │ marcas_modelos  │
└────────┬────────┘ └──┬──────────┘   └──┬──────────────┘
         │ N           │ 1               │ 1
         │             │                 │
         │ 1           │                 │ N
┌────────┴─────────────┴─────────────────┴──┐
│          ordenes_servicio                  │
└────────┬───────────────────────────────────┘
         │ 1                │ 1
         │                  │
         │ N                │ N
┌────────┴────────┐    ┌────┴──────────────┐
│ historial_orden │    │  fotos_equipos    │
└─────────────────┘    └───────────────────┘
```

### 3.2. Tablas Principales

#### **empresas**
Tabla maestra para soporte multi-empresa (escalabilidad futura)
```sql
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  razon_social VARCHAR(255),
  rfc VARCHAR(13),
  logo_url TEXT,
  telefono VARCHAR(20),
  email VARCHAR(255),
  sitio_web VARCHAR(255),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **sucursales**
Tiendas/talleres de cada empresa
```sql
CREATE TABLE sucursales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  direccion TEXT,
  telefono VARCHAR(20),
  whatsapp VARCHAR(20), -- Para notificaciones automáticas
  horario_apertura TIME,
  horario_cierre TIME,
  horario_sabado_apertura TIME,
  horario_sabado_cierre TIME,
  coordenadas JSONB, -- {lat, lng} para geolocalización futura
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **empleados**
Técnicos y personal del taller
```sql
CREATE TABLE empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id), -- Relación con Supabase Auth
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20),
  email VARCHAR(255) UNIQUE,
  rol VARCHAR(50) NOT NULL, -- 'admin', 'gerente', 'tecnico', 'recepcionista'
  foto_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **clientes**
Registro de clientes del taller
```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(255) NOT NULL,
  telefono VARCHAR(20) NOT NULL, -- Principal medio de contacto
  email VARCHAR(255),
  direccion TEXT,
  notas TEXT, -- Información adicional del cliente
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índice para búsqueda rápida
  CONSTRAINT unique_telefono_sucursal UNIQUE(telefono, sucursal_id)
);
```

#### **tipos_equipos**
Catálogo de tipos de equipos (escalable)
```sql
CREATE TABLE tipos_equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL UNIQUE, -- 'IMPRESORA', 'LAPTOP', 'CPU', 'DVR', etc.
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  veces_usado INTEGER DEFAULT 0, -- Contador de uso para estadísticas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar tipos iniciales
INSERT INTO tipos_equipos (nombre) VALUES
  ('IMPRESORA'),
  ('LAPTOP'),
  ('CPU'),
  ('DVR'),
  ('OTRO');
```

#### **marcas_modelos**
Catálogo de marcas y modelos de equipos (auto-poblado)
```sql
CREATE TABLE marcas_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_equipo_id UUID REFERENCES tipos_equipos(id) ON DELETE CASCADE,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT true,
  veces_usado INTEGER DEFAULT 0, -- Contador de uso para estadísticas
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Evitar duplicados de marca-modelo por tipo
  CONSTRAINT unique_marca_modelo_tipo UNIQUE(tipo_equipo_id, marca, modelo)
);
```

#### **fotos_equipos**
Fotos de evidencia de los equipos
```sql
CREATE TABLE fotos_equipos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  url TEXT NOT NULL, -- URL en Supabase Storage
  tipo VARCHAR(50) DEFAULT 'ingreso', -- 'ingreso', 'diagnostico', 'reparacion', 'entrega'
  descripcion TEXT,
  orden_visualizacion INTEGER, -- Para ordenar las fotos
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **ordenes_servicio**
Tabla central del sistema - Replica el ticket físico
```sql
CREATE TABLE ordenes_servicio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_orden INTEGER NOT NULL, -- Auto-incrementable por sucursal
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  empleado_recibe_id UUID REFERENCES empleados(id) ON DELETE RESTRICT,
  empleado_asignado_id UUID REFERENCES empleados(id) ON DELETE SET NULL,

  -- Datos del equipo
  tipo_equipo_id UUID REFERENCES tipos_equipos(id) ON DELETE RESTRICT,
  marca_modelo_id UUID REFERENCES marcas_modelos(id) ON DELETE SET NULL, -- Opcional, puede ser NULL si se ingresa manualmente
  marca_manual VARCHAR(100), -- Si no se encuentra en el catálogo
  modelo_manual VARCHAR(100), -- Si no se encuentra en el catálogo
  detalles_equipo TEXT, -- Descripción del problema/estado
  incluye_cargador BOOLEAN DEFAULT false,
  accesorios_incluidos TEXT[], -- Array de accesorios entregados

  -- Datos financieros
  anticipo DECIMAL(10, 2) DEFAULT 0,
  costo_reparacion DECIMAL(10, 2),
  costo_total DECIMAL(10, 2),
  saldo_pendiente DECIMAL(10, 2),

  -- Estados y fechas
  estado VARCHAR(50) DEFAULT 'recibido',
  -- Estados: 'recibido', 'en_diagnostico', 'diagnosticado', 'en_reparacion',
  --          'reparado', 'no_reparable', 'entregado', 'cancelado'

  prioridad VARCHAR(20) DEFAULT 'normal', -- 'baja', 'normal', 'alta', 'urgente'

  fecha_ingreso TIMESTAMPTZ DEFAULT NOW(),
  fecha_promesa_entrega TIMESTAMPTZ,
  fecha_diagnostico TIMESTAMPTZ,
  fecha_reparacion TIMESTAMPTZ,
  fecha_entrega TIMESTAMPTZ,

  -- Firma digital (base64 o URL de imagen)
  firma_cliente_url TEXT,

  -- Notificaciones
  notificacion_whatsapp_enviada BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índice único por sucursal
  CONSTRAINT unique_numero_orden_sucursal UNIQUE(numero_orden, sucursal_id)
);
```

#### **historial_orden**
Auditoría de cambios en las órdenes
```sql
CREATE TABLE historial_orden (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  empleado_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
  accion VARCHAR(100) NOT NULL, -- 'creado', 'cambio_estado', 'actualizado', etc.
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  comentario TEXT,
  datos_cambio JSONB, -- Registro detallado de qué cambió
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **pagos**
Registro de pagos (anticipo y saldo)
```sql
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  empleado_registra_id UUID REFERENCES empleados(id) ON DELETE SET NULL,
  monto DECIMAL(10, 2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL, -- 'efectivo', 'tarjeta', 'transferencia'
  tipo_pago VARCHAR(50) NOT NULL, -- 'anticipo', 'pago_final', 'abono'
  referencia VARCHAR(255), -- Para transferencias/tarjetas
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **configuracion_sucursal**
Configuración personalizable por sucursal
```sql
CREATE TABLE configuracion_sucursal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sucursal_id UUID REFERENCES sucursales(id) ON DELETE CASCADE UNIQUE,

  -- Configuración de ticket
  costo_minimo_revision DECIMAL(10, 2) DEFAULT 250.00,
  dias_limite_reciclaje INTEGER DEFAULT 30,
  mensaje_terminos_condiciones TEXT,

  -- Configuración de notificaciones
  notificar_whatsapp_ingreso BOOLEAN DEFAULT true,
  notificar_whatsapp_diagnostico BOOLEAN DEFAULT true,
  notificar_whatsapp_listo BOOLEAN DEFAULT true,
  plantilla_mensaje_ingreso TEXT,
  plantilla_mensaje_diagnostico TEXT,
  plantilla_mensaje_listo TEXT,

  -- Numeración de órdenes
  ultimo_numero_orden INTEGER DEFAULT 0,
  prefijo_orden VARCHAR(10), -- Ej: 'TH-', 'SUCURSAL1-'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3. Índices para Optimización

```sql
-- Búsqueda rápida de órdenes
CREATE INDEX idx_ordenes_sucursal_estado ON ordenes_servicio(sucursal_id, estado);
CREATE INDEX idx_ordenes_cliente ON ordenes_servicio(cliente_id);
CREATE INDEX idx_ordenes_fecha_ingreso ON ordenes_servicio(fecha_ingreso DESC);
CREATE INDEX idx_ordenes_numero ON ordenes_servicio(numero_orden, sucursal_id);
CREATE INDEX idx_ordenes_tipo_equipo ON ordenes_servicio(tipo_equipo_id);

-- Búsqueda de clientes
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_nombre ON clientes(nombre_completo);

-- Historial
CREATE INDEX idx_historial_orden ON historial_orden(orden_id, created_at DESC);

-- Empleados
CREATE INDEX idx_empleados_sucursal ON empleados(sucursal_id, activo);

-- Tipos de equipos y marcas/modelos
CREATE INDEX idx_tipos_equipos_nombre ON tipos_equipos(nombre);
CREATE INDEX idx_marcas_modelos_tipo ON marcas_modelos(tipo_equipo_id);
CREATE INDEX idx_marcas_modelos_marca ON marcas_modelos(marca);
CREATE INDEX idx_marcas_modelos_veces_usado ON marcas_modelos(veces_usado DESC);

-- Fotos de equipos
CREATE INDEX idx_fotos_orden ON fotos_equipos(orden_id, orden_visualizacion);
```

### 3.4. Row Level Security (RLS)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_sucursal ENABLE ROW LEVEL SECURITY;

-- Políticas (ejemplo básico, se refinarán en implementación)
-- Los empleados solo ven datos de su sucursal
CREATE POLICY "Empleados ven su sucursal" ON ordenes_servicio
  FOR SELECT
  USING (
    sucursal_id IN (
      SELECT sucursal_id FROM empleados
      WHERE auth_user_id = auth.uid()
    )
  );
```

---

## 4. ESTRUCTURA DE LA APLICACIÓN NEXT.JS

### 4.1. Estructura de Carpetas

```
/root/development/the/
├── src/
│   ├── app/                          # App Router de Next.js
│   │   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   │   ├── login/
│   │   │   └── registro/
│   │   ├── (dashboard)/              # Rutas protegidas
│   │   │   ├── layout.tsx            # Layout con sidebar
│   │   │   ├── page.tsx              # Dashboard principal
│   │   │   ├── ordenes/              # Gestión de órdenes
│   │   │   │   ├── page.tsx          # Lista de órdenes
│   │   │   │   ├── nueva/            # Crear orden
│   │   │   │   ├── [id]/             # Ver/Editar orden
│   │   │   │   └── ticket/[id]/      # Imprimir ticket
│   │   │   ├── clientes/             # Gestión de clientes
│   │   │   ├── inventario/           # Control de equipos (opcional)
│   │   │   ├── reportes/             # Reportes y estadísticas
│   │   │   └── configuracion/        # Configuración de sucursal
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   ├── ordenes/
│   │   │   ├── clientes/
│   │   │   ├── equipos/              # CRUD de tipos y marcas/modelos
│   │   │   ├── upload/               # Upload de imágenes
│   │   │   └── pdf/                  # Generación de PDFs
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css               # Estilos globales Tailwind
│   │
│   ├── components/                   # Componentes React
│   │   ├── ui/                       # Componentes base (botones, inputs, etc.)
│   │   ├── ordenes/
│   │   │   ├── FormularioOrden.tsx
│   │   │   ├── BuscadorTipoEquipo.tsx
│   │   │   ├── BuscadorMarcaModelo.tsx
│   │   │   ├── CapturaFotos.tsx
│   │   │   ├── GaleriaFotos.tsx
│   │   │   ├── TablaOrdenes.tsx
│   │   │   ├── DetalleOrden.tsx
│   │   │   ├── CambioEstado.tsx
│   │   │   └── TicketImpresion.tsx
│   │   ├── clientes/
│   │   │   ├── FormularioCliente.tsx
│   │   │   └── BuscadorCliente.tsx
│   │   ├── dashboard/
│   │   │   ├── EstadisticasTarjeta.tsx
│   │   │   └── GraficoOrdenes.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MobileMenu.tsx
│   │   └── shared/
│   │       ├── Modal.tsx
│   │       ├── Loading.tsx
│   │       └── ErrorBoundary.tsx
│   │
│   ├── lib/                          # Utilidades y configuración
│   │   ├── supabase/
│   │   │   ├── client.ts             # Cliente de Supabase para browser
│   │   │   ├── server.ts             # Cliente de Supabase para server
│   │   │   ├── database.types.ts     # Tipos generados de la DB
│   │   │   └── storage.ts            # Helpers para Supabase Storage
│   │   ├── utils/
│   │   │   ├── formatters.ts         # Formateo de fechas, moneda, etc.
│   │   │   ├── validators.ts         # Validaciones con Zod
│   │   │   ├── pdf-generator.ts      # Generación de PDFs
│   │   │   ├── whatsapp.ts           # Helper para abrir WhatsApp Web
│   │   │   └── image-upload.ts       # Compresión y upload de imágenes
│   │   └── constants.ts              # Constantes globales
│   │
│   ├── hooks/                        # React Hooks personalizados
│   │   ├── useOrdenes.ts
│   │   ├── useClientes.ts
│   │   ├── useAuth.ts
│   │   ├── useTiposEquipos.ts
│   │   ├── useMarcasModelos.ts
│   │   └── useImageUpload.ts
│   │
│   ├── types/                        # Tipos TypeScript
│   │   ├── database.ts
│   │   ├── orden.ts
│   │   └── cliente.ts
│   │
│   └── middleware.ts                 # Middleware de autenticación
│
├── public/                           # Archivos estáticos
│   ├── images/
│   │   └── logo.png
│   └── icons/
│
├── supabase/                         # Migraciones y configuración de Supabase
│   └── migrations/
│       ├── 001_create_tables.sql
│       ├── 002_create_indexes.sql
│       └── 003_create_rls_policies.sql
│
├── .env.local                        # Variables de entorno
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. FUNCIONALIDADES PRINCIPALES

### 5.1. Módulo de Autenticación
- [ ] Login con email/contraseña (NextAuth + Supabase Auth)
- [ ] Registro de nuevos empleados (solo admin)
- [ ] Recuperación de contraseña
- [ ] Gestión de roles y permisos
- [ ] Sesión persistente

### 5.2. Dashboard Principal
- [ ] Resumen de órdenes por estado (tarjetas con contadores)
- [ ] Órdenes recientes (últimas 10)
- [ ] Gráfico de órdenes por mes
- [ ] Alertas de órdenes vencidas o próximas a vencer
- [ ] Estadísticas de ingresos del día/semana/mes

### 5.3. Gestión de Órdenes de Servicio

#### Crear Nueva Orden
- [ ] Formulario multi-paso (mobile-friendly)
  - **Paso 1:** Buscar/Crear cliente (autocompletado por teléfono)
  - **Paso 2:** Tipo de equipo (buscador con autocompletado, crea si no existe)
  - **Paso 3:** Marca/Modelo (buscador con autocompletado, registra automáticamente si no existe)
  - **Paso 4:** Detalles del problema y accesorios (cargador, otros)
  - **Paso 5:** Captura de fotos del equipo (múltiples, desde cámara o galería)
  - **Paso 6:** Anticipo y fecha promesa
  - **Paso 7:** Firma digital del cliente (canvas táctil)
- [ ] Generación automática de número de orden
- [ ] Auto-registro de nuevos tipos de equipos y marcas/modelos en catálogo
- [ ] Almacenamiento de fotos en Supabase Storage
- [ ] Generación de ticket imprimible (PDF)
- [ ] Botón para enviar WhatsApp al cliente (manual, usando número del cliente)

#### Listado de Órdenes
- [ ] Vista de tabla responsiva (cards en móvil)
- [ ] Filtros por:
  - Estado (recibido, en reparación, listo, etc.)
  - Fecha de ingreso
  - Cliente (búsqueda por nombre/teléfono)
  - Técnico asignado
  - Número de orden
- [ ] Ordenamiento por fecha, prioridad, estado
- [ ] Paginación infinita o clásica
- [ ] Búsqueda global con debouncing
- [ ] Indicadores visuales de estado (badges de color)
- [ ] Acción rápida: cambio de estado desde la lista

#### Detalle de Orden
- [ ] Vista completa de todos los datos
- [ ] Galería de fotos del equipo (visualización y descarga)
- [ ] Opción de agregar más fotos en cualquier momento
- [ ] Línea de tiempo del historial de cambios
- [ ] Cambio de estado con comentarios obligatorios
- [ ] Asignación de técnico responsable
- [ ] Registro de costos de reparación
- [ ] Registro de pagos (anticipo, abonos, pago final)
- [ ] Cálculo automático de saldo pendiente
- [ ] Botón para abrir WhatsApp con el número del cliente (envío manual)
- [ ] Reimprimir ticket
- [ ] Marcar como entregado (requiere confirmación)

#### Ticket de Impresión
- [ ] Diseño que replica el ticket físico actual
- [ ] Generación de QR code con número de orden
- [ ] Opción de descarga en PDF
- [ ] Opción de impresión directa (Print API)
- [ ] Vista previa responsive

### 5.4. Gestión de Clientes
- [ ] Listado de clientes con búsqueda
- [ ] Crear/Editar cliente
- [ ] Ver historial de órdenes del cliente
- [ ] Estadísticas por cliente (total gastado, frecuencia)
- [ ] Notas importantes del cliente
- [ ] Exportar base de datos de clientes (CSV/Excel)

### 5.5. Reportes y Estadísticas
- [ ] Reporte de ingresos por período
- [ ] Órdenes por estado (gráfico de pastel)
- [ ] Órdenes por técnico (ranking de productividad)
- [ ] Tipos de equipos más atendidos
- [ ] Tiempo promedio de reparación por tipo de equipo
- [ ] Clientes recurrentes
- [ ] Exportación de reportes a PDF/Excel

### 5.6. Configuración
- [ ] Datos de la sucursal (nombre, dirección, teléfonos, horarios)
- [ ] Logo personalizado
- [ ] Configuración de términos y condiciones
- [ ] Costo mínimo de revisión
- [ ] Días límite de reciclaje
- [ ] Plantillas de mensajes WhatsApp personalizables
- [ ] Activación/desactivación de notificaciones automáticas
- [ ] Gestión de empleados y roles

### 5.8. Características Mobile-First
- [ ] Diseño 100% responsive (Tailwind breakpoints)
- [ ] PWA instalable (manifest.json + service worker)
- [ ] Modo offline básico (caché de consultas recientes)
- [ ] Navegación por gestos (swipe)
- [ ] Inputs optimizados para móvil (teclado numérico, tel, etc.)
- [ ] Acceso a cámara para fotos de equipos
- [ ] Firma digital táctil

---

## 6. STACK TÉCNICO DETALLADO

### 6.1. Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Lenguaje:** TypeScript 5.9
- **Estilos:** Tailwind CSS 4 (Mobile-first utility classes)
- **Componentes UI:**
  - Lucide React (iconos)
  - Headless UI o Radix UI (componentes accesibles)
  - React Hook Form + Zod (formularios y validación)
- **Gestión de Estado:**
  - React Context para estado global ligero
  - React Query (TanStack Query) para caché de datos de servidor
- **PWA:** next-pwa para service workers

### 6.2. Backend
- **BaaS:** Supabase
  - PostgreSQL (base de datos)
  - Auth (autenticación)
  - Storage (almacenamiento de imágenes)
  - Realtime (suscripciones en tiempo real opcional)
- **API:** Next.js API Routes
- **Autenticación:** NextAuth v4 + Supabase Auth

### 6.3. Integraciones
- **PDF Generation:** jsPDF o react-pdf/renderer
- **QR Codes:** qrcode.react
- **Firma Digital:** react-signature-canvas
- **Fechas:** date-fns o dayjs (más ligero que moment)

### 6.4. DevOps y Deployment
- **Base de Datos:** Supabase (ya configurado)
- **CI/CD:** GitHub Actions (opcional)

---

## 7. FLUJO DE USUARIO PRINCIPAL

### 7.1. Recepción de Equipo (Crear Orden)
```
1. Recepcionista abre la app → Dashboard
2. Click en "Nueva Orden"
3. Ingresa teléfono del cliente
   - Si existe: autocompletar datos
   - Si no existe: formulario de registro rápido
4. Busca tipo de equipo (autocompletado)
   - Si no existe: opción de agregar nuevo tipo
5. Busca marca y modelo (autocompletado)
   - Si no existe: sistema lo registra automáticamente al crear la orden
6. Ingresa detalles del problema/estado del equipo
7. Toma fotos del equipo (mínimo 1, máximo 10)
   - Desde cámara o galería
   - Vista previa antes de confirmar
8. Marca si incluye cargador
9. Lista accesorios incluidos (opcional)
10. Ingresa anticipo (si aplica)
11. Cliente firma en la pantalla táctil
12. Sistema genera número de orden automáticamente
13. Muestra vista previa del ticket
14. Opción de:
    - Imprimir ticket (PDF)
    - Abrir WhatsApp para enviar manualmente
    - Ambas
15. Orden creada exitosamente
```

### 7.2. Actualización de Estado de Orden
```
1. Técnico/Recepcionista busca orden por número o cliente
2. Abre detalle de la orden
3. Click en "Cambiar Estado"
4. Selecciona nuevo estado (ej: "En reparación" → "Reparado")
5. Si es diagnóstico: ingresa costo estimado
6. Agrega comentario obligatorio
7. Guarda cambio
8. Sistema registra en historial
9. (Opcional) Envía WhatsApp automático al cliente
```

### 7.3. Entrega de Equipo
```
1. Cliente llega a recoger
2. Recepcionista busca orden
3. Verifica estado "Reparado" o "No reparable"
4. Registra pago final (si hay saldo pendiente)
5. Cliente firma de conformidad (digital)
6. Marca orden como "Entregado"
7. Sistema actualiza estado
8. Orden archivada/completada
```

---

## 8. CRITERIOS DE ACEPTACIÓN

### 8.1. Funcionalidad
- ✅ Sistema crea órdenes con número único auto-incrementable
- ✅ Genera tickets en PDF idénticos al formato actual
- ✅ Envía notificaciones por WhatsApp utilizando el movil del cliente(permitiendo al usuario que la envie en el momento que se crea o cambia el estado de la orden)
- ✅ Permite cambio de estado con historial completo
- ✅ Cálculo correcto de anticipos y saldos
- ✅ Búsqueda rápida de órdenes y clientes
- ✅ Estadísticas y reportes precisos

### 8.2. UX/UI
- ✅ Diseño mobile-first completamente responsivo
- ✅ Tiempo de carga < 2 segundos en conexión 3G
- ✅ Navegación intuitiva (máximo 3 clicks para cualquier acción)
- ✅ Feedback visual en todas las acciones (loading, success, error)
- ✅ Accesibilidad WCAG 2.1 nivel AA

### 8.3. Rendimiento
- ✅ Listado de órdenes con paginación (20 por página)
- ✅ Búsqueda con debouncing (300ms)
- ✅ Caché de consultas frecuentes
- ✅ Lazy loading de imágenes

### 8.4. Seguridad
- ✅ Autenticación obligatoria en todas las rutas protegidas
- ✅ RLS habilitado en Supabase
- ✅ Validación de datos en cliente y servidor
- ✅ Sanitización de inputs
- ✅ HTTPS obligatorio

---

## 9. FASES DE IMPLEMENTACIÓN

### FASE 1: Configuración Inicial (Semana 1)
- [ ] Configuración de Supabase y creación de tablas
- [ ] Configuración de Next.js con TypeScript y Tailwind
- [ ] Configuración de NextAuth
- [ ] Estructura de carpetas y componentes base
- [ ] Sistema de diseño básico (botones, inputs, cards)

### FASE 2: Autenticación y Dashboard (Semana 2)
- [ ] Sistema de login/logout
- [ ] Protección de rutas
- [ ] Layout principal con sidebar
- [ ] Dashboard con estadísticas básicas
- [ ] Navegación responsive

### FASE 3: Gestión de Clientes (Semana 3)
- [ ] CRUD completo de clientes
- [ ] Buscador con autocompletado
- [ ] Validaciones con Zod
- [ ] Vista de historial por cliente

### FASE 4: Órdenes de Servicio - Core (Semana 4-5)
- [ ] Formulario de creación de orden (multi-paso)
- [ ] Generación de número de orden
- [ ] Firma digital
- [ ] Listado de órdenes con filtros
- [ ] Detalle de orden
- [ ] Cambio de estado con historial

### FASE 5: Gestión de Fotos y Storage (Semana 6)
- [ ] Configuración de Supabase Storage
- [ ] Componente de captura de fotos (cámara + galería)
- [ ] Compresión de imágenes en cliente
- [ ] Upload y almacenamiento de fotos
- [ ] Galería de visualización de fotos
- [ ] Eliminación y edición de fotos

### FASE 6: Tickets y PDF (Semana 7)
- [ ] Diseño del ticket (replica del físico)
- [ ] Generación de QR code
- [ ] Generación de PDF
- [ ] Vista de impresión optimizada
- [ ] Descarga de tickets
- [ ] Botón de WhatsApp (apertura de WhatsApp Web con número)

### FASE 7: Reportes y Estadísticas (Semana 8)
- [ ] Reporte de ingresos
- [ ] Gráficos de órdenes
- [ ] Exportación a Excel/CSV
- [ ] Filtros de fecha personalizados
- [ ] Dashboard de métricas avanzadas

### FASE 8: PWA y Optimizaciones (Semana 9)
- [ ] Configuración de manifest.json
- [ ] Service worker para caché
- [ ] Optimización de imágenes
- [ ] Lazy loading
- [ ] Mejoras de rendimiento

### FASE 9: Testing y Ajustes (Semana 10)
- [ ] Testing de funcionalidades críticas
- [ ] Corrección de bugs
- [ ] Ajustes de UX basados en feedback
- [ ] Pruebas en dispositivos reales


---

## 10. CONSIDERACIONES TÉCNICAS ADICIONALES

### 10.1. Gestión de Fotos y Storage
**Almacenamiento en Supabase Storage:**
- Crear bucket público `equipos-fotos`
- Estructura de carpetas: `{sucursal_id}/{orden_id}/foto_{timestamp}.jpg`
- Compresión de imágenes en cliente antes de upload (máx 1MB por foto)
- Formatos permitidos: JPG, PNG, WEBP
- Generación de thumbnails automática (opcional)

**Componente de Captura:**
- Usar HTML5 File Input API con `accept="image/*"`
- Atributo `capture="environment"` para abrir cámara directamente en móviles
- Compresión usando `browser-image-compression` o similar
- Preview antes de confirmar

### 10.2. Buscadores con Autocompletado
**Tipos de Equipos:**
```typescript
// Búsqueda con debouncing
const searchTiposEquipos = async (query: string) => {
  const { data } = await supabase
    .from('tipos_equipos')
    .select('*')
    .ilike('nombre', `%${query}%`)
    .eq('activo', true)
    .order('veces_usado', { ascending: false })
    .limit(10);
  return data;
};
```

**Marcas/Modelos:**
- Filtrar primero por tipo de equipo seleccionado
- Ordenar por `veces_usado DESC` (más usados primero)
- Si no existe coincidencia: permitir crear desde el formulario
- Incrementar contador `veces_usado` en cada uso

### 10.3. WhatsApp Manual
**Integración sin Baileys:**
- Usar deep links de WhatsApp Web: `https://wa.me/{telefono}?text={mensaje}`
- El mensaje puede incluir:
  - Número de orden
  - Enlace a consulta pública
  - Información básica
- Ejemplo:
```typescript
const abrirWhatsApp = (telefono: string, numeroOrden: number) => {
  const mensaje = encodeURIComponent(
    `Hola, tu equipo ha sido recibido con el número de orden: ${numeroOrden}. ` +
    `Puedes consultar el estado aquí: ${APP_URL}/consulta/${numeroOrden}`
  );
  window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
};
```

### 10.4. Numeración de Órdenes
Implementar función en PostgreSQL para auto-incremento por sucursal:
```sql
CREATE OR REPLACE FUNCTION generar_numero_orden(p_sucursal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  nuevo_numero INTEGER;
BEGIN
  UPDATE configuracion_sucursal
  SET ultimo_numero_orden = ultimo_numero_orden + 1
  WHERE sucursal_id = p_sucursal_id
  RETURNING ultimo_numero_orden INTO nuevo_numero;

  RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;
```

### 10.5. Firma Digital
Usar `react-signature-canvas` para captura táctil:
- Convertir a base64
- Almacenar en Supabase Storage
- Guardar URL en la tabla ordenes_servicio

### 10.6. Generación de QR
El QR code debe contener:
- URL de consulta pública: `https://app.com/consulta/[numero]?s=[sucursal_id]`
- Esto permite al cliente consultar estado sin login
- Incluir en el ticket impreso

### 10.7. Multi-Tenancy
Aunque inicialmente es para una tienda, la arquitectura soporta:
- Múltiples empresas
- Múltiples sucursales por empresa
- Datos completamente aislados por RLS

---

## 11. RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos por fallos en la red | Baja | Alto | Implementar validación robusta + retry logic |
| Rendimiento lento en dispositivos antiguos | Media | Medio | Optimización de bundle size + lazy loading |
| Problemas de impresión de tickets | Media | Alto | Proveer alternativa de descarga PDF siempre |

---

## 12. MÉTRICAS DE ÉXITO

### KPIs del Sistema
- **Tiempo promedio de creación de orden:** < 2 minutos
- **Tasa de envío exitoso de WhatsApp:** > 95%
- **Uptime del sistema:** > 99%
- **Tiempo de carga de dashboard:** < 2 segundos
- **Satisfacción de usuario:** > 4.5/5

### Métricas de Negocio
- Reducción de tiempo de atención al cliente
- Disminución de órdenes perdidas o extraviadas
- Aumento en seguimiento de órdenes
- Mejora en comunicación con clientes
- Transparencia en estados de reparación

---

## 13. PRÓXIMOS PASOS

1. **Revisión y aprobación de este plan** por el equipo/cliente
2. **Aclaraciones y ajustes** según feedback
3. **Iniciar Fase 1:** Configuración de Supabase y estructura base
4. **Setup del repositorio Git** (GitHub)
5. **Creación de tablero de proyecto** (GitHub Projects o Trello)

---

## 14. ANEXOS

### A. Variables de Entorno Necesarias
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://dutndlhxnsseihxgfqpx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1dG5kbGh4bnNzZWloeGdmcXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MzMyOTUsImV4cCI6MjA4MTQwOTI5NX0.lU0R8UQcVXnhe4s7nEedGKutOiYV5Qdf0wp8i8KdVxQ
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1dG5kbGh4bnNzZWloeGdmcXB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTgzMzI5NSwiZXhwIjoyMDgxNDA5Mjk1fQ.wveGJnQtm8mc4C-xfkVi7wWDCwphy2wNiuEeFk99LyE

# NextAuth
NEXTAUTH_URL=http://localhost:3004
NEXTAUTH_SECRET=generar_secreto_aleatorio

# Configuración
NEXT_PUBLIC_APP_NAME=TH Empresarial
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### B. Comandos de Desarrollo
```bash
# Instalación
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Iniciar producción
npm run start

# Linter
npm run lint

# Generar tipos de Supabase
npm run supabase:types
```

### C. Scripts de Supabase Útiles
```bash
# Generar tipos TypeScript de la base de datos
npx supabase gen types typescript --project-id dutndlhxnsseihxgfqpx > src/lib/supabase/database.types.ts
```

---

**Documento creado el:** 2025-12-15
**Última actualización:** 2025-12-15
**Versión:** 1.0
**Estado:** Pendiente de aprobación
