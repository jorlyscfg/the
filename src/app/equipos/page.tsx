'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Package, Plus, Search } from 'lucide-react';
import { useNotification } from '@/components/notifications/NotificationContext';
import { createClient } from '@/lib/supabase/client';
import { Loading } from '@/components/ui/Loading';
import { ResponsiveGrid } from '@/components/ui/ResponsiveGrid';
import { Button } from '@/components/ui/Button';
import { obtenerUserInfo } from '@/app/actions';


// Nuevos Componentes
import TipoEquipoCard, { type TipoEquipo } from '@/components/equipos/TipoEquipoCard';
import MarcaModeloCard, { type MarcaModelo } from '@/components/equipos/MarcaModeloCard';
import ModalTipoEquipo from '@/components/equipos/ModalTipoEquipo';
import ModalMarcaModelo from '@/components/equipos/ModalMarcaModelo';
import ConfirmarEliminacionModal from '@/components/equipos/ConfirmarEliminacionModal';
import { useDebounce } from '@/hooks/useDebounce';

export default function EquiposPage() {
  const [tiposEquipos, setTiposEquipos] = useState<TipoEquipo[]>([]);
  const [marcasModelos, setMarcasModelos] = useState<MarcaModelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const debouncedBusqueda = useDebounce(busqueda, 400);
  const [vistaActiva, setVistaActiva] = useState<'tipos' | 'marcas'>('tipos');

  // Estados para Modales
  const [mostrarModalTipo, setMostrarModalTipo] = useState(false);
  const [mostrarModalMarca, setMostrarModalMarca] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoEquipo | null>(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<MarcaModelo | null>(null);

  // Estado para Eliminación
  const [itemEliminar, setItemEliminar] = useState<{ id: string; nombre: string; tipo: 'tipo' | 'marca' } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const { success: showSuccess, error: showError } = useNotification();
  const supabase = createClient();

  useEffect(() => {
    cargarDatos();
  }, [vistaActiva]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const userInfo = await obtenerUserInfo();
      if (!userInfo.success || !userInfo.user?.empresa?.id) {
        throw new Error('No se pudo identificar la empresa del usuario');
      }
      const empresaId = userInfo.user.empresa.id;

      if (vistaActiva === 'tipos') {
        const { data, error } = await supabase
          .from('tipos_equipos')
          .select('*')
          .eq('empresa_id', empresaId)
          .order('veces_usado', { ascending: false });

        if (error) throw error;
        setTiposEquipos(data || []);
      } else {
        const { data, error } = await supabase
          .from('marcas_modelos')
          .select(`
            *,
            tipos_equipos (nombre)
          `)
          .eq('empresa_id', empresaId)
          .order('veces_usado', { ascending: false });

        if (error) throw error;
        setMarcasModelos(data || []);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      showError('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!itemEliminar) return;

    try {
      setEliminando(true);
      const tabla = itemEliminar.tipo === 'tipo' ? 'tipos_equipos' : 'marcas_modelos';

      const { error } = await supabase
        .from(tabla)
        .delete()
        .eq('id', itemEliminar.id);

      if (error) throw error;

      showSuccess(`${itemEliminar.tipo === 'tipo' ? 'Tipo de equipo' : 'Marca/Modelo'} eliminado`);
      setItemEliminar(null);
      cargarDatos();
    } catch (error: any) {
      console.error('Error:', error);
      showError('Error al eliminar', 'Puede estar en uso por otras órdenes');
    } finally {
      setEliminando(false);
    }
  };

  const handleToggleActivo = async (id: string, activo: boolean, tipo: 'tipo' | 'marca') => {
    try {
      const tabla = tipo === 'tipo' ? 'tipos_equipos' : 'marcas_modelos';
      const { error } = await supabase
        .from(tabla)
        .update({ activo: !activo })
        .eq('id', id);

      if (error) throw error;

      showSuccess(
        `${tipo === 'tipo' ? 'Tipo' : 'Marca/Modelo'} ${!activo ? 'activado' : 'desactivado'}`
      );
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar');
    }
  };

  // Búsqueda Inteligente Multitérmino
  const getDatosFiltrados = () => {
    const terminos = debouncedBusqueda.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);

    if (vistaActiva === 'tipos') {
      if (terminos.length === 0) return tiposEquipos;
      return tiposEquipos.filter(tipo =>
        terminos.every(t =>
          tipo.nombre.toLowerCase().includes(t) ||
          tipo.descripcion?.toLowerCase().includes(t)
        )
      );
    } else {
      if (terminos.length === 0) return marcasModelos;
      return marcasModelos.filter(marca =>
        terminos.every(t =>
          marca.marca.toLowerCase().includes(t) ||
          marca.modelo.toLowerCase().includes(t) ||
          marca.tipos_equipos?.nombre.toLowerCase().includes(t)
        )
      );
    }
  };

  const datosFiltrados = getDatosFiltrados();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar title="Catálogo de Equipos" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-32">
        {/* Filtros de Vista (Tabs) */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-3 w-fit h-11 shrink-0 overflow-hidden">
          <button
            onClick={() => setVistaActiva('tipos')}
            className={`px-4 py-0 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${vistaActiva === 'tipos'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            Tipos
          </button>
          <button
            onClick={() => setVistaActiva('marcas')}
            className={`px-4 py-0 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${vistaActiva === 'marcas'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            Marcas/Modelos
          </button>
        </div>

        {/* Herramientas de búsqueda y acción - Sticky */}
        <div className="sticky top-16 z-20 bg-gray-50/80 backdrop-blur-md -mx-4 px-4 py-2 mb-3 border-b border-gray-100 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-none sm:px-0 sm:mx-0 sm:py-0 sm:mb-4">
          <div className="flex flex-row gap-2 items-center">
            <div className="relative flex-1 group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${busqueda ? 'text-primary-500' : 'text-gray-400 group-focus-within:text-primary-500'}`} />
              <input
                type="text"
                placeholder={vistaActiva === 'tipos' ? 'Buscar tipo...' : 'Buscar marca o modelo...'}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 h-12 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-semibold"
              />
            </div>

            <Button
              onClick={() => {
                if (vistaActiva === 'tipos') {
                  setTipoSeleccionado(null);
                  setMostrarModalTipo(true);
                } else {
                  setMarcaSeleccionada(null);
                  setMostrarModalMarca(true);
                }
              }}
              className="h-12 w-12 rounded-xl shadow-md p-0 shrink-0 bg-primary-600 hover:bg-primary-700 flex items-center justify-center translate-y-0 active:translate-y-0.5 transition-transform"
              title={`Agregar ${vistaActiva === 'tipos' ? 'Tipo' : 'Marca/Modelo'}`}
            >
              <Plus className="w-8 h-8" strokeWidth={2.5} />
            </Button>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <Loading
            mode="fullscreen"
            message="Cargando catálogo"
            subMessage="Preparando tipos de equipos, marcas y modelos"
          />
        ) : (
          <ResponsiveGrid>
            {vistaActiva === 'tipos' ? (
              (datosFiltrados as TipoEquipo[]).map((tipo) => (
                <TipoEquipoCard
                  key={tipo.id}
                  tipo={tipo}
                  onEdit={(t) => {
                    setTipoSeleccionado(t);
                    setMostrarModalTipo(true);
                  }}
                  onEliminar={(id) => setItemEliminar({ id, nombre: tipo.nombre, tipo: 'tipo' })}
                  onToggleActivo={(id, act) => handleToggleActivo(id, act, 'tipo')}
                />
              ))
            ) : (
              (datosFiltrados as MarcaModelo[]).map((marca) => (
                <MarcaModeloCard
                  key={marca.id}
                  marca={marca}
                  onEdit={(m) => {
                    setMarcaSeleccionada(m);
                    setMostrarModalMarca(true);
                  }}
                  onEliminar={(id) => setItemEliminar({ id, nombre: `${marca.marca} ${marca.modelo}`, tipo: 'marca' })}
                  onToggleActivo={(id, act) => handleToggleActivo(id, act, 'marca')}
                />
              ))
            )}
          </ResponsiveGrid>
        )}

        {/* Empty States */}
        {!loading && datosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1 uppercase tracking-tight">No hay resultados</h3>
            <p className="text-gray-500 max-w-xs text-sm">
              No encontramos nada que coincida con "<span className="font-bold text-primary-600">{busqueda}</span>". Intenta con otros términos.
            </p>
          </div>
        )}
      </main>

      {/* Modales */}
      {mostrarModalTipo && (
        <ModalTipoEquipo
          tipo={tipoSeleccionado}
          onClose={() => {
            setMostrarModalTipo(false);
            setTipoSeleccionado(null);
          }}
          onGuardar={() => {
            cargarDatos();
            setMostrarModalTipo(false);
            setTipoSeleccionado(null);
          }}
        />
      )}

      {mostrarModalMarca && (
        <ModalMarcaModelo
          marca={marcaSeleccionada}
          onClose={() => {
            setMostrarModalMarca(false);
            setMarcaSeleccionada(null);
          }}
          onGuardar={() => {
            cargarDatos();
            setMostrarModalMarca(false);
            setMarcaSeleccionada(null);
          }}
        />
      )}

      {itemEliminar && (
        <ConfirmarEliminacionModal
          isOpen={true}
          onClose={() => setItemEliminar(null)}
          onConfirm={confirmarEliminar}
          isLoading={eliminando}
          nombre={itemEliminar.nombre}
          tipo={itemEliminar.tipo}
        />
      )}
    </div>
  );
}
