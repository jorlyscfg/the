'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, AlertCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { BrowserMultiFormatReader } from '@zxing/library';

export default function ScannerPage() {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const router = useRouter();

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setScanning(true);

      // Verificar si mediaDevices está disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError(
          '⚠️ El acceso a la cámara requiere HTTPS. Por favor, accede a la aplicación usando una conexión segura (https://) o usa localhost para pruebas.'
        );
        setScanning(false);
        return;
      }

      // Inicializar el lector de QR
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Obtener dispositivos de video
      const videoInputDevices = await codeReader.listVideoInputDevices();

      if (videoInputDevices.length === 0) {
        setError('No se encontraron cámaras disponibles');
        setScanning(false);
        return;
      }

      // Preferir cámara trasera en móviles
      const backCamera = videoInputDevices.find(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('trasera') ||
        device.label.toLowerCase().includes('rear')
      );

      const selectedDeviceId = backCamera?.deviceId || videoInputDevices[0].deviceId;

      // Iniciar detección continua de QR
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        (result, error) => {
          if (result) {
            // QR detectado
            const qrText = result.getText();
            console.log('QR detectado:', qrText);

            setDetected(true);

            // Verificar si es una URL de orden
            if (qrText.includes('/ordenes/')) {
              // Extraer ID de la orden
              const match = qrText.match(/\/ordenes\/([a-f0-9-]+)/);
              if (match) {
                const ordenId = match[1];
                stopCamera();
                router.push(`/ordenes/${ordenId}`);
              }
            } else {
              // Si el QR contiene directamente el UUID
              const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
              if (uuidRegex.test(qrText)) {
                stopCamera();
                router.push(`/ordenes/${qrText}`);
              } else {
                setError(`Código QR no válido: ${qrText}`);
                setTimeout(() => setError(null), 3000);
              }
            }
          }

          // Los errores de "No QR found" son normales durante el escaneo
          if (error && !error.message.includes('No MultiFormat Readers')) {
            // console.log('Error de lectura:', error);
          }
        }
      );

    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setError(
        'No se pudo acceder a la cámara. Por favor, verifica los permisos en la configuración de tu navegador.'
      );
      setScanning(false);
    }
  };

  const stopCamera = () => {
    // Detener el lector de códigos QR
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    // Detener el stream de video
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setProcessingImage(true);

      // Crear URL temporal de la imagen
      const imageUrl = URL.createObjectURL(file);

      // Crear elemento de imagen para cargar el archivo
      const img = new Image();
      img.src = imageUrl;

      img.onload = async () => {
        try {
          // Usar el lector de códigos para decodificar desde la imagen
          const codeReader = new BrowserMultiFormatReader();
          const result = await codeReader.decodeFromImageUrl(imageUrl);

          // Limpiar URL temporal
          URL.revokeObjectURL(imageUrl);
          setProcessingImage(false);

          if (result) {
            const qrText = result.getText();
            console.log('QR detectado desde imagen:', qrText);

            setDetected(true);

            // Verificar si es una URL de orden
            if (qrText.includes('/ordenes/')) {
              const match = qrText.match(/\/ordenes\/([a-f0-9-]+)/);
              if (match) {
                const ordenId = match[1];
                router.push(`/ordenes/${ordenId}`);
              }
            } else {
              // Si el QR contiene directamente el UUID
              const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
              if (uuidRegex.test(qrText)) {
                router.push(`/ordenes/${qrText}`);
              } else {
                setError(`Código QR no válido: ${qrText}`);
              }
            }
          }
        } catch (decodeError) {
          console.error('Error al decodificar imagen:', decodeError);
          setProcessingImage(false);
          setError('No se encontró ningún código QR en la imagen. Asegúrate de que la imagen contenga un código QR visible.');
          URL.revokeObjectURL(imageUrl);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        setProcessingImage(false);
        setError('Error al cargar la imagen. Por favor, intenta con otra imagen.');
      };

    } catch (err) {
      console.error('Error al procesar imagen:', err);
      setProcessingImage(false);
      setError('Error al procesar la imagen. Por favor, intenta con otra imagen.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Escanear QR" subtitle="Escanea el código QR de una orden" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Cómo usar el escáner
              </h3>
              <p className="text-sm text-blue-800">
                Coloca el código QR de la orden frente a la cámara. Cuando se detecte,
                serás redirigido automáticamente a los detalles de la orden.
              </p>
            </div>
          </div>
        </div>

        {/* Procesando imagen */}
        {processingImage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">Procesando imagen</h3>
                <p className="text-sm text-blue-800">Analizando código QR...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Video Preview */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="relative aspect-video bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Overlay de guía */}
            {scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`w-64 h-64 border-2 rounded-lg transition-colors ${detected ? 'border-green-500' : 'border-primary-500'}`}>
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg ${detected ? 'border-green-500' : 'border-primary-500'}`}></div>
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg ${detected ? 'border-green-500' : 'border-primary-500'}`}></div>
                  <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg ${detected ? 'border-green-500' : 'border-primary-500'}`}></div>
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg ${detected ? 'border-green-500' : 'border-primary-500'}`}></div>

                  {/* Mensaje de detección */}
                  {detected && (
                    <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap">
                      ✓ QR Detectado
                    </div>
                  )}
                </div>
              </div>
            )}

            {!scanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                <div className="text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-2" />
                  <p>Iniciando cámara...</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Mantén el código QR dentro del marco
            </p>
          </div>
        </div>

        {/* Opción alternativa: subir imagen */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            ¿No puedes escanear?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Sube una imagen del código QR desde tu galería
          </p>
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={processingImage}
            />
            <span className={`block w-full px-4 py-2 text-center rounded-lg transition-colors border ${
              processingImage
                ? 'bg-blue-100 text-blue-700 border-blue-300 cursor-wait'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 cursor-pointer'
            }`}>
              {processingImage ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando imagen...
                </span>
              ) : (
                'Seleccionar imagen'
              )}
            </span>
          </label>
        </div>

        {/* Nota técnica */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Consejo:</strong> Para mejores resultados, asegúrate de tener buena iluminación
            y mantén el código QR estable dentro del marco. El escáner detectará automáticamente
            el código y te redirigirá a la orden.
          </p>
        </div>

        {/* Botón de cancelar */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      </main>
    </div>
  );
}
