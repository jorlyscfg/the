'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import {
  Building2, Save, MapPin, Phone, Mail, Globe,
  FileText, Plus, Edit, Trash2, Users, X, Image as ImageIcon, Upload, Shield
} from 'lucide-react';
import type { Empresa, Sucursal, Empleado } from './actions';
import {
  obtenerConfiguracionCompleta,
  actualizarEmpresa,
  actualizarSucursal,
  crearSucursal,
  eliminarSucursal,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado,
  subirLogoEmpresa,
  eliminarLogoEmpresa,
} from './actions';
import { useNotification } from '@/components/notifications/NotificationContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ConfirmarModal } from '@/components/ui/ConfirmarModal';
import {
  DataCard,
  DataCardHeader,
  DataCardContent,
  DataCardFooter,
  DataCardItem
} from '@/components/ui/DataCard';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function ConfiguracionPage() {
  const { success, error: showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  // Modales
  const [mostrarModalSucursal, setMostrarModalSucursal] = useState(false);
  const [sucursalEditando, setSucursalEditando] = useState<Sucursal | null>(null);
  const [mostrarModalEmpleado, setMostrarModalEmpleado] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState<Empleado | null>(null);

  // States for confirmation modals
  const [mostrarConfirmarEliminarSucursal, setMostrarConfirmarEliminarSucursal] = useState<string | null>(null);
  const [mostrarConfirmarEliminarEmpleado, setMostrarConfirmarEliminarEmpleado] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // States for logo
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [mostrarConfirmarEliminarLogo, setMostrarConfirmarEliminarLogo] = useState(false);

  const [formEmpresa, setFormEmpresa] = useState({
    nombre: '',
    razon_social: '',
    rfc: '',
    telefono: '',
    email: '',
    sitio_web: '',
  });

  const [formSucursal, setFormSucursal] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    activa: true,
  });

  const [formEmpleado, setFormEmpleado] = useState({
    nombre_completo: '',
    email: '',
    telefono: '',
    rol: 'tecnico',
    sucursal_id: '',
    activo: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const result = await obtenerConfiguracionCompleta();

      if (result.success) {
        if (result.empresa) {
          setEmpresa(result.empresa);
          setFormEmpresa({
            nombre: result.empresa.nombre || '',
            razon_social: result.empresa.razon_social || '',
            rfc: result.empresa.rfc || '',
            telefono: result.empresa.telefono || '',
            email: result.empresa.email || '',
            sitio_web: result.empresa.sitio_web || '',
          });
          setLogoPreview(result.empresa.logo_url || null);
        }
        setSucursales(result.sucursales);
        setEmpleados(result.empleados);
      } else {
        showError('Error al cargar', result.error || 'No se pudieron cargar los datos');
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      showError('Error al cargar', 'No se pudieron cargar los datos de configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarEmpresa = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      setGuardando(true);
      const result = await actualizarEmpresa(formEmpresa);

      if (result.success) {
        success('Guardado exitoso', 'Información de empresa actualizada');
      } else {
        showError('Error al guardar', result.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error al guardar empresa:', err);
      showError('Error al guardar', 'Ocurrió un error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !empresa) return;

    try {
      setSubiendoLogo(true);
      const formData = new FormData();
      formData.append('logo', logoFile);

      const result = await subirLogoEmpresa(empresa.id, formData);

      if (result.success) {
        success('Logo actualizado', 'La imagen se guardó correctamente');
        setLogoFile(null);
        if (result.logoUrl) setLogoPreview(result.logoUrl);
      } else {
        showError('Error', result.error || 'No se pudo subir el logo');
      }
    } catch (err) {
      console.error('Error al subir logo:', err);
      showError('Error', 'Ocurrió un error al subir la imagen');
    } finally {
      setSubiendoLogo(false);
    }
  };

  const handleEliminarLogo = async () => {
    if (!empresa) return;

    try {
      setEliminando(true);
      const result = await eliminarLogoEmpresa(empresa.id);

      if (result.success) {
        success('Logo eliminado', result.message);
        setLogoPreview(null);
        setLogoFile(null);
        // Actualizar estado local
        setEmpresa(prev => prev ? { ...prev, logo_url: null } : null);
      } else {
        showError('Error', result.error || 'No se pudo eliminar el logo');
      }
    } catch (err) {
      console.error('Error al eliminar logo:', err);
      showError('Error', 'Ocurrió un error inesperado');
    } finally {
      setEliminando(false);
      setMostrarConfirmarEliminarLogo(false);
    }
  };

  const abrirModalSucursal = (sucursal?: Sucursal) => {
    if (sucursal) {
      setSucursalEditando(sucursal);
      setFormSucursal({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion || '',
        telefono: sucursal.telefono || '',
        email: sucursal.email || '',
        activa: sucursal.activa,
      });
    } else {
      setSucursalEditando(null);
      setFormSucursal({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        activa: true,
      });
    }
    setMostrarModalSucursal(true);
  };

  const cerrarModalSucursal = () => {
    setMostrarModalSucursal(false);
    setSucursalEditando(null);
  };

  const handleGuardarSucursal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      let result;
      if (sucursalEditando) {
        result = await actualizarSucursal(sucursalEditando.id, formSucursal);
      } else {
        result = await crearSucursal(formSucursal);
      }

      if (result.success) {
        success('Éxito', result.message);
        cerrarModalSucursal();
        cargarDatos();
      } else {
        showError('Error', result.error || 'Error al guardar sucursal');
      }
    } catch (err) {
      console.error('Error al guardar sucursal:', err);
      showError('Error', 'Ocurrió un error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarSucursal = async (id: string) => {
    try {
      setEliminando(true);
      const result = await eliminarSucursal(id);
      if (result.success) {
        success('Eliminado', result.message);
        cargarDatos();
      } else {
        showError('No se pudo eliminar', result.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      showError('Error', 'Error al procesar la solicitud');
    } finally {
      setEliminando(false);
      setMostrarConfirmarEliminarSucursal(null);
    }
  };

  const abrirModalEmpleado = (empleado?: Empleado) => {
    if (empleado) {
      setEmpleadoEditando(empleado);
      setFormEmpleado({
        nombre_completo: empleado.nombre_completo,
        email: empleado.email || '',
        telefono: empleado.telefono || '',
        rol: empleado.rol,
        sucursal_id: empleado.sucursal_id || '',
        activo: empleado.activo,
      });
    } else {
      setEmpleadoEditando(null);
      setFormEmpleado({
        nombre_completo: '',
        email: '',
        telefono: '',
        rol: 'tecnico',
        sucursal_id: sucursales.length > 0 ? sucursales[0].id : '',
        activo: true,
      });
    }
    setMostrarModalEmpleado(true);
  };

  const cerrarModalEmpleado = () => {
    setMostrarModalEmpleado(false);
    setEmpleadoEditando(null);
  };

  const handleGuardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa) return;

    try {
      setGuardando(true);
      let result;
      if (empleadoEditando) {
        result = await actualizarEmpleado(empleadoEditando.id, formEmpleado);
      } else {
        result = await crearEmpleado({
          ...formEmpleado,
          empresa_id: empresa.id,
          sucursal_id: formEmpleado.sucursal_id,
        });
      }

      if (result.success) {
        success('Éxito', result.message);
        cerrarModalEmpleado();
        cargarDatos();
      } else {
        showError('Error', result.error || 'Error al guardar empleado');
      }
    } catch (err) {
      console.error('Error al guardar empleado:', err);
      showError('Error', 'Ocurrió un error inesperado');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarEmpleado = async (id: string) => {
    try {
      setEliminando(true);
      const result = await eliminarEmpleado(id);
      if (result.success) {
        success('Eliminado', result.message);
        cargarDatos();
      } else {
        showError('No se pudo eliminar', result.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error al eliminar:', err);
      showError('Error', 'Error al procesar la solicitud');
    } finally {
      setEliminando(false);
      setMostrarConfirmarEliminarEmpleado(null);
    }
  };

  if (loading) return <Loading mode="fullscreen" message="Cargando configuración..." />;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          title="Configuración"
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-8">

            {/* Información de Empresa */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-xl">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  Información de la Empresa
                </h2>
                <button
                  onClick={() => handleGuardarEmpresa()}
                  disabled={guardando}
                  className={`p-3 rounded-2xl transition-all shadow-sm ${guardando
                    ? 'bg-gray-100 text-gray-400'
                    : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95'
                    }`}
                  title="Guardar cambios de empresa"
                >
                  {guardando ? <Loading mode="fullscreen" message="" /> : <Save className="w-5 h-5" />}
                </button>
              </div>

              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-12">
                  {/* Logo Upload Section */}
                  <div className="w-full lg:w-48 flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-[0.2em] self-start">Identidad Visual</span>
                    <div className="relative group overflow-hidden rounded-3xl border-2 border-dashed border-gray-200 aspect-square w-full flex items-center justify-center bg-gray-50 hover:bg-gray-100/50 transition-all cursor-pointer">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo Empresa"
                          className="max-w-full max-h-full object-contain p-4 drop-shadow-md"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <ImageIcon className="w-8 h-8 mb-3 opacity-20" />
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sin Logo</span>
                        </div>
                      )}

                      {logoPreview && !logoFile && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMostrarConfirmarEliminarLogo(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg backdrop-blur-sm transition-all shadow-sm z-20 opacity-0 group-hover:opacity-100"
                          title="Eliminar Logo"
                          type="button"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] z-10">
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                        <div className="flex flex-col items-center text-white scale-90 group-hover:scale-100 transition-transform">
                          <Upload className="w-6 h-6 mb-2" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Cambiar</span>
                        </div>
                      </label>
                    </div>
                    {logoFile && (
                      <Button
                        onClick={handleUploadLogo}
                        isLoading={subiendoLogo}
                        disabled={subiendoLogo}
                        className="mt-4 w-full h-9 text-[9px] font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary-100"
                      >
                        Guardar
                      </Button>
                    )}
                    <p className="mt-3 text-[9px] text-gray-400 text-center leading-relaxed font-medium">
                      Recomendado: 400px <br /> PNG, JPG (Max 2MB).
                    </p>
                  </div>

                  {/* Form Section */}
                  <form className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6" onSubmit={handleGuardarEmpresa}>
                    <Input
                      label="Nombre de la Empresa"
                      value={formEmpresa.nombre}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, nombre: e.target.value })}
                      required
                      icon={<Building2 className="w-4 h-4" />}
                    />
                    <Input
                      label="RFC"
                      value={formEmpresa.rfc}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, rfc: e.target.value })}
                      icon={<FileText className="w-4 h-4" />}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Razón Social"
                        value={formEmpresa.razon_social}
                        onChange={(e) => setFormEmpresa({ ...formEmpresa, razon_social: e.target.value })}
                        placeholder="Nombre legal completo"
                        icon={<Shield className="w-4 h-4" />}
                      />
                    </div>
                    <Input
                      label="Teléfono"
                      type="tel"
                      value={formEmpresa.telefono}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, telefono: e.target.value })}
                      icon={<Phone className="w-4 h-4" />}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formEmpresa.email}
                      onChange={(e) => setFormEmpresa({ ...formEmpresa, email: e.target.value })}
                      icon={<Mail className="w-4 h-4" />}
                    />
                    <div className="md:col-span-2">
                      <Input
                        label="Sitio Web"
                        type="url"
                        value={formEmpresa.sitio_web}
                        onChange={(e) => setFormEmpresa({ ...formEmpresa, sitio_web: e.target.value })}
                        placeholder="https://tunsitio.com"
                        icon={<Globe className="w-4 h-4" />}
                      />
                    </div>
                  </form>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Sucursales */}
              <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-orange-600" />
                    </div>
                    Sucursales
                  </h2>
                  <button
                    onClick={() => abrirModalSucursal()}
                    className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-lg shadow-primary-100 transition-all active:scale-95 flex items-center justify-center"
                    title="Nueva Sucursal"
                  >
                    <Plus className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>

                <div className="p-8 flex-1">
                  {sucursales.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-20" />
                      <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Sin sucursales registradas</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {sucursales.map((sucursal) => (
                        <DataCard key={sucursal.id}>
                          <DataCardHeader
                            title={sucursal.nombre}
                            icon={<MapPin className="w-5 h-5" />}
                            actions={
                              <>
                                <button
                                  onClick={() => abrirModalSucursal(sucursal)}
                                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setMostrarConfirmarEliminarSucursal(sucursal.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            }
                            subtitle={
                              <span
                                className={`inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-md ${sucursal.activa
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                                  }`}
                              >
                                {sucursal.activa ? 'Activa' : 'Inactiva'}
                              </span>
                            }
                            subtitleClassName="mt-1"
                          />
                          <DataCardContent className='flex-col gap-1'>
                            {sucursal.direccion && (
                              <DataCardItem
                                icon={MapPin}
                                value={sucursal.direccion}
                              />
                            )}
                            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                              {sucursal.telefono && (
                                <DataCardItem
                                  icon={Phone}
                                  value={sucursal.telefono}
                                  className="w-auto"
                                />
                              )}
                              {sucursal.email && (
                                <DataCardItem
                                  icon={Mail}
                                  value={sucursal.email}
                                  className="w-auto"
                                />
                              )}
                            </div>
                          </DataCardContent>
                        </DataCard>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Empleados */}
              <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    Recursos Humanos
                  </h2>
                  <button
                    onClick={() => abrirModalEmpleado()}
                    className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-lg shadow-primary-100 transition-all active:scale-95 flex items-center justify-center"
                    title="Nuevo Empleado"
                  >
                    <Plus className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>

                <div className="p-8 flex-1">
                  {empleados.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-20" />
                      <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Sin personal registrado</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {empleados.map((empleado) => (
                        <DataCard key={empleado.id}>
                          <DataCardHeader
                            title={empleado.nombre_completo}
                            icon={
                              <div className="flex items-center justify-center w-full h-full font-bold text-lg uppercase">
                                {empleado.nombre_completo.charAt(0)}
                              </div>
                            }
                            actions={
                              <>
                                <button
                                  onClick={() => abrirModalEmpleado(empleado)}
                                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setMostrarConfirmarEliminarEmpleado(empleado.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            }
                            subtitle={
                              <div className="flex gap-2">
                                <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-md bg-blue-100 text-blue-700">
                                  {empleado.rol}
                                </span>
                                <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-md ${empleado.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                  {empleado.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            }
                            subtitleClassName="mt-1"
                          />
                          <DataCardContent className="gap-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {empleado.sucursal && (
                                <DataCardItem
                                  icon={MapPin}
                                  value={empleado.sucursal.nombre}
                                  className="w-auto"
                                />
                              )}
                              {empleado.email && (
                                <DataCardItem
                                  icon={Mail}
                                  value={empleado.email}
                                  className="w-auto"
                                />
                              )}
                            </div>
                          </DataCardContent>
                        </DataCard>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
            {/* Espaciador inferior para no quedar detrás del BottomNavbar */}
            <div className="h-[50px]" />
          </div>
        </main>
      </div>

      {/* Modales de Confirmación */}
      <ConfirmarModal
        isOpen={!!mostrarConfirmarEliminarSucursal}
        onClose={() => setMostrarConfirmarEliminarSucursal(null)}
        onConfirm={() => mostrarConfirmarEliminarSucursal && handleEliminarSucursal(mostrarConfirmarEliminarSucursal)}
        title="¿Eliminar Sucursal?"
        description="Esta acción eliminará permanentemente la sucursal. No se puede deshacer si no tiene órdenes asociadas."
        isLoading={eliminando}
      />

      <ConfirmarModal
        isOpen={!!mostrarConfirmarEliminarEmpleado}
        onClose={() => setMostrarConfirmarEliminarEmpleado(null)}
        onConfirm={() => mostrarConfirmarEliminarEmpleado && handleEliminarEmpleado(mostrarConfirmarEliminarEmpleado)}
        title="¿Eliminar Empleado?"
        description="Esta acción deshabilitará o eliminará al empleado de la plataforma permanentemente."
        isLoading={eliminando}
      />

      {/* Modal de Sucursal */}
      <Modal
        isOpen={mostrarModalSucursal}
        onClose={cerrarModalSucursal}
        title={sucursalEditando ? 'Editar Sucursal' : 'Nueva Sucursal'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGuardarSucursal} className="space-y-6">
          <Input
            label="Nombre de la Sucursal"
            value={formSucursal.nombre}
            onChange={(e) => setFormSucursal({ ...formSucursal, nombre: e.target.value })}
            required
            icon={<MapPin className="w-4 h-4" />}
          />
          <Input
            label="Dirección"
            value={formSucursal.direccion}
            onChange={(e) => setFormSucursal({ ...formSucursal, direccion: e.target.value })}
            icon={<MapPin className="w-4 h-4" />}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Teléfono"
              type="tel"
              value={formSucursal.telefono}
              onChange={(e) => setFormSucursal({ ...formSucursal, telefono: e.target.value })}
              icon={<Phone className="w-4 h-4" />}
            />
            <Input
              label="Email"
              type="email"
              value={formSucursal.email}
              onChange={(e) => setFormSucursal({ ...formSucursal, email: e.target.value })}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <input
              type="checkbox"
              id="activa"
              checked={formSucursal.activa}
              onChange={(e) => setFormSucursal({ ...formSucursal, activa: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded-lg focus:ring-primary-500/20 transition-all cursor-pointer"
            />
            <label htmlFor="activa" className="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Sucursal activa</label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={cerrarModalSucursal} disabled={guardando} className="flex-1 font-bold uppercase text-[10px] tracking-widest h-12">Cancelar</Button>
            <Button type="submit" disabled={guardando} isLoading={guardando} className="flex-1 font-bold uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-primary-100">Guardar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Empleado */}
      <Modal
        isOpen={mostrarModalEmpleado}
        onClose={cerrarModalEmpleado}
        title={empleadoEditando ? 'Editar Empleado' : 'Nuevo Empleado'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGuardarEmpleado} className="space-y-6">
          <Input
            label="Nombre Completo"
            value={formEmpleado.nombre_completo}
            onChange={(e) => setFormEmpleado({ ...formEmpleado, nombre_completo: e.target.value })}
            required
            icon={<Users className="w-4 h-4" />}
          />
          <Input
            label="Email"
            type="email"
            value={formEmpleado.email}
            onChange={(e) => setFormEmpleado({ ...formEmpleado, email: e.target.value })}
            required
            icon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Teléfono"
            type="tel"
            value={formEmpleado.telefono}
            onChange={(e) => setFormEmpleado({ ...formEmpleado, telefono: e.target.value })}
            icon={<Phone className="w-4 h-4" />}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="w-full">
              <CustomSelect
                label="Rol"
                value={formEmpleado.rol}
                onChange={(val) => setFormEmpleado({ ...formEmpleado, rol: val })}
                required
                icon={<Users className="w-4 h-4" />}
                options={[
                  { value: "admin", label: "Administrador", color: "bg-purple-100 text-purple-700" },
                  { value: "recepcionista", label: "Recepcionista", color: "bg-pink-100 text-pink-700" },
                  { value: "tecnico", label: "Técnico", color: "bg-blue-100 text-blue-700" }
                ]}
              />
            </div>
            <div className="w-full">
              <CustomSelect
                label="Sucursal"
                value={formEmpleado.sucursal_id}
                onChange={(val) => setFormEmpleado({ ...formEmpleado, sucursal_id: val })}
                required
                icon={<MapPin className="w-4 h-4" />}
                placeholder="Seleccionar..."
                options={sucursales.map(s => ({ value: s.id, label: s.nombre }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
            <input
              type="checkbox"
              id="empleado_activo"
              checked={formEmpleado.activo}
              onChange={(e) => setFormEmpleado({ ...formEmpleado, activo: e.target.checked })}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded-lg focus:ring-primary-500/20 transition-all cursor-pointer"
            />
            <label htmlFor="empleado_activo" className="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Empleado activo</label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="ghost" onClick={cerrarModalEmpleado} disabled={guardando} className="flex-1 font-bold uppercase text-[10px] tracking-widest h-12">Cancelar</Button>
            <Button type="submit" disabled={guardando} isLoading={guardando} className="flex-1 font-bold uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-primary-100">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
