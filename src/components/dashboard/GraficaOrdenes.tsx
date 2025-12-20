'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface GraficaOrdenesProps {
  data: Array<{
    mes: number;
    nombre: string;
    total_ordenes: number;
    ingresos: number;
    completadas: number;
  }>;
}

export function GraficaOrdenesBarras({ data }: GraficaOrdenesProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nombre" />
        <YAxis />
        <Tooltip
          formatter={(value: number | undefined) =>
            typeof value === 'number' ? value.toFixed(0) : (value || '')
          }
        />
        <Legend />
        <Bar dataKey="total_ordenes" fill="#3b82f6" name="Total Órdenes" />
        <Bar dataKey="completadas" fill="#10b981" name="Completadas" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficaIngresosLinea({ data }: GraficaOrdenesProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nombre" />
        <YAxis />
        <Tooltip
          formatter={(value: number | undefined) =>
            typeof value === 'number' ? `$${value.toLocaleString('es-MX', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}` : ''
          }
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="ingresos"
          stroke="#8b5cf6"
          strokeWidth={2}
          name="Ingresos"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface GraficaEstadosProps {
  data: Array<{
    estado: string;
    cantidad: number;
    color: string;
  }>;
}

export function GraficaEstadosPie({ data }: GraficaEstadosProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(props: any) =>
            `${props.estado}: ${(props.percent * 100).toFixed(0)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="cantidad"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
