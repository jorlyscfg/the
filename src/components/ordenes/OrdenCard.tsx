import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, Calendar, User, Laptop, DollarSign, Trash2, Loader2, Maximize2, ImageIcon, Pencil, Hash, Package, FileText, ClipboardList, PenTool, CheckCircle2, History as HistoryIcon, Banknote, Plus, Phone, Mail, Clock, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import {
    DataCard,
    DataCardHeader,
    DataCardContent,
    DataCardFooter
} from '@/components/ui/DataCard';
import type { Orden } from '@/app/ordenes/actions';
import { eliminarOrden, actualizarEstadoOrden } from '@/app/ordenes/actions';
import { useNotification } from '@/components/notifications';
import ConfirmarEliminacionModal from './ConfirmarEliminacionModal';
import { StatusSelector } from './StatusSelector';
import ImageLightbox from './ImageLightbox';
import ActualizarOrdenModal from './ActualizarOrdenModal';
import { Modal } from '@/components/ui/Modal';
import RegistroPagos from './RegistroPagos';
import HistorialPagos from './HistorialPagos';
import TicketModal from './TicketModal';
import { generarTicketImagen } from '@/lib/utils/whatsapp-ticket';
import type { OrdenDetalle } from '@/app/ordenes/actions';

interface OrdenCardProps {
    orden: Orden;
}

export default function OrdenCard({ orden }: OrdenCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showLightbox, setShowLightbox] = useState(false);
    const [showPagosModal, setShowPagosModal] = useState(false);
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { success: showSuccess, error: showError } = useNotification();
    const router = useRouter();

    const statusOptions = [
        { value: 'PENDIENTE', label: 'Pendiente' },
        { value: 'EN_REVISION', label: 'En Revisión' },
        { value: 'EN_REPARACION', label: 'En Proceso' },
        { value: 'REPARADO', label: 'Lista / Reparada' },
        { value: 'ENTREGADO', label: 'Entregada' },
    ];

    const getEstadoBadgeClass = (estado: string) => {
        const classes = {
            'PENDIENTE': 'bg-yellow-100 text-yellow-700',
            'EN_REVISION': 'bg-blue-100 text-blue-700',
            'EN_REPARACION': 'bg-orange-100 text-orange-700',
            'REPARADO': 'bg-green-100 text-green-700',
            'ENTREGADO': 'bg-gray-100 text-gray-600',
            'CANCELADO': 'bg-red-100 text-red-700',
        };
        return classes[estado as keyof typeof classes] || 'bg-gray-100 text-gray-800';
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatearMoneda = (cantidad: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(cantidad);
    };

    const handleEliminar = async () => {
        setIsDeleting(true);
        try {
            const result = await eliminarOrden(orden.id);
            if (result.success) {
                showSuccess('Éxito', 'Orden eliminada correctamente');
                setShowConfirmModal(false);
            } else {
                showError('Error', result.error || 'No se pudo eliminar la orden');
                setIsDeleting(false);
            }
        } catch (err) {
            showError('Error', 'Ocurrió un error inesperado');
            console.error(err);
            setIsDeleting(false);
        }
    };

    const handleCambiarEstado = async (nuevoEstado: string) => {
        if (nuevoEstado === orden.estado) return;

        setIsUpdatingStatus(true);
        try {
            const result = await actualizarEstadoOrden({
                ordenId: orden.id,
                nuevoEstado,
            });

            if (result.success) {
                showSuccess('Estado actualizado', `La orden ahora está en: ${nuevoEstado.replace('_', ' ')}`);
            } else {
                showError('Error', result.error || 'No se pudo actualizar el estado');
            }
        } catch (err) {
            showError('Error', 'Error al conectar con el servidor');
            console.error(err);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleCompartirWhatsApp = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!orden || !orden.sucursal) return;

        try {
            setIsSharing(true);

            const empresa = orden.sucursal.empresa;

            const imageDataUrl = await generarTicketImagen({
                empresa: {
                    nombre: empresa.nombre,
                    logoUrl: empresa.logo_url || undefined,
                    direccion: orden.sucursal.direccion || undefined,
                    telefono: empresa.telefono || undefined,
                    whatsapp: orden.sucursal.whatsapp || undefined,
                },
                orden: {
                    id: orden.id,
                    numeroOrden: orden.numero_orden,
                    fecha: new Date(orden.fecha_ingreso),
                },
                cliente: {
                    nombre: orden.cliente.nombre_completo,
                },
                equipo: {
                    tipo: orden.tipo_equipo.nombre,
                    marca: orden.marca_modelo?.marca || undefined,
                    modelo: orden.marca_modelo?.modelo || undefined,
                    serie: orden.numero_serie || undefined,
                }
            });

            // Convertir Data URL a Blob para compartir
            const res = await fetch(imageDataUrl);
            const blob = await res.blob();
            const file = new File([blob], `ticket-${orden.numero_orden}.png`, { type: 'image/png' });

            // Preparar el texto para compartir con mejor formato
            const shareText = `Hola *${orden.cliente.nombre_completo}* 👋\n\nAdjuntamos el ticket de recepción para tu equipo: *${orden.tipo_equipo.nombre}*.\n\n🛠️ *Estado y Seguimiento:*\nPuedes consultar el estado en tiempo real en este enlace:\n${window.location.origin}/consulta/${orden.numero_orden}\n\n¡Gracias por tu confianza! 🙏`;

            // Verificar si el navegador soporta Web Share API para archivos
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                // 1. Copiar texto al portapapeles
                try {
                    await navigator.clipboard.writeText(shareText);
                    showSuccess('Texto copiado', 'Pégalo en el mensaje al compartir la imagen');
                } catch (clipboardError) {
                    console.error('Error al copiar al portapapeles:', clipboardError);
                }

                // 2. Compartir solo la imagen
                try {
                    await navigator.share({
                        files: [file],
                        title: `Ticket Orden #${orden.numero_orden}`,
                    });
                } catch (e) {
                    console.log('Share de imagen cancelado o fallido', e);
                }
            } else {
                // Fallback: Descargar y abrir WhatsApp
                const link = document.createElement('a');
                link.href = imageDataUrl;
                link.download = `ticket-${orden.numero_orden}.png`;
                link.click();

                const mensaje = encodeURIComponent(shareText);
                const clienteTelefono = orden.cliente.telefono ? orden.cliente.telefono.replace(/\D/g, '') : null;
                const whatsappUrl = clienteTelefono
                    ? `https://wa.me/${clienteTelefono}?text=${mensaje}`
                    : `https://wa.me/?text=${mensaje}`;
                window.open(whatsappUrl, '_blank');
            }

        } catch (error) {
            console.error('Error al compartir por WhatsApp:', error);
            showError('Error', 'No se pudo generar la imagen del ticket');
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <DataCard className={`group ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Header: Numero de Orden y Acciones */}
            <DataCardHeader
                title={orden.numero_orden}
                subtitle="Orden"
                actions={
                    <div className="flex items-center gap-1.5">
                        <StatusSelector
                            value={orden.estado}
                            onChange={handleCambiarEstado}
                            isLoading={isUpdatingStatus}
                            disabled={isDeleting}
                            options={statusOptions}
                            getBadgeClass={getEstadoBadgeClass}
                        />
                        <button
                            onClick={handleCompartirWhatsApp}
                            disabled={isSharing}
                            className="p-1.5 text-gray-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                            title="Compartir ticket por WhatsApp"
                        >
                            {isSharing ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                                <MessageSquare className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowEditModal(true);
                            }}
                            className="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Editar orden"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowConfirmModal(true);
                            }}
                            disabled={isDeleting}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar orden"
                        >
                            {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                }
            />

            <DataCardContent>
                <div className="flex gap-4">
                    {/* Info Section - Left Side */}
                    <div className="flex-[2] flex flex-col gap-3 min-w-0">
                        {/* Cliente */}
                        <div className="flex items-start gap-2.5">
                            <div className="h-7 w-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0 text-primary-600">
                                <User className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 overflow-hidden">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Cliente</span>
                                <p className="text-xs font-bold text-gray-800 truncate leading-tight uppercase">{orden.cliente.nombre_completo}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                        <Phone className="w-3 h-3" />
                                        <span>{orden.cliente.telefono}</span>
                                    </div>
                                    {orden.cliente.email && (
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 truncate">
                                            <Mail className="w-3 h-3" />
                                            <span className="truncate">{orden.cliente.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Equipo */}
                        <div className="flex items-start gap-2.5 mt-1 border-t border-gray-50 pt-3">
                            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                                <Laptop className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block leading-none mb-1">Equipo</span>
                                <p className="text-xs font-bold text-gray-800 uppercase leading-tight">
                                    {orden.tipo_equipo.nombre}
                                    {orden.marca_modelo && (
                                        <span className="text-gray-500 font-medium ml-1">
                                            - {orden.marca_modelo.marca} {orden.marca_modelo.modelo}
                                        </span>
                                    )}
                                </p>
                                {(orden.numero_serie || orden.accesorios) && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                                        {orden.numero_serie && (
                                            <div className="flex items-center gap-1">
                                                <Hash className="w-2.5 h-2.5 text-gray-400" />
                                                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-tighter truncate">
                                                    S/N: {orden.numero_serie}
                                                </span>
                                            </div>
                                        )}
                                        {orden.accesorios && (
                                            <div className="flex items-center gap-1">
                                                <Package className="w-2.5 h-2.5 text-gray-400" />
                                                <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-tighter truncate">
                                                    ACC: {orden.accesorios}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Image Preview Area - Right Side */}
                    <div className="flex-shrink-0 flex flex-col gap-2">
                        {orden.fotos.length > 0 ? (
                            <div
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowLightbox(true);
                                }}
                                className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl overflow-hidden border border-gray-100 shadow-sm relative group/img cursor-pointer transition-all hover:ring-2 hover:ring-primary-500 bg-gray-50"
                            >
                                <img
                                    src={orden.fotos[0].url_foto}
                                    alt="Vista previa"
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                                </div>
                                {orden.fotos.length > 1 && (
                                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-white/20">
                                        +{orden.fotos.length - 1}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300 gap-1 bg-gray-50/30">
                                <ImageIcon className="w-5 h-5 opacity-40" />
                                <span className="text-[7px] font-bold uppercase tracking-tighter">Sin fotos</span>
                            </div>
                        )}

                        {/* Printer Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowTicketModal(true);
                            }}
                            className="w-full py-1.5 bg-gray-50 hover:bg-green-50 text-gray-400 hover:text-green-600 border border-gray-100 rounded-lg transition-all flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider"
                        >
                            <span className="text-xs">🖨️</span>
                            Ticket
                        </button>
                    </div>
                </div>

                {/* Problema Reportado & Diagnostico */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100/50 overflow-hidden">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <FileText className="w-3 h-3 text-red-400" />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Problema</span>
                        </div>
                        <p className="text-[10px] text-gray-700 font-medium leading-relaxed line-clamp-2 italic">
                            "{orden.problema_reportado}"
                        </p>
                    </div>
                    {(orden.diagnostico || orden.reparacion_realizada || orden.observaciones) && (
                        <div className="min-w-0 border-t md:border-t-0 md:border-l border-gray-100 pt-2 md:pt-0 md:pl-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Diagnóstico / Notas</span>
                            </div>
                            <div className="space-y-1.5">
                                {(orden.diagnostico || orden.reparacion_realizada) && (
                                    <p className="text-[10px] text-gray-700 font-bold leading-relaxed line-clamp-2">
                                        {orden.diagnostico || orden.reparacion_realizada}
                                    </p>
                                )}
                                {orden.observaciones && (
                                    <p className="text-[9px] text-gray-500 font-medium leading-relaxed italic border-t border-gray-100/50 pt-1">
                                        Obs: {orden.observaciones}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Costos y Pagos Directo en Card */}
                <div className="flex items-stretch gap-2">
                    <div className="flex-1 bg-primary-50/30 rounded-xl p-2.5 border border-primary-100/50 flex flex-col justify-center">
                        <span className="text-[8px] font-bold text-primary-400 uppercase tracking-widest mb-1 leading-none">Costo Final</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-black text-primary-700">
                                {formatearMoneda(orden.costo_final || orden.costo_estimado || 0)}
                            </span>
                            {orden.costo_final && orden.costo_estimado && (
                                <span className="text-[8px] font-medium text-primary-300 line-through">
                                    {formatearMoneda(orden.costo_estimado)}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={`flex-1 rounded-xl p-2.5 border flex flex-col justify-center ${orden.saldo_pendiente > 0 ? 'bg-red-50/30 border-red-100/50' : 'bg-green-50/30 border-green-100/50'}`}>
                        <span className={`text-[8px] font-bold uppercase tracking-widest mb-1 leading-none ${orden.saldo_pendiente > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {orden.saldo_pendiente > 0 ? 'Saldo Pendiente' : 'Pagado'}
                        </span>
                        <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-black ${orden.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatearMoneda(orden.saldo_pendiente || 0)}
                            </span>
                            {orden.saldo_pendiente > 0 && (
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPagosModal(true); }}
                                    className="h-6 w-6 bg-red-600 text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-red-700 transition-colors active:scale-90"
                                    title="Registrar Pago"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Collapsible History Section */}
                {orden.historial && orden.historial.length > 0 && (
                    <div className="border-t border-gray-50 pt-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest py-1 hover:text-primary-500 transition-colors"
                        >
                            <div className="flex items-center gap-1.5">
                                <HistoryIcon className="w-3 h-3" />
                                Historial ({orden.historial.length})
                            </div>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {isExpanded && (
                            <div className="mt-3 space-y-4">
                                {/* Historial de Cambios */}
                                <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
                                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 pb-1">
                                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Movimientos</span>
                                    </div>
                                    {orden.historial.map((item) => (
                                        <div key={item.id} className="border-l-2 border-primary-200 pl-2.5 py-1 text-[10px]">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className="font-bold text-gray-700 uppercase tracking-tight">
                                                    {item.estado_nuevo.replace('_', ' ')}
                                                </span>
                                                <span className="text-[9px] text-gray-400 font-medium">
                                                    {new Date(item.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </div>
                                            {item.observaciones && (
                                                <p className="text-gray-500 leading-tight line-clamp-2 italic">
                                                    {item.observaciones}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Historial de Pagos */}
                                <div className="border-t border-gray-50 pt-3">
                                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Desglose de Pagos</span>
                                    <div className="scale-90 origin-top-left -mr-[11%]">
                                        <HistorialPagos ordenId={orden.id} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DataCardContent>

            <DataCardFooter>
                <div className="flex items-center gap-1.5 text-gray-400 col-span-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold tracking-tighter">Entró: {formatearFecha(orden.fecha_ingreso)}</span>
                </div>

                <div className="flex items-center justify-end gap-2 col-span-1 border-0">
                    {orden.firma_cliente_url && (
                        <button
                            onClick={() => setShowSignatureModal(true)}
                            className="flex items-center gap-1 text-[9px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded border border-primary-100 hover:bg-primary-100 transition-colors"
                        >
                            <PenTool className="w-2.5 h-2.5" />
                            Firma
                        </button>
                    )}
                    {orden.fecha_salida && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Entregada
                        </div>
                    )}
                </div>
            </DataCardFooter>

            <ConfirmarEliminacionModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleEliminar}
                isLoading={isDeleting}
                numeroOrden={orden.numero_orden}
            />
            <ActualizarOrdenModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                orden={orden}
            />
            <ImageLightbox
                isOpen={showLightbox}
                onClose={() => setShowLightbox(false)}
                photos={orden.fotos}
            />

            <Modal
                isOpen={showPagosModal}
                onClose={() => setShowPagosModal(false)}
                title={`Registrar Pago - ${orden.numero_orden}`}
            >
                <RegistroPagos
                    ordenId={orden.id}
                    saldoPendiente={orden.saldo_pendiente || 0}
                    onPagoRegistrado={() => {
                        setShowPagosModal(false);
                        router.refresh();
                    }}
                    onCerrar={() => setShowPagosModal(false)}
                />
            </Modal>

            {/* Modal de Firma */}
            <Modal
                isOpen={showSignatureModal}
                onClose={() => setShowSignatureModal(false)}
                title={`Firma del Cliente - ${orden.numero_orden}`}
            >
                <div className="flex flex-col items-center gap-4 py-4">
                    <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl border border-gray-100 overflow-hidden flex items-center justify-center p-4">
                        <img
                            src={orden.firma_cliente_url!}
                            alt="Firma del cliente"
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal de Ticket de Servicio */}
            <TicketModal
                isOpen={showTicketModal}
                onClose={() => setShowTicketModal(false)}
                orden={orden as unknown as OrdenDetalle}
            />
        </DataCard>
    );
}
