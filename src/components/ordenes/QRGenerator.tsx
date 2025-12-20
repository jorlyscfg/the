'use client';

import { useEffect, useRef } from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';

interface QRGeneratorProps {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
  includeMargin?: boolean;
  className?: string;
}

/**
 * Componente para generar códigos QR
 * @param value - Datos a codificar (URL, texto, etc.)
 * @param size - Tamaño del QR en píxeles (default: 256)
 * @param level - Nivel de corrección de errores (default: 'M')
 * @param includeMargin - Incluir margen blanco (default: true)
 */
export default function QRGenerator({
  value,
  size = 256,
  level = 'M',
  includeMargin = true,
  className = ''
}: QRGeneratorProps) {
  return (
    <div className={`inline-block ${className}`}>
      <QRCode
        value={value}
        size={size}
        level={level}
        includeMargin={includeMargin}
      />
    </div>
  );
}

/**
 * Hook para generar QR como Data URL
 */
export function useQRDataURL(value: string, size: number = 256): string | null {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      // El QR se renderiza automáticamente en el canvas
    }
  }, [value]);

  // Función helper para obtener el data URL
  const getDataURL = (): string | null => {
    if (canvasRef.current) {
      return canvasRef.current.toDataURL('image/png');
    }
    return null;
  };

  return getDataURL();
}

/**
 * Componente oculto para generar QR y obtener data URL
 */
interface QRDataURLGeneratorProps {
  value: string;
  size?: number;
  onGenerated: (dataUrl: string) => void;
}

export function QRDataURLGenerator({
  value,
  size = 256,
  onGenerated
}: QRDataURLGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      // Pequeño delay para asegurar que el canvas está renderizado
      setTimeout(() => {
        const canvas = document.querySelector<HTMLCanvasElement>(
          '.qr-hidden-canvas canvas'
        );
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          onGenerated(dataUrl);
        }
      }, 100);
    }
  }, [value, onGenerated]);

  return (
    <div className="qr-hidden-canvas" style={{ display: 'none' }}>
      <QRCode
        value={value}
        size={size}
        level="M"
        includeMargin={true}
      />
    </div>
  );
}

/**
 * Función helper para generar QR como Data URL de forma programática
 */
export async function generarQRDataURL(
  value: string,
  size: number = 256
): Promise<string> {
  return new Promise((resolve) => {
    // Crear un div temporal
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    document.body.appendChild(tempDiv);

    // Renderizar el QR
    const QRCode = require('qrcode.react').QRCodeCanvas;
    const canvas = document.createElement('canvas');
    tempDiv.appendChild(canvas);

    // Usar la librería qrcode directamente
    const qrcode = require('qrcode');
    qrcode.toDataURL(value, { width: size, margin: 2 }, (err: any, url: string) => {
      document.body.removeChild(tempDiv);
      if (err) {
        console.error('Error generando QR:', err);
        resolve('');
      } else {
        resolve(url);
      }
    });
  });
}

/**
 * Función para descargar QR como imagen
 */
export function descargarQR(dataUrl: string, nombreArchivo: string = 'qr-code'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${nombreArchivo}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
