'use client';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TipoEquipoData {
  tipo: string;
  cantidad: number;
}

interface TiempoPromedioData {
  tipo: string;
  promedio_dias: number;
  cantidad_ordenes: number;
}

interface ClienteFrecuenteData {
  nombre: string;
  telefono: string;
  cantidad_ordenes: number;
  gasto_total: number;
}

const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

export function GraficaTiposEquipos({ data }: { data: TipoEquipoData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data as any}
          dataKey="cantidad"
          nameKey="tipo"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(props: any) =>
            `${props.tipo} (${(props.percent * 100).toFixed(0)}%)`
          }
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GraficaTiempoPromedio({ data }: { data: TiempoPromedioData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="tipo"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis label={{ value: 'Días', angle: -90, position: 'insideLeft' }} />
        <Tooltip
          formatter={(value: number | undefined) => [
            typeof value === 'number' ? `${value.toFixed(1)} días` : '',
            'Promedio'
          ]}
        />
        <Legend />
        <Bar
          dataKey="promedio_dias"
          fill="#3b82f6"
          name="Días promedio"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TablaClientesFrecuentes({ data }: { data: ClienteFrecuenteData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  const formatearMoneda = (monto: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(monto);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Teléfono
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Órdenes
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Gasto Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((cliente, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {cliente.nombre}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {cliente.telefono}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {cliente.cantidad_ordenes}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                {formatearMoneda(cliente.gasto_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
