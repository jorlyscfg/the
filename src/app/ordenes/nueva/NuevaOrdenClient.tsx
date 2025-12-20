'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { User, Phone, Mail, Package, Tag, Laptop, Hash, Settings, AlertCircle, ChevronLeft, ChevronRight, Check, UserPlus, Search as SearchIcon, ScanBarcode, Plus, X } from 'lucide-react';
import CapturaFotos from '@/components/ordenes/CapturaFotos';
import FirmaDigital from '@/components/ordenes/FirmaDigital';
import { buscarClientes as buscarClientesAction, crearOrden, subirFotosOrden } from '../actions';
import imageCompression from 'browser-image-compression';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { useNotification } from '@/components/notifications';
import NuevoClienteModal from '@/components/clientes/NuevoClienteModal';
import BarcodeScannerModal from '@/components/ui/BarcodeScannerModal';
import NuevoTipoModal from '@/components/ordenes/NuevoTipoModal';
import NuevaMarcaModeloModal from '@/components/ordenes/NuevaMarcaModeloModal';
import { useDebounce } from '@/hooks/useDebounce';

interface ClienteSugerencia {
    id: string;
    nombre_completo: string;
    telefono: string;
    email: string | null;
}

interface NuevaOrdenClientProps {
    tiposIniciales: string[];
    marcasIniciales: string[];
    modelosIniciales: string[];
    userInfo: {
        nombre: string;
        email?: string | null;
        empresa: { nombre: string };
        sucursal: { nombre: string };
    } | null;
}

export default function NuevaOrdenClient({
    tiposIniciales,
    marcasIniciales,
    modelosIniciales,
    userInfo
}: NuevaOrdenClientProps) {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [clientesSugeridos, setClientesSugeridos] = useState<ClienteSugerencia[]>([]);
    const [buscandoClientes, setBuscandoClientes] = useState(false);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [isNuevoClienteModalOpen, setIsNuevoClienteModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isNuevoTipoOpen, setIsNuevoTipoOpen] = useState(false);
    const [isNuevaMarcaOpen, setIsNuevaMarcaOpen] = useState(false);
    const { success: showSuccess, error: showError } = useNotification();
    const [formData, setFormData] = useState({
        // Datos del cliente
        nombreCliente: '',
        telefonoCliente: '',
        emailCliente: '',

        // Datos del equipo
        tipoEquipo: '',
        marca: '',
        modelo: '',
        serie: '',
        accesorios: '',
        problema: '',

        // Fotos
        fotos: [] as File[],

        // Firma
        firma: '' as string,
    });

    // Cargar datos del cliente desde sessionStorage si existen
    useEffect(() => {
        const datosCliente = sessionStorage.getItem('nuevoClienteData');
        if (datosCliente) {
            try {
                const datos = JSON.parse(datosCliente);
                setFormData((prev) => ({
                    ...prev,
                    nombreCliente: datos.nombre_completo || '',
                    telefonoCliente: datos.telefono || '',
                    emailCliente: datos.email || '',
                }));
                setBusquedaCliente(datos.nombre_completo || '');
                // Limpiar sessionStorage después de cargar
                sessionStorage.removeItem('nuevoClienteData');
            } catch (err) {
                console.error('Error al cargar datos del cliente:', err);
            }
        }
    }, []);

    // Estados para catálogos (inicializados con props)
    const [tiposEquipos, setTiposEquipos] = useState<string[]>(tiposIniciales);
    const [marcas, setMarcas] = useState<string[]>(marcasIniciales);
    const [modelos, setModelos] = useState<string[]>(modelosIniciales);

    // NOTA: Se eliminó el useEffect que cargaba catálogos porque ahora vienen por props

    const buscarClientes = async (termino: string) => {
        if (termino.length < 2) {
            setClientesSugeridos([]);
            setMostrarSugerencias(false);
            return;
        }

        setBuscandoClientes(true);
        try {
            const result = await buscarClientesAction(termino);

            if (result.success) {
                setClientesSugeridos(result.clientes);
                setMostrarSugerencias(true);
            }
        } catch (err) {
            console.error('Error al buscar clientes:', err);
        } finally {
            setBuscandoClientes(false);
        }
    };

    const debouncedBusqueda = useDebounce(busquedaCliente, 400);

    useEffect(() => {
        if (debouncedBusqueda.length >= 2) {
            buscarClientes(debouncedBusqueda);
        } else {
            setClientesSugeridos([]);
            setMostrarSugerencias(false);
        }
    }, [debouncedBusqueda]);

    const seleccionarCliente = (cliente: ClienteSugerencia) => {
        setFormData(prev => ({
            ...prev,
            nombreCliente: cliente.nombre_completo,
            telefonoCliente: cliente.telefono,
            emailCliente: cliente.email || '',
        }));
        setMostrarSugerencias(false);
        setClientesSugeridos([]);
        setBusquedaCliente(cliente.nombre_completo);
        // Auto avanzar al paso 2
        setStep(2);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBusquedaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBusquedaCliente(value);
    };

    const handleScan = (result: string) => {
        setFormData(prev => ({ ...prev, serie: result }));
        showSuccess('Código Escaneado', `Serie: ${result}`);
    };

    const handleNuevoTipoSuccess = (nuevoTipo: string) => {
        setTiposEquipos(prev => [nuevoTipo, ...prev]);
        setFormData(prev => ({ ...prev, tipoEquipo: nuevoTipo }));
    };

    const handleNuevaMarcaSuccess = (marca: string, modelo: string) => {
        // Agregar a listas si no existen
        setMarcas(prev => prev.includes(marca) ? prev : [marca, ...prev]);
        setModelos(prev => prev.includes(modelo) ? prev : [modelo, ...prev]);

        // Auto-seleccionar
        setFormData(prev => ({ ...prev, marca: marca, modelo: modelo }));
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.nombreCliente && !busquedaCliente) {
                showError('Error', 'Debe seleccionar o ingresar un cliente');
                return;
            }

            // Si hay texto en búsqueda pero no se seleccionó cliente, usar ese texto como nombre
            if (!formData.nombreCliente && busquedaCliente) {
                setFormData(prev => ({
                    ...prev,
                    nombreCliente: busquedaCliente,
                    telefonoCliente: prev.telefonoCliente || '0000000000', // Teléfono temporal si no hay
                    emailCliente: prev.emailCliente || ''
                }));
            }
        }
        if (step < 4) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Validar datos mínimos del cliente antes de enviar
            if (!formData.nombreCliente || !formData.telefonoCliente) {
                throw new Error('Información del cliente incompleta. Por favor verifique el Paso 1.');
            }

            // 1. Crear la orden y subir la firma (todo en un solo paso de servidor ahora)
            const result = await crearOrden({
                nombreCliente: formData.nombreCliente,
                telefonoCliente: formData.telefonoCliente,
                emailCliente: formData.emailCliente || undefined,
                tipoEquipo: formData.tipoEquipo,
                marca: formData.marca || undefined,
                modelo: formData.modelo || undefined,
                serie: formData.serie || undefined,
                accesorios: formData.accesorios || undefined,
                problema: formData.problema,
                firma: formData.firma, // Enviamos el base64 de la firma
            });

            if (!result.success || !result.orden) {
                throw new Error(result.error || 'Error al crear la orden');
            }

            // 2. Subir fotos si hay (en segundo plano / paralelo)
            if (formData.fotos.length > 0) {
                const fotosFormData = new FormData();
                formData.fotos.forEach((foto) => {
                    fotosFormData.append('fotos', foto);
                });

                // No esperamos a que terminen todas si queremos rapidez, 
                // pero por ahora esperamos para asegurar éxito
                await subirFotosOrden(result.orden.id, fotosFormData);
            }

            // 3. Éxito y redirección
            showSuccess('¡Orden Creada!', `Número: ${result.orden.numero_orden}`);

            // Redireccionar suavemente
            router.push('/ordenes');
        } catch (err) {
            console.error('Error al crear orden:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
            showError('Error', err instanceof Error ? err.message : 'Error al crear la orden');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar
                title="Nueva Orden de Servicio"
                subtitle={`Paso ${step} de 4`}
                userInfo={userInfo}
            />

            {/* Error Message */}
            {error && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <p className="font-semibold">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="flex items-center justify-between mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex-1 flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${s <= step
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {s}
                            </div>
                            {s < 4 && (
                                <div
                                    className={`flex-1 h-1 mx-2 ${s < step ? 'bg-primary-600' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Form */}
            <main className="relative z-0 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-48">
                <form onSubmit={handleSubmit}>
                    {/* Paso 1: Datos del Cliente */}
                    {step === 1 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-8 pb-6 border-b border-gray-50">
                                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em] mb-2">
                                    Seleccionar Cliente
                                </h2>
                                <p className="text-[11px] font-medium text-gray-400 italic">
                                    Busca o registra al cliente para iniciar la orden...
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 relative">
                                        <Input
                                            label="Buscador Inteligente"
                                            value={busquedaCliente}
                                            onChange={handleBusquedaChange}
                                            placeholder="Escribe Nombre, Teléfono o Email..."
                                            autoComplete="off"
                                            autoFocus
                                            icon={<SearchIcon className={`w-4 h-4 transition-colors ${busquedaCliente ? 'text-primary-500' : 'text-gray-400'}`} />}
                                        />

                                        {/* Sugerencias de clientes */}
                                        {(mostrarSugerencias || buscandoClientes) && (
                                            <div className="absolute z-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                {buscandoClientes && (
                                                    <div className="px-6 py-8 flex flex-col items-center justify-center gap-3">
                                                        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Buscando Clientes...</span>
                                                    </div>
                                                )}
                                                {!buscandoClientes && clientesSugeridos.length === 0 && (
                                                    <div className="px-6 py-10 text-center">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <SearchIcon className="w-6 h-6 text-gray-300" />
                                                        </div>
                                                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-1">Sin resultados</h4>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter">No encontramos un cliente con esa información</p>
                                                    </div>
                                                )}
                                                {clientesSugeridos.map((cliente) => (
                                                    <button
                                                        key={cliente.id}
                                                        type="button"
                                                        onClick={() => seleccionarCliente(cliente)}
                                                        className="w-full text-left px-6 py-4 hover:bg-primary-50/50 border-b border-gray-50 last:border-b-0 transition-all group flex items-center justify-between"
                                                    >
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-bold text-sm text-gray-700 group-hover:text-primary-600 transition-colors uppercase truncate">
                                                                {cliente.nombre_completo}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                                <span className="flex items-center gap-1">
                                                                    <Phone className="w-3 h-3" />
                                                                    {cliente.telefono}
                                                                </span>
                                                                {cliente.email && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Mail className="w-3 h-3" />
                                                                        {cliente.email}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-primary-400 transition-colors shrink-0" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={() => setIsNuevoClienteModalOpen(true)}
                                        className="h-12 w-12 rounded-xl shadow-md p-0 shrink-0 bg-primary-600 hover:bg-primary-700 flex items-center justify-center mb-[1px]"
                                        title="Nuevo Cliente"
                                    >
                                        <UserPlus className="w-6 h-6" strokeWidth={2.5} />
                                    </Button>
                                </div>

                                {/* Info Card si ya hay un cliente seleccionado (por si regresa al paso 1) */}
                                {formData.nombreCliente && !mostrarSugerencias && (
                                    <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary-600 font-black text-lg border border-primary-50">
                                                {formData.nombreCliente.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">{formData.nombreCliente}</h3>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{formData.telefonoCliente}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, nombreCliente: '', telefonoCliente: '', emailCliente: '' }));
                                                setBusquedaCliente('');
                                            }}
                                            className="text-gray-400 hover:text-red-500 rounded-lg p-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Paso 2: Datos del Equipo */}
                    {step === 2 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            {/* Header con Info del Cliente */}
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em]">
                                        Datos del Equipo
                                    </h2>
                                    <p className="text-[11px] text-gray-400 mt-1 font-medium">
                                        Ingrese los detalles del dispositivo a reparar
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 bg-primary-50 px-4 py-2 rounded-xl border border-primary-100">
                                    <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-primary-600 font-bold text-xs border border-primary-50">
                                        {formData.nombreCliente.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Cliente</p>
                                        <p className="text-xs font-bold text-gray-800 uppercase">{formData.nombreCliente}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Tipo de Equipo con Combobox */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Combobox
                                            label="Tipo de Equipo"
                                            value={formData.tipoEquipo}
                                            onChange={(val) => setFormData(prev => ({ ...prev, tipoEquipo: val }))}
                                            options={tiposEquipos}
                                            placeholder="Seleccionar o escribir..."
                                            icon={<Laptop className="w-4 h-4" />}
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => setIsNuevoTipoOpen(true)}
                                        className="h-[46px] w-[46px] rounded-xl shadow-sm p-0 shrink-0 bg-primary-100 hover:bg-primary-200 text-primary-600 flex items-center justify-center mb-[1px]"
                                        title="Nuevo Tipo"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Combobox
                                                label="Marca"
                                                value={formData.marca}
                                                onChange={(val) => setFormData(prev => ({ ...prev, marca: val }))}
                                                options={marcas}
                                                placeholder="Seleccionar marca..."
                                                icon={<Tag className="w-4 h-4" />}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => setIsNuevaMarcaOpen(true)}
                                            className="h-[46px] w-[46px] rounded-xl shadow-sm p-0 shrink-0 bg-primary-100 hover:bg-primary-200 text-primary-600 flex items-center justify-center mb-[1px]"
                                            title="Nueva Marca/Modelo"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>

                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Combobox
                                                label="Modelo"
                                                value={formData.modelo}
                                                onChange={(val) => setFormData(prev => ({ ...prev, modelo: val }))}
                                                options={modelos}
                                                placeholder="Seleccionar modelo..."
                                                icon={<Package className="w-4 h-4" />}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => setIsNuevaMarcaOpen(true)}
                                            className="h-[46px] w-[46px] rounded-xl shadow-sm p-0 shrink-0 bg-primary-100 hover:bg-primary-200 text-primary-600 flex items-center justify-center mb-[1px]"
                                            title="Nueva Marca/Modelo"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Input
                                            label="Número de Serie"
                                            name="serie"
                                            value={formData.serie}
                                            onChange={handleInputChange}
                                            placeholder="Número de serie del equipo"
                                            icon={<Hash className="w-4 h-4" />}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => setIsScannerOpen(true)}
                                        className="h-[46px] w-[46px] rounded-xl shadow-sm p-0 shrink-0 bg-gray-800 hover:bg-gray-900 flex items-center justify-center mb-[1px]"
                                        title="Escanear Código de Barras"
                                    >
                                        <ScanBarcode className="w-5 h-5 text-white" />
                                    </Button>
                                </div>

                                <Input
                                    label="Accesorios"
                                    name="accesorios"
                                    value={formData.accesorios}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Cable de corriente, bolsa, cargador..."
                                    icon={<Settings className="w-4 h-4" />}
                                />

                                <div className="w-full">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                                        Problema Reportado *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-3 text-gray-400 pointer-events-none">
                                            <AlertCircle className="w-4 h-4" />
                                        </div>
                                        <textarea
                                            name="problema"
                                            value={formData.problema}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold text-gray-700 placeholder:text-gray-300 placeholder:font-normal min-h-[120px]"
                                            placeholder="Describe el problema o falla del equipo..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paso 3: Fotos */}
                    {step === 3 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em] mb-4">
                                Fotografías (Opcional)
                            </h2>

                            <p className="text-[11px] font-medium text-gray-400 italic px-1 mb-10">
                                Toma fotos del equipo para evidencia técnica...
                            </p>

                            <CapturaFotos
                                fotos={formData.fotos}
                                onFotosChange={(fotos) => setFormData(prev => ({ ...prev, fotos }))}
                                maxFotos={10}
                            />
                        </div>
                    )}

                    {/* Paso 4: Firma del Cliente */}
                    {step === 4 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-[0.2em] mb-4">
                                Firma del Cliente
                            </h2>

                            <p className="text-[11px] font-medium text-gray-400 italic px-1 mb-10">
                                El cliente debe firmar para aceptar los términos y condiciones...
                            </p>

                            <FirmaDigital
                                onFirmaGuardada={(firmaDataUrl) => {
                                    setFormData(prev => ({ ...prev, firma: firmaDataUrl }));
                                }}
                                nombreCliente={formData.nombreCliente}
                                firmaExistente={formData.firma}
                            />

                            {formData.firma && (
                                <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider">
                                        Firma capturada correctamente
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons - Sticky Footer */}
                    <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 md:relative md:bg-transparent md:border-0 md:shadow-none md:p-0 md:mt-10 md:bottom-auto">
                        <div className="max-w-4xl mx-auto flex justify-between items-center">
                            {step > 1 ? (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={prevStep}
                                    className="gap-2 font-bold uppercase text-[11px] tracking-widest h-12 px-8"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                    Anterior
                                </Button>
                            ) : (
                                <div />
                            )}

                            <div className="flex gap-4">
                                {step < 4 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={
                                            (step === 1 && !formData.nombreCliente && !busquedaCliente) ||
                                            (step === 2 && (!formData.tipoEquipo || !formData.marca || !formData.modelo))
                                        }
                                        className="gap-2 font-bold uppercase text-[11px] tracking-widest h-12 px-10 shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none bg-primary-600 text-white hover:bg-primary-700"
                                    >
                                        Siguiente
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !formData.firma}
                                        isLoading={isSubmitting}
                                        className="gap-2 font-bold uppercase text-[11px] tracking-widest h-12 px-10 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        Confirmar Orden
                                        <Check className="w-5 h-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>

                <NuevoClienteModal
                    isOpen={isNuevoClienteModalOpen}
                    onClose={() => setIsNuevoClienteModalOpen(false)}
                    onSuccess={(cliente) => seleccionarCliente(cliente)}
                />

                <BarcodeScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScan={handleScan}
                />

                <NuevoTipoModal
                    isOpen={isNuevoTipoOpen}
                    onClose={() => setIsNuevoTipoOpen(false)}
                    onSuccess={handleNuevoTipoSuccess}
                />

                <NuevaMarcaModeloModal
                    isOpen={isNuevaMarcaOpen}
                    onClose={() => setIsNuevaMarcaOpen(false)}
                    onSuccess={handleNuevaMarcaSuccess}
                    initialMarca={formData.marca}
                />
            </main>
        </div>
    );
}
