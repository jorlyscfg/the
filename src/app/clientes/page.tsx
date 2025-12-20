'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Search, UserPlus, Users, FileText, TrendingUp } from 'lucide-react';
import type { Cliente } from './actions';
import { obtenerClientes, eliminarCliente } from './actions';
import NuevoClienteModal from '@/components/clientes/NuevoClienteModal';
import EditarClienteModal from '@/components/clientes/EditarClienteModal';
import ConfirmarEliminacionModal from '@/components/clientes/ConfirmarEliminacionModal';
import ClientCard from '@/components/clientes/ClientCard';
import { Button } from '@/components/ui/Button';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { useNotification } from '@/components/notifications/NotificationContext';
import { useDebounce } from '@/hooks/useDebounce';
import { Loading } from '@/components/ui/Loading';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const debouncedBusqueda = useDebounce(busqueda, 400);

  // Estados para Modales
  const [isNuevoModalOpen, setIsNuevoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const { success, error: showError } = useNotification();

  useEffect(() => {
    cargarClientes();
  }, []);

  useEffect(() => {
    const terminos = debouncedBusqueda.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);

    if (terminos.length === 0) {
      setClientesFiltrados(clientes);
    } else {
      const filtrados = clientes.filter((cliente) => {
        // Cada término debe coincidir con alguno de los campos (Nombre, Teléfono o Email)
        return terminos.every(termino => {
          const nombreMatch = cliente.nombre_completo.toLowerCase().includes(termino);
          const telefonoMatch = cliente.telefono.includes(termino);
          const emailMatch = cliente.email?.toLowerCase().includes(termino) || false;

          return nombreMatch || telefonoMatch || emailMatch;
        });
      });
      setClientesFiltrados(filtrados);
    }
  }, [debouncedBusqueda, clientes]);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const result = await obtenerClientes();

      if (result.success) {
        setClientes(result.clientes);
        setClientesFiltrados(result.clientes);
      } else {
        showError('Error', result.error || 'No se pudieron cargar los clientes');
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      showError('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string, nombre: string) => {
    setClienteSeleccionado(clientes.find(c => c.id === id) || null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clienteSeleccionado) return;

    try {
      setEliminando(true);
      const result = await eliminarCliente(clienteSeleccionado.id);

      if (result.success) {
        success('Eliminado', 'El cliente ha sido eliminado exitosamente');
        cargarClientes();
        setIsDeleteModalOpen(false);
      } else {
        showError('No se puede eliminar', result.error || 'Error al intentar eliminar');
      }
    } catch (err) {
      showError('Error', 'Ocurrió un error al intentar eliminar');
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar title="Clientes" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-32">
        {/* Herramientas de búsqueda y acción - Sticky */}
        <div className="sticky top-16 z-20 bg-gray-50/80 backdrop-blur-md -mx-4 px-4 py-4 mb-6 border-b border-gray-100 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:px-0 sm:mx-0 sm:py-0 sm:mb-8">
          <div className="flex flex-row gap-2 items-center">
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center px-3 py-1 group focus-within:ring-2 focus-within:ring-primary-500 transition-all">
              <Search className="text-gray-400 w-4.5 h-4.5 shrink-0" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-2 pr-1 py-2 bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder:text-gray-400"
              />
            </div>

            <Button
              onClick={() => setIsNuevoModalOpen(true)}
              className="h-12 w-12 rounded-xl shadow-md p-0 shrink-0 bg-primary-600 hover:bg-primary-700 flex items-center justify-center"
              title="Nuevo Cliente"
            >
              <UserPlus className="w-7 h-7" strokeWidth={2.5} />
            </Button>
          </div>
        </div>
        {/* Listado de Clientes en Grid */}
        {loading ? (
          <Loading mode="inline" message="Cargando base de datos..." />
        ) : clientesFiltrados.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
            <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {busqueda ? 'Sin resultados' : 'No hay clientes aún'}
            </h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-8">
              {busqueda
                ? `No encontramos nada para "${busqueda}". Intenta con otros términos.`
                : 'Comienza registrando tu primer cliente para gestionar sus órdenes de servicio.'}
            </p>
            {!busqueda && (
              <Button
                variant="outline"
                onClick={() => setIsNuevoModalOpen(true)}
                className="rounded-xl border-gray-200"
              >
                Registrar primer cliente
              </Button>
            )}
          </div>
        ) : (
          <ResponsiveGrid>
            {clientesFiltrados.map((cliente) => (
              <ClientCard
                key={cliente.id}
                cliente={cliente}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </ResponsiveGrid>
        )}

        {/* Estadísticas en la parte inferior */}
        {!loading && clientesFiltrados.length > 0 && (
          <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-6">
            <div className="bg-white p-2.5 sm:p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-left">
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center text-blue-600 shrink-0 mb-1 sm:mb-0">
                <Users className="w-4 h-4 sm:w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total</p>
                <p className="text-base sm:text-2xl font-black text-gray-900 leading-none">{clientesFiltrados.length}</p>
              </div>
            </div>

            <div className="bg-white p-2.5 sm:p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-left">
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center text-indigo-600 shrink-0 mb-1 sm:mb-0">
                <FileText className="w-4 h-4 sm:w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Servicios</p>
                <p className="text-base sm:text-2xl font-black text-gray-900 leading-none">
                  {clientesFiltrados.reduce((sum, c) => sum + c.ordenes_count, 0)}
                </p>
              </div>
            </div>

            <div className="bg-white p-2.5 sm:p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center sm:gap-4 text-center sm:text-left">
              <div className="h-8 w-8 sm:h-12 sm:w-12 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center text-green-600 shrink-0 mb-1 sm:mb-0">
                <TrendingUp className="w-4 h-4 sm:w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="hidden sm:block text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Fidelidad</p>
                <p className="text-base sm:text-2xl font-black text-gray-900 leading-none">
                  {(clientesFiltrados.reduce((sum, c) => sum + c.ordenes_count, 0) / clientesFiltrados.length).toFixed(1)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modales */}
      <NuevoClienteModal
        isOpen={isNuevoModalOpen}
        onClose={() => setIsNuevoModalOpen(false)}
        onSuccess={() => cargarClientes()}
      />

      <EditarClienteModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setClienteSeleccionado(null);
        }}
        cliente={clienteSeleccionado}
        onSuccess={() => cargarClientes()}
      />

      <ConfirmarEliminacionModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setClienteSeleccionado(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={eliminando}
        nombre={clienteSeleccionado?.nombre_completo || ''}
      />
    </div>
  );
}
