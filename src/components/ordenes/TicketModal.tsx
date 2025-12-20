'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2, X, MessageSquare } from 'lucide-react';
import { generarTicketPDF, descargarPDF } from '@/lib/utils/pdf-generator';
import { generarQRDataURL } from '@/components/ordenes/QRGenerator';
import { urlToBase64 } from '@/lib/utils/image-utils';
import { generarTicketImagen } from '@/lib/utils/whatsapp-ticket';
import { useNotification } from '@/components/notifications';
import type { OrdenDetalle } from '@/app/ordenes/actions';

interface TicketModalProps {
    orden: OrdenDetalle;
    isOpen: boolean;
    onClose: () => void;
}

export default function TicketModal({ orden, isOpen, onClose }: TicketModalProps) {
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [compartiendo, setCompartiendo] = useState(false);
    const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
    const [firmaBase64, setFirmaBase64] = useState<string | undefined>(undefined);
    const { success: showSuccess, error: showError } = useNotification();

    useEffect(() => {
        if (isOpen && orden && orden.sucursal) {
            const preCargarImagenes = async () => {
                const empresa = orden.sucursal?.empresa;
                if (!empresa) return;

                try {
                    const [logo, firma] = await Promise.all([
                        empresa.logo_url ? urlToBase64(empresa.logo_url) : Promise.resolve(undefined),
                        orden.firma_cliente_url ? urlToBase64(orden.firma_cliente_url) : Promise.resolve(undefined)
                    ]);
                    setLogoBase64(logo);
                    setFirmaBase64(firma);
                } catch (error) {
                    console.error('Error pre-cargando imágenes:', error);
                }
            };
            preCargarImagenes();
        }
    }, [isOpen, orden]);

    if (!isOpen) return null;

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const handleDescargarPDF = async () => {
        if (!orden || !orden.sucursal) return;

        try {
            setGenerandoPDF(true);

            const empresa = orden.sucursal.empresa;

            // Generar QRs pre-cargados
            const [internalQR, publicQR] = await Promise.all([
                generarQRDataURL(orden.id, 256),
                generarQRDataURL(`${window.location.origin}/consulta/${orden.numero_orden}`, 256)
            ]);

            // Preparar datos para el PDF usando las imágenes ya pre-cargadas
            const datosPDF = {
                empresa: {
                    nombre: empresa.nombre,
                    telefono: empresa.telefono || '',
                    whatsapp: orden.sucursal.whatsapp || undefined,
                    direccion: orden.sucursal.direccion || undefined,
                    email: empresa.email || undefined,
                    sitio_web: empresa.sitio_web || undefined,
                    logoUrl: logoBase64,
                },
                cliente: {
                    nombre: orden.cliente.nombre_completo,
                    telefono: orden.cliente.telefono,
                    email: orden.cliente.email || undefined
                },
                equipo: {
                    tipo: orden.tipo_equipo.nombre,
                    marca: orden.marca_modelo?.marca,
                    modelo: orden.marca_modelo?.modelo,
                    numeroSerie: orden.numero_serie || undefined,
                    detalles: orden.problema_reportado || 'Sin detalles',
                    incluyeCargador: false,
                    accesorios: orden.accesorios || undefined
                },
                orden: {
                    numeroOrden: orden.numero_orden,
                    fecha: new Date(orden.fecha_ingreso),
                    anticipo: 0,
                    costoEstimado: orden.costo_estimado ? parseFloat(orden.costo_estimado.toString()) : undefined,
                    estado: orden.estado,
                    firmaUrl: firmaBase64,
                    qrCodeDataUrl: internalQR, // Mantenemos compatibilidad por ahora
                    internalQrCodeDataUrl: internalQR,
                    publicQrCodeDataUrl: publicQR,
                    empleadoRecibe: orden.empleado_recibe?.nombre_completo || 'Técnico de Turno'
                },
                terminos: {
                    costoMinimo: 250,
                    diasLimite: 30,
                    mensaje: 'Se requiere esta orden para recoger el equipo'
                }
            };

            // Generar y descargar PDF
            const pdf = generarTicketPDF(datosPDF as any);
            descargarPDF(pdf, `ticket-orden-${orden.numero_orden}`);

        } catch (error) {
            console.error('Error al generar PDF:', error);
        } finally {
            setGenerandoPDF(false);
        }
    };

    const handleCompartirWhatsApp = async () => {
        if (!orden || !orden.sucursal) return;

        try {
            setCompartiendo(true);

            const empresa = orden.sucursal.empresa;

            const imageDataUrl = await generarTicketImagen({
                empresa: {
                    nombre: empresa.nombre,
                    logoUrl: logoBase64,
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
                // Fallback: Descargar la imagen y abrir WhatsApp
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
            showError('Error', 'No se pudo compartir la imagen. El ticket se ha descargado a tu dispositivo.');
        } finally {
            setCompartiendo(false);
        }
    };

    return (
        <div id="modal-ticket" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
            <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative animate-in fade-in zoom-in duration-200 printable-modal">

                {/* Cabecera del Modal con Iconos */}
                <div className="sticky top-0 right-0 p-4 bg-white/80 backdrop-blur-md flex justify-end gap-3 border-b border-gray-100 z-10 no-print">
                    <button
                        onClick={handleCompartirWhatsApp}
                        disabled={compartiendo}
                        className="p-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#22c35e] transition-all active:scale-95 shadow-lg shadow-green-100 disabled:opacity-50"
                        title="Compartir por WhatsApp"
                    >
                        {compartiendo ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <MessageSquare className="w-5 h-5" />
                        )}
                    </button>

                    <button
                        onClick={handleDescargarPDF}
                        disabled={generandoPDF}
                        className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors disabled:opacity-50"
                        title="Guardar PDF"
                    >
                        <Download className="w-5 h-5" />
                    </button>

                    <button
                        onClick={onClose}
                        className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-colors"
                        title="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Contenido del Ticket */}
                <div className="p-8 print:p-0">
                    {/* Estilos específicos para impresión del modal content */}
                    <style jsx global>{`
                        @media print {
                          /* Resetear animaciones que cuelgan el renderizado de impresión */
                          *, *::before, *::after {
                            animation: none !important;
                            transition: none !important;
                            transition-duration: 0s !important;
                            animation-duration: 0s !important;
                          }

                          /* Estrategia de visibilidad segura */
                          body {
                            visibility: hidden !important;
                            background: white !important;
                          }
                          
                          #modal-ticket, #modal-ticket * {
                            visibility: visible !important;
                          }

                          #modal-ticket {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            display: block !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            background: white !important;
                          }

                          .printable-modal {
                            position: static !important;
                            max-width: none !important;
                            max-height: none !important;
                            width: 100% !important;
                            box-shadow: none !important;
                            border: none !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: visible !important;
                          }

                          .no-print {
                            display: none !important;
                          }

                          .ticket-content {
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 15mm !important;
                          }

                          @page {
                            margin: 0;
                            size: letter;
                          }
                        }
                    `}</style>

                    <div className="ticket-content">
                        {/* Cabecera Empresa */}
                        <div className="flex flex-row items-start justify-between gap-6 border-b border-gray-200 pb-6 mb-6">
                            <div className="flex flex-row items-center gap-4">
                                {(logoBase64 || orden.sucursal?.empresa.logo_url) && (
                                    <img
                                        src={logoBase64 || orden.sucursal?.empresa.logo_url || undefined}
                                        alt="Logo"
                                        className="h-16 w-16 object-contain rounded-xl bg-gray-50 p-1.5"
                                    />
                                )}
                                <div className="text-left">
                                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">
                                        {orden.sucursal?.empresa.nombre || 'TH EMPRESARIAL'}
                                    </h1>
                                    <p className="font-bold text-primary-600 text-sm mt-1 uppercase tracking-wider">{orden.sucursal?.nombre}</p>
                                    <div className="text-[10px] text-gray-500 mt-0.5 space-y-0.5">
                                        <p>
                                            {orden.sucursal?.telefono && `Tel: ${orden.sucursal.telefono}`}
                                            {orden.sucursal?.whatsapp && ` | WhatsApp: ${orden.sucursal.whatsapp}`}
                                        </p>
                                        <p>
                                            {orden.sucursal?.empresa.email && orden.sucursal.empresa.email}
                                            {orden.sucursal?.empresa.sitio_web && ` | ${orden.sucursal.empresa.sitio_web}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right max-w-[240px]">
                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ubicación</h3>
                                <p className="text-[10px] text-gray-600 font-medium leading-tight">
                                    {orden.sucursal?.direccion}
                                </p>
                            </div>
                        </div>

                        {/* Número de Orden y Fecha */}
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orden de Servicio</h2>
                                <p className="text-2xl font-black text-gray-900 leading-none">#{orden.numero_orden}</p>
                            </div>
                            <div className="text-right">
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Ingreso</h2>
                                <p className="text-sm font-bold text-gray-800 uppercase leading-none">{formatearFecha(orden.fecha_ingreso)}</p>
                            </div>
                        </div>

                        {/* Datos Cliente y Equipo */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Datos del Cliente</h3>
                                <div className="text-sm space-y-1.5">
                                    <p className="font-bold text-gray-900">{orden.cliente.nombre_completo}</p>
                                    <p className="text-gray-600 flex items-center gap-2 font-medium">{orden.cliente.telefono}</p>
                                    {orden.cliente.email && (
                                        <p className="text-gray-500 text-xs truncate font-medium">{orden.cliente.email}</p>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Datos del Equipo</h3>
                                <div className="text-sm space-y-1.5">
                                    <p className="font-bold text-gray-900">
                                        {orden.tipo_equipo.nombre} {orden.marca_modelo && `- ${orden.marca_modelo.marca} ${orden.marca_modelo.modelo}`}
                                    </p>
                                    {orden.numero_serie && (
                                        <p className="text-gray-600 text-xs font-medium">S/N: {orden.numero_serie}</p>
                                    )}
                                    {orden.accesorios && (
                                        <p className="text-gray-500 text-[10px] font-medium leading-tight">Acc: {orden.accesorios}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Problema Reportado */}
                        <div className="mb-8 p-4 border-2 border-gray-100 rounded-2xl">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Problema Reportado</h3>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">{orden.problema_reportado}</p>
                        </div>

                        {/* Pago y QRs */}
                        <div className="grid grid-cols-2 gap-8 mb-6 border-t border-gray-100 pt-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resumen Económico</h3>
                                    <div className="space-y-0.5">
                                        <p className="text-sm text-gray-600 font-medium tracking-tight">Anticipo: <span className="text-gray-900 font-black">$0.00</span></p>
                                        {orden.costo_estimado && (
                                            <p className="text-sm text-gray-600 font-medium tracking-tight">Est. Total: <span className="text-gray-900 font-black">${parseFloat(orden.costo_estimado.toString()).toFixed(2)}</span></p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Atendido por</h3>
                                    <p className="text-sm font-black text-gray-900 uppercase">{orden.empleado_recibe?.nombre_completo || 'Técnico de Turno'}</p>
                                </div>
                            </div>

                            <div className="flex gap-10 justify-end items-center">
                                <div className="text-center">
                                    <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm mb-1">
                                        <QRCodeSVG value={orden.id} size={70} />
                                    </div>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-none">Escaneo<br />Interno</p>
                                </div>
                                <div className="text-center">
                                    <div className="p-2 bg-white border border-gray-100 rounded-xl shadow-sm mb-1">
                                        <QRCodeSVG value={`${window.location.origin}/consulta/${orden.numero_orden}`} size={70} />
                                    </div>
                                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest leading-none">Consulta<br />Cliente</p>
                                </div>
                            </div>
                        </div>

                        {/* Términos y Firma */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="text-[8px] text-gray-500 space-y-1.5 leading-tight">
                                    <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Términos y Condiciones</h3>
                                    <p>• Los equipos no reclamados en 30 días se considerarán abandonados.</p>
                                    <p>• La empresa no se responsabiliza por la integridad de los datos.</p>
                                    <p>• Es indispensable presentar este ticket para cualquier trámite.</p>
                                    <div className="mt-2 p-1.5 bg-gray-50 rounded border border-gray-200">
                                        <span className="text-[7px] font-black text-gray-400 uppercase block mb-0.5 tracking-tighter">Consulta en línea:</span>
                                        <span className="text-[8px] font-mono text-primary-700 font-bold break-all">
                                            {window.location.origin}/consulta/{orden.numero_orden}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-end">
                                    {(firmaBase64 || orden.firma_cliente_url) && (
                                        <img
                                            src={firmaBase64 || orden.firma_cliente_url || undefined}
                                            alt="Firma Cliente"
                                            className="h-12 object-contain mb-1"
                                        />
                                    )}
                                    <div className="w-full border-t border-gray-400"></div>
                                    <span className="text-[9px] font-black text-gray-900 uppercase tracking-widest mt-1">Firma del Cliente</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
