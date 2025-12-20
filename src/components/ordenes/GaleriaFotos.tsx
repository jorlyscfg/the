'use client';

import { useState } from 'react';
import { X, Download, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollLock } from '@/hooks/useScrollLock';

interface Foto {
  id?: string;
  url: string;
  tipo?: string;
  descripcion?: string;
}

interface GaleriaFotosProps {
  fotos: Foto[];
  onEliminar?: (index: number) => void;
  soloLectura?: boolean;
}

export default function GaleriaFotos({
  fotos,
  onEliminar,
  soloLectura = false
}: GaleriaFotosProps) {
  const [fotoSeleccionada, setFotoSeleccionada] = useState<number | null>(null);
  useScrollLock(fotoSeleccionada !== null);

  const abrirModal = (index: number) => {
    setFotoSeleccionada(index);
  };

  const cerrarModal = () => {
    setFotoSeleccionada(null);
  };

  const fotoAnterior = () => {
    if (fotoSeleccionada !== null && fotoSeleccionada > 0) {
      setFotoSeleccionada(fotoSeleccionada - 1);
    }
  };

  const fotoSiguiente = () => {
    if (fotoSeleccionada !== null && fotoSeleccionada < fotos.length - 1) {
      setFotoSeleccionada(fotoSeleccionada + 1);
    }
  };

  const descargarFoto = (url: string, nombre: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    link.click();
  };

  // Manejar teclas del teclado
  const handleKeyDown = (e: KeyboardEvent) => {
    if (fotoSeleccionada === null) return;

    if (e.key === 'Escape') cerrarModal();
    if (e.key === 'ArrowLeft') fotoAnterior();
    if (e.key === 'ArrowRight') fotoSiguiente();
  };

  // Agregar listener de teclado
  useState(() => {
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  });

  if (fotos.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-gray-500">No hay fotos disponibles</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {fotos.map((foto, index) => (
          <div
            key={foto.id || index}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group cursor-pointer"
            onClick={() => abrirModal(index)}
          >
            <img
              src={foto.url}
              alt={foto.descripcion || `Foto ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Número de foto */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>

            {/* Tipo de foto */}
            {foto.tipo && (
              <div className="absolute bottom-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                {foto.tipo}
              </div>
            )}

            {/* Botón eliminar */}
            {!soloLectura && onEliminar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEliminar(index);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal de vista ampliada */}
      {fotoSeleccionada !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={cerrarModal}
        >
          {/* Backdrop con desenfoque */}
          <div className="fixed inset-0 bg-gray-500/20 backdrop-blur-md transition-opacity duration-300" />

          {/* Contenedor de la imagen */}
          <div
            className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen */}
            <img
              src={fotos[fotoSeleccionada].url}
              alt={fotos[fotoSeleccionada].descripcion || `Foto ${fotoSeleccionada + 1}`}
              className="max-w-full max-h-full object-contain"
            />

            {/* Botón cerrar */}
            <button
              onClick={cerrarModal}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Botón descargar */}
            <button
              onClick={() => descargarFoto(
                fotos[fotoSeleccionada].url,
                `foto-${fotoSeleccionada + 1}.jpg`
              )}
              className="absolute top-4 right-16 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all"
            >
              <Download className="w-6 h-6" />
            </button>

            {/* Navegación anterior */}
            {fotoSeleccionada > 0 && (
              <button
                onClick={fotoAnterior}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* Navegación siguiente */}
            {fotoSeleccionada < fotos.length - 1 && (
              <button
                onClick={fotoSiguiente}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-3 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Contador */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full text-sm">
              {fotoSeleccionada + 1} / {fotos.length}
            </div>

            {/* Descripción */}
            {fotos[fotoSeleccionada].descripcion && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-lg text-sm max-w-md text-center">
                {fotos[fotoSeleccionada].descripcion}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
