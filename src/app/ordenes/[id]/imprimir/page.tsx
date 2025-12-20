'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { OrdenDetalle } from '../../actions';
import { obtenerOrdenPorId } from '../../actions';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer } from 'lucide-react';
import { generarTicketPDF, descargarPDF } from '@/lib/utils/pdf-generator';
import { generarQRDataURL } from '@/components/ordenes/QRGenerator';
import { urlToBase64 } from '@/lib/utils/image-utils';
import Navbar from '@/components/layout/Navbar';

export default function ImprimirOrdenPage() {
  const params = useParams();
  const [orden, setOrden] = useState<OrdenDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [firmaBase64, setFirmaBase64] = useState<string | undefined>(undefined);

  useEffect(() => {
    cargarOrden();
  }, [params.id]);

  useEffect(() => {
    // Auto-imprimir cuando la orden esté cargada y las imágenes pre-procesadas
    if (orden && !loading && (logoBase64 !== undefined || firmaBase64 !== undefined)) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [orden, loading, logoBase64, firmaBase64]);

  const cargarOrden = async () => {
    try {
      setLoading(true);

      const result = await obtenerOrdenPorId(params.id as string);

      if (result.success && result.orden) {
        setOrden(result.orden);
        // Pre-cargar imágenes inmediatamente
        const empresa = result.orden.sucursal?.empresa;
        if (empresa) {
          Promise.all([
            empresa.logo_url ? urlToBase64(empresa.logo_url) : Promise.resolve(undefined),
            result.orden.firma_cliente_url ? urlToBase64(result.orden.firma_cliente_url) : Promise.resolve(undefined)
          ]).then(([logo, firma]) => {
            setLogoBase64(logo);
            setFirmaBase64(firma);
          }).catch(err => {
            console.error('Error pre-cargando imágenes:', err);
            // Marcar como procesadas aunque fallen para no bloquear el auto-print
            setLogoBase64(undefined);
            setFirmaBase64(undefined);
          });
        } else {
          setLogoBase64(undefined);
          setFirmaBase64(undefined);
        }
      }
    } catch (err) {
      console.error('Error al cargar orden:', err);
    } finally {
      setLoading(false);
    }
  };

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

      // Preparar datos para el PDF
      const datosPDF = {
        empresa: {
          nombre: empresa.nombre,
          telefono: empresa.telefono || '',
          whatsapp: orden.sucursal.whatsapp || undefined,
          direccion: orden.sucursal.direccion || undefined,
          email: empresa.email || undefined,
          sitioWeb: empresa.sitio_web || undefined,
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
          internalQrCodeDataUrl: await generarQRDataURL(orden.id, 256),
          publicQrCodeDataUrl: await generarQRDataURL(`${window.location.origin}/consulta/${orden.numero_orden}`, 256),
          empleadoRecibe: orden.empleado_recibe?.nombre_completo || 'Técnico'
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

  if (loading || !orden) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Cargando orden...</p>
      </div>
    );
  }

  return (
    <div id="print-page-root" className="min-h-screen bg-gray-50/50 flex flex-col">
      <div className="no-print">
        <Navbar title="Imprimir Ticket" />
      </div>

      <main className="flex-1 overflow-y-auto">
        <style jsx global>{`
          @media print {
            /* Desactivar animaciones */
            *, *::before, *::after {
              animation: none !important;
              transition: none !important;
              transition-duration: 0s !important;
              animation-duration: 0s !important;
            }

            /* Estrategia de visibilidad */
            body {
              visibility: hidden !important;
              background: white !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            #print-page-root, #print-page-root * {
              visibility: visible !important;
            }

            #print-page-root {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-container {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 15mm !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            @page {
              margin: 0;
              size: letter;
            }
          }
        `}</style>

        <div className="print-container bg-white p-6 max-w-2xl mx-auto shadow-sm border border-gray-100 my-4 sm:my-8 rounded-2xl">
          {/* Botones de acción (no se imprimen) */}
          <div className="no-print mb-8 flex gap-4 justify-center">
            <button
              onClick={() => window.print()}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold transition-all active:scale-95 shadow-lg shadow-primary-100"
            >
              <Printer className="w-5 h-5" />
              Imprimir Ticket
            </button>

            <button
              onClick={handleDescargarPDF}
              disabled={generandoPDF}
              className="bg-white border-2 border-gray-200 hover:border-primary-600 hover:text-primary-600 text-gray-700 px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all font-bold"
            >
              <Download className="w-5 h-5" />
              {generandoPDF ? 'Generando...' : 'Guardar PDF'}
            </button>

            <button
              onClick={() => window.close()}
              className="text-gray-400 hover:text-gray-600 px-4 py-2 text-sm font-medium"
            >
              Cerrar
            </button>
          </div>

          <div className="ticket-content">
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

              <div className="text-right max-w-[200px]">
                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ubicación</h3>
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                  {orden.sucursal?.direccion}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orden de Servicio</h2>
                <p className="text-2xl font-black text-gray-900 leading-none">#{orden.numero_orden}</p>
              </div>
              <div className="text-right">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Ingreso</h2>
                <p className="text-sm font-bold text-gray-800">{formatearFecha(orden.fecha_ingreso)}</p>
              </div>
            </div>

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

            <div className="mb-8 p-4 border-2 border-gray-100 rounded-2xl">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Problema Reportado</h3>
              <p className="text-sm text-gray-800 whitespace-pre-wrap font-medium leading-relaxed">{orden.problema_reportado}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-6 border-t border-gray-100 pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Resumen Económico</h3>
                  <div className="space-y-0.5">
                    <p className="text-sm text-gray-600 font-medium">Anticipo: <span className="text-gray-900 font-black">$0.00</span></p>
                    {orden.costo_estimado && (
                      <p className="text-sm text-gray-600 font-medium">Est. Total: <span className="text-gray-900 font-black">${parseFloat(orden.costo_estimado.toString()).toFixed(2)}</span></p>
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

            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-8">
                <div className="text-[8px] text-gray-500 space-y-1 leading-tight">
                  <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Términos y Condiciones</h3>
                  <p>• Los equipos no reclamados en 30 días se considerarán abandonados.</p>
                  <p>• La empresa no se responsabiliza por la integridad de los datos.</p>
                  <p>• Es indispensable presentar este ticket para cualquier trámite.</p>
                  <div className="mt-2 p-1.5 bg-gray-50 rounded border border-gray-200">
                    <span className="text-[7px] font-black text-gray-400 uppercase block mb-0.5">Consulta en línea:</span>
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

            <div className="mt-8 text-center no-print">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{orden.sucursal?.empresa.nombre}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
