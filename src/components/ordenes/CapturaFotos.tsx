'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { Loading } from '../ui/Loading';
import FotoModal from './FotoModal';

interface CapturaFotosProps {
  fotos: File[];
  onFotosChange: (fotos: File[]) => void;
  maxFotos?: number;
}

export default function CapturaFotos({
  fotos,
  onFotosChange,
  maxFotos = 10
}: CapturaFotosProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [comprimiendo, setComprimiendo] = useState(false);
  const [fotoSeleccionadaIndex, setFotoSeleccionadaIndex] = useState<number | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const comprimirImagen = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Máximo 1MB
      maxWidthOrHeight: 1920, // Máximo 1920px
      useWebWorker: true,
      fileType: 'image/jpeg' as const,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir imagen:', error);
      return file; // Si falla, devolver el archivo original
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Validar que no se exceda el máximo
    if (fotos.length + files.length > maxFotos) {
      alert(`Solo puedes agregar hasta ${maxFotos} fotos`);
      return;
    }

    // Validar tipo de archivo
    const archivosValidos = files.filter(file =>
      file.type.startsWith('image/')
    );

    if (archivosValidos.length !== files.length) {
      alert('Solo se permiten archivos de imagen');
    }

    if (archivosValidos.length === 0) return;

    setComprimiendo(true);

    try {
      // Comprimir todas las imágenes
      const archivosComprimidos = await Promise.all(
        archivosValidos.map(file => comprimirImagen(file))
      );

      // Crear previews
      const nuevasPreviews = await Promise.all(
        archivosComprimidos.map(file => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      setPreviews([...previews, ...nuevasPreviews]);
      onFotosChange([...fotos, ...archivosComprimidos]);
    } catch (error) {
      console.error('Error al procesar imágenes:', error);
      alert('Error al procesar las imágenes');
    } finally {
      setComprimiendo(false);
      // Limpiar inputs
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const eliminarFoto = (index: number) => {
    const nuevasFotos = fotos.filter((_, i) => i !== index);
    const nuevasPreviews = previews.filter((_, i) => i !== index);

    setPreviews(nuevasPreviews);
    onFotosChange(nuevasFotos);
    setFotoSeleccionadaIndex(null); // Cerrar modal si estaba abierto
  };

  return (
    <div className="space-y-4">
      {/* Inputs ocultos separados */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Fuerza la cámara trasera
        onChange={handleFileSelect}
        className="hidden"
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple // Permite selección múltiple en galería
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={comprimiendo || fotos.length >= maxFotos}
          className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-sm active:scale-95 transition-all"
        >
          <Camera className="w-5 h-5" />
          {comprimiendo ? 'Procesando...' : 'Tomar Foto'}
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={comprimiendo || fotos.length >= maxFotos}
          className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-sm active:scale-95 transition-all"
        >
          <Upload className="w-5 h-5" />
          {comprimiendo ? 'Procesando...' : 'Subir Imagen'}
        </button>
      </div>

      {/* Contador de fotos */}
      <div className="text-sm text-gray-600 text-center">
        {fotos.length} de {maxFotos} fotos
        {fotos.length > 0 && (
          <span className="ml-2 text-gray-500">
            (Total: {(fotos.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB)
          </span>
        )}
      </div>

      {/* Grid de previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 shadow-sm group cursor-pointer"
              onClick={() => setFotoSeleccionadaIndex(index)}
            >
              <img
                src={preview}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />

              {/* Overlay hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                {/* Icono de lupa o ver */}
              </div>

              {/* Botón rápido de eliminar (mini) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  eliminarFoto(index);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Número de foto */}
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {fotos.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center bg-gray-50/50">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900">Sin fotografías</h3>
          <p className="text-xs text-gray-500 mt-1">
            Toma fotos del equipo o sube imágenes para documentar el estado actual.
          </p>
        </div>
      )}

      {/* Indicador de compresión */}
      {comprimiendo && (
        <Loading
          mode="inline"
          message="Optimizando imágenes"
          subMessage="Comprimiendo fotos para un mejor rendimiento"
        />
      )}

      {/* Modal de Visualización Completa */}
      <FotoModal
        isOpen={fotoSeleccionadaIndex !== null}
        onClose={() => setFotoSeleccionadaIndex(null)}
        fotoUrl={fotoSeleccionadaIndex !== null ? previews[fotoSeleccionadaIndex] : ''}
        onDelete={() => {
          if (fotoSeleccionadaIndex !== null) {
            eliminarFoto(fotoSeleccionadaIndex);
          }
        }}
      />
    </div>
  );
}
