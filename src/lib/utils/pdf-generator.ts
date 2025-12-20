import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DatosEmpresa {
  nombre: string;
  telefono: string;
  whatsapp?: string;
  direccion?: string;
  email?: string;
  sitioWeb?: string;
  logoUrl?: string;
}

interface DatosCliente {
  nombre: string;
  telefono: string;
  email?: string;
}

interface DatosEquipo {
  tipo: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  detalles: string;
  incluyeCargador: boolean;
  accesorios?: string;
}

interface DatosOrden {
  numeroOrden: string;
  fecha: Date;
  anticipo: number;
  costoEstimado?: number;
  estado: string;
  firmaUrl?: string;
  qrCodeDataUrl?: string; // Mantenemos por compatibilidad
  internalQrCodeDataUrl?: string;
  publicQrCodeDataUrl?: string;
  empleadoRecibe: string;
}

interface TerminosCondiciones {
  costoMinimo: number;
  diasLimite: number;
  mensaje?: string;
}

export interface DatosTicket {
  empresa: DatosEmpresa;
  cliente: DatosCliente;
  equipo: DatosEquipo;
  orden: DatosOrden;
  terminos: TerminosCondiciones;
}

/**
 * Genera un PDF del ticket de orden de servicio mirroring the React layout
 */
export function generarTicketPDF(datos: DatosTicket): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 20;

  // Helper para agregar línea
  const addLine = (y?: number) => {
    doc.setDrawColor(220); // Gris muy claro
    doc.line(margin, y || yPos, pageWidth - margin, y || yPos);
    if (!y) yPos += 5;
  };

  // Helper para rectángulos con fondo (estilo cajas de la UI)
  const addBox = (y: number, height: number) => {
    doc.setFillColor(250, 250, 250); // Gray-50
    doc.roundedRect(margin, y, pageWidth - (margin * 2), height, 3, 3, 'F');
  };

  // === ENCABEZADO (HORIZONTAL) ===
  // Logo (Izquierda)
  if (datos.empresa.logoUrl) {
    try {
      doc.addImage(datos.empresa.logoUrl, 'PNG', margin, yPos - 5, 20, 20, undefined, 'FAST');
    } catch (e) {
      console.error('Error al cargar logo en PDF:', e);
    }
  }

  // Información Empresa (Centro-Izquierda)
  const infoX = datos.empresa.logoUrl ? margin + 25 : margin;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text(datos.empresa.nombre.toUpperCase(), infoX, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99); // gray-600
  doc.text('SUCURSAL MATRIZ', infoX, yPos); // Placeholder or dynamic if exists

  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // gray-500
  const contactText = [
    datos.empresa.telefono ? `Tel: ${datos.empresa.telefono}` : '',
    datos.empresa.whatsapp ? `WhatsApp: ${datos.empresa.whatsapp}` : '',
    datos.empresa.email || '',
    datos.empresa.sitioWeb || ''
  ].filter(Boolean).join(' | ');
  doc.text(contactText, infoX, yPos);

  // Ubicación (Derecha)
  if (datos.empresa.direccion) {
    const addressLines = doc.splitTextToSize(datos.empresa.direccion, 50);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(156, 163, 175); // gray-400
    doc.text('UBICACIÓN', pageWidth - margin, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(addressLines, pageWidth - margin, 21.5, { align: 'right' });
  }

  yPos = 35;
  addLine();
  yPos += 5;

  // === NÚMERO DE ORDEN Y FECHA ===
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('ORDEN DE SERVICIO', margin, yPos);
  doc.text('FECHA DE INGRESO', pageWidth - margin, yPos, { align: 'right' });

  yPos += 6;
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39); // gray-900
  doc.text(`#${datos.orden.numeroOrden}`, margin, yPos);

  doc.setFontSize(12);
  doc.text(format(datos.orden.fecha, "d 'de' MMMM, yyyy hh:mm aa", { locale: es }).toUpperCase(), pageWidth - margin, yPos, { align: 'right' });

  yPos += 12;

  // === DATOS CLIENTE Y EQUIPO ( cajas lado a lado ) ===
  const boxHeight = 25;
  addBox(yPos, boxHeight);

  // Cliente
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('DATOS DEL CLIENTE', margin + 5, yPos + 6);

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(datos.cliente.nombre, margin + 5, yPos + 12);
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(datos.cliente.telefono, margin + 5, yPos + 17);
  if (datos.cliente.email) {
    doc.setFontSize(8);
    doc.text(datos.cliente.email, margin + 5, yPos + 21);
  }

  // Equipo
  const equipoX = pageWidth / 2 + 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('DATOS DEL EQUIPO', equipoX, yPos + 6);

  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(`${datos.equipo.tipo} ${datos.equipo.marca ? '- ' + datos.equipo.marca : ''} ${datos.equipo.modelo || ''}`, equipoX, yPos + 12);

  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  if (datos.equipo.numeroSerie) doc.text(`S/N: ${datos.equipo.numeroSerie}`, equipoX, yPos + 17);
  if (datos.equipo.accesorios) doc.text(`Acc: ${datos.equipo.accesorios}`, equipoX, yPos + 21);

  yPos += boxHeight + 10;

  // === PROBLEMA REPORTADO ===
  doc.setLineWidth(0.5);
  doc.setDrawColor(243, 244, 246);
  doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 25, 3, 3, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('PROBLEMA REPORTADO', margin + 5, yPos + 6);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  const problemLines = doc.splitTextToSize(datos.equipo.detalles, pageWidth - (margin * 2) - 10);
  doc.text(problemLines, margin + 5, yPos + 12);

  yPos += 35;
  addLine();
  yPos += 8;

  // === RESUMEN Y QRS ===
  const splitX = pageWidth / 2;

  // Resumen Económico
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('RESUMEN ECONÓMICO', margin, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text('Anticipo:', margin, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`$${datos.orden.anticipo.toFixed(2)}`, margin + 30, yPos);

  if (datos.orden.costoEstimado) {
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text('Est. Total:', margin, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(`$${datos.orden.costoEstimado.toFixed(2)}`, margin + 30, yPos);
  }

  yPos += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('ATENDIDO POR', margin, yPos);
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(datos.orden.empleadoRecibe.toUpperCase(), margin, yPos);

  // QRs (A la derecha del resumen)
  let qrY = yPos - 25;
  if (datos.orden.internalQrCodeDataUrl || datos.orden.qrCodeDataUrl) {
    try {
      doc.addImage(datos.orden.internalQrCodeDataUrl || datos.orden.qrCodeDataUrl!, 'PNG', pageWidth - 70, qrY, 20, 20);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(156, 163, 175);
      doc.text('INTERNO', pageWidth - 60, qrY + 23, { align: 'center' });
    } catch (e) { }
  }

  if (datos.orden.publicQrCodeDataUrl) {
    try {
      doc.addImage(datos.orden.publicQrCodeDataUrl, 'PNG', pageWidth - 30, qrY, 20, 20);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(156, 163, 175);
      doc.text('CONSULTA', pageWidth - 20, qrY + 23, { align: 'center' });
    } catch (e) { }
  }

  yPos += 15;
  addLine();
  yPos += 8;

  // === TÉRMINOS Y FIRMA (COMPARTE FILA) ===
  // Términos (Izquierda)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(156, 163, 175);
  doc.text('TÉRMINOS Y CONDICIONES', margin, yPos);

  yPos += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  const terminos = [
    '• Los equipos no reclamados en 30 días se considerarán abandonados.',
    '• La empresa no se responsabiliza por la integridad de los datos.',
    '• Es indispensable presentar este ticket para cualquier trámite.'
  ];
  terminos.forEach(t => {
    doc.text(t, margin, yPos);
    yPos += 3.5;
  });

  // Firma (Derecha)
  const firmaY = yPos - 15;
  const firmaX = pageWidth - margin - 50;

  if (datos.orden.firmaUrl) {
    try {
      doc.addImage(datos.orden.firmaUrl, 'PNG', firmaX + 5, firmaY - 10, 40, 15);
    } catch (e) { }
  }

  doc.setDrawColor(156, 163, 175);
  doc.line(firmaX, firmaY + 6, pageWidth - margin, firmaY + 6);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('FIRMA DEL CLIENTE', firmaX + 25, firmaY + 10, { align: 'center' });

  return doc;
}

/**
 * Descarga el PDF generado
 */
export function descargarPDF(pdf: jsPDF, nombreArchivo: string): void {
  pdf.save(`${nombreArchivo}.pdf`);
}

/**
 * Abre el PDF en una nueva ventana
 */
export function abrirPDFenNuevaVentana(pdf: jsPDF): void {
  const pdfBlob = pdf.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
}

/**
 * Convierte el PDF a base64
 */
export function pdfToBase64(pdf: jsPDF): string {
  return pdf.output('datauristring');
}
