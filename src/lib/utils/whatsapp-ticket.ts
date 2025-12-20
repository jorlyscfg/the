import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRCode from 'qrcode';

interface TicketData {
    empresa: {
        nombre: string;
        logoUrl?: string;
        direccion?: string;
        telefono?: string;
        whatsapp?: string;
    };
    orden: {
        id: string;
        numeroOrden: string;
        fecha: Date;
    };
    cliente: {
        nombre: string;
    };
    equipo: {
        tipo: string;
        marca?: string;
        modelo?: string;
        serie?: string;
    };
}

/**
 * Genera una imagen del ticket reducido para compartir por WhatsApp
 */
export async function generarTicketImagen(datos: TicketData): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');

    // Configuración del lienzo (formato vertical para móvil)
    const width = 600;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    // Fondo blanco con bordes redondeados y sombra
    ctx.fillStyle = '#f8fafc'; // background color
    ctx.fillRect(0, 0, width, height);

    // Contenedor principal (tarjeta blanca)
    const margin = 30;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, margin, margin, width - margin * 2, height - margin * 2, 40);
    ctx.fill();

    // Sombra suave (simulada)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    let y = margin + 50;

    // --- ENCABEZADO ---
    // Logo (si existe)
    if (datos.empresa.logoUrl) {
        try {
            const logo = await loadImage(datos.empresa.logoUrl);
            const logoHeight = 70;
            const logoWidth = (logo.width * logoHeight) / logo.height;
            ctx.drawImage(logo, (width - logoWidth) / 2, y, logoWidth, logoHeight);
            y += logoHeight + 15;
        } catch (e) {
            console.error('Error cargando logo para imagen:', e);
        }
    }

    // Nombre Empresa
    ctx.fillStyle = '#0f172a';
    ctx.font = 'black 28px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(datos.empresa.nombre.toUpperCase(), width / 2, y);
    y += 30;

    // Sucursal
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 18px Inter, system-ui, sans-serif';
    ctx.fillText('Servicio Técnico Especializado', width / 2, y);
    y += 30;

    // Dirección y Teléfono
    ctx.fillStyle = '#64748b';
    ctx.font = 'medium 14px Inter, system-ui, sans-serif';
    if (datos.empresa.direccion) {
        const lines = wrapText(ctx, datos.empresa.direccion, width - margin * 4);
        lines.forEach(line => {
            ctx.fillText(line, width / 2, y);
            y += 20;
        });
    }
    const contacto = [datos.empresa.telefono, datos.empresa.whatsapp].filter(Boolean).join(' | ');
    if (contacto) {
        ctx.fillText(contacto, width / 2, y);
        y += 30;
    }

    // Línea divisoria
    ctx.strokeStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(margin + 40, y);
    ctx.lineTo(width - margin - 40, y);
    ctx.stroke();
    y += 40;

    // --- DATOS DE LA ORDEN ---
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'black 12px Inter, system-ui, sans-serif';
    ctx.fillText('ORDEN DE SERVICIO', width / 2, y);
    y += 40;

    ctx.fillStyle = '#1e293b';
    ctx.font = 'black 54px Inter, system-ui, sans-serif';
    ctx.fillText(`#${datos.orden.numeroOrden}`, width / 2, y);
    y += 40;

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText(format(datos.orden.fecha, "d 'de' MMMM, yyyy hh:mm aa", { locale: es }).toUpperCase(), width / 2, y);
    y += 45;

    // --- CLIENTE Y EQUIPO ---
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, margin + 30, y, width - (margin + 30) * 2, 160, 24);
    ctx.fill();

    let detailY = y + 35;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'black 11px Inter, system-ui, sans-serif';
    ctx.fillText('CLIENTE', margin + 60, detailY);
    ctx.fillText('EQUIPO', width / 2, detailY);

    detailY += 25;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    ctx.fillText(datos.cliente.nombre, margin + 60, detailY);
    ctx.fillText(datos.equipo.tipo, width / 2, detailY);

    detailY += 35;
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'black 11px Inter, system-ui, sans-serif';
    ctx.fillText('MARCA/MODELO', margin + 60, detailY);
    ctx.fillText('NÚMERO DE SERIE', width / 2, detailY);

    detailY += 25;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px Inter, system-ui, sans-serif';
    const marcaModelo = [datos.equipo.marca, datos.equipo.modelo].filter(Boolean).join(' ');
    ctx.fillText(marcaModelo || 'N/A', margin + 60, detailY);
    ctx.fillText(datos.equipo.serie || 'N/A', width / 2, detailY);

    y += 200;

    // --- QR CODE ---
    try {
        const qrSize = 160;
        const qrDataUrl = await QRCode.toDataURL(datos.orden.id, {
            margin: 1,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        });
        const qrImage = await loadImage(qrDataUrl);
        ctx.drawImage(qrImage, (width - qrSize) / 2, y, qrSize, qrSize);
        y += qrSize + 20;
    } catch (e) {
        console.error('Error generando QR para imagen:', e);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'black 11px Inter, system-ui, sans-serif';
    ctx.fillText('ESCANEADO INTERNO PARA TÉCNICOS', width / 2, y);

    return canvas.toDataURL('image/png');
}

// Helpers
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}
