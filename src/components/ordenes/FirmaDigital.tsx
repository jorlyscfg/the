'use client';

import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { RotateCcw, Check, X } from 'lucide-react';

interface FirmaDigitalProps {
  onFirmaGuardada: (firmaDataUrl: string) => void;
  onCancelar?: () => void;
  firmaExistente?: string;
  titulo?: string;
  nombreCliente?: string;
}

export default function FirmaDigital({
  onFirmaGuardada,
  onCancelar,
  firmaExistente,
  titulo = 'Firma del Cliente',
  nombreCliente
}: FirmaDigitalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 200 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setCanvasSize({
          width: width,
          height: Math.min(200, width * 0.4) // Responsive height
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    if (firmaExistente && sigCanvas.current) {
      sigCanvas.current.fromDataURL(firmaExistente);
      setIsEmpty(false);
    }
  }, [firmaExistente]);

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const limpiarFirma = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  };

  const guardarFirma = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const firmaDataUrl = sigCanvas.current.toDataURL('image/png');
      onFirmaGuardada(firmaDataUrl);
    }
  };

  return (
    <div className="bg-white max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-1.5">{titulo}</h2>
        {nombreCliente && (
          <p className="text-[11px] font-medium text-gray-400 italic px-1">
            Cliente: <span className="text-primary-600 font-bold not-italic">{nombreCliente}</span>
          </p>
        )}
        <p className="text-[11px] font-medium text-gray-400 italic px-1 mt-1">
          Dibuje su firma en el recuadro usando el dedo o mouse
        </p>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="border border-gray-200 rounded-2xl bg-gray-50/50 mb-6 overflow-hidden shadow-inner"
      >
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width: canvasSize.width,
            height: canvasSize.height,
            className: 'signature-canvas bg-white/50 touch-none transition-all duration-300'
          }}
          backgroundColor="transparent"
          penColor="#1f2937"
          minWidth={1.5}
          maxWidth={3.5}
          onBegin={handleBegin}
          onEnd={handleEnd}
          throttle={0}
        />
      </div>

      {/* Información */}
      <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-[11px] font-medium text-gray-500 italic leading-relaxed">
          <span className="font-bold text-gray-600 not-italic uppercase tracking-tighter mr-1">Nota:</span> Al firmar, usted acepta los términos y
          condiciones del servicio, incluyendo el costo mínimo de revisión y las
          políticas de reciclaje.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
        <button
          type="button"
          onClick={limpiarFirma}
          disabled={isEmpty}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-50 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest transition-all h-11"
        >
          <RotateCcw className="w-4 h-4" />
          Limpiar
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-50 hover:text-gray-600 flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest transition-all h-11"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        )}

        <button
          type="button"
          onClick={guardarFirma}
          disabled={isEmpty}
          className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold uppercase text-[10px] tracking-widest transition-all h-11 shadow-md shadow-primary-500/20"
        >
          <Check className="w-4 h-4" />
          Confirmar Firma
        </button>
      </div>

      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <p className="text-gray-300 text-2xl font-bold uppercase tracking-[0.2em] opacity-30">
            Firme aquí
          </p>
        </div>
      )}

      <style jsx global>{`
        .signature-canvas {
          touch-action: none;
          cursor: crosshair;
        }
      `}</style>
    </div>
  );
}

/**
 * Componente compacto de vista de firma (solo lectura)
 */
interface VistaFirmaProps {
  firmaUrl: string;
  nombreCliente?: string;
  fecha?: string;
  className?: string;
}

export function VistaFirma({
  firmaUrl,
  nombreCliente,
  fecha,
  className = ''
}: VistaFirmaProps) {
  return (
    <div className={`border-2 border-gray-300 rounded-lg p-4 bg-gray-50 ${className}`}>
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700">Firma del Cliente</h3>
        {nombreCliente && (
          <p className="text-xs text-gray-600">{nombreCliente}</p>
        )}
        {fecha && (
          <p className="text-xs text-gray-500">{fecha}</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded p-2">
        <img
          src={firmaUrl}
          alt="Firma del cliente"
          className="max-w-full h-auto max-h-32"
        />
      </div>
    </div>
  );
}
