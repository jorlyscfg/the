'use client';

import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Modal } from './Modal';
import { Button } from './Button';
import { RefreshCw, Camera } from 'lucide-react';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (result: string) => void;
}

export default function BarcodeScannerModal({
    isOpen,
    onClose,
    onScan,
}: BarcodeScannerModalProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);

    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

    // Initialize Reader
    useEffect(() => {
        if (!isOpen) {
            if (codeReader.current) {
                codeReader.current.reset(); // Stop camera when closed
            }
            return;
        }

        setLoading(true);
        setError(null);
        codeReader.current = new BrowserMultiFormatReader();

        // 1. List devices to enable switching
        codeReader.current.listVideoInputDevices()
            .then((devices) => {
                setVideoInputDevices(devices);
                // We let the reader pick the default (undefined) initially, or logic below could pick back camera
                if (devices.length > 0) {
                    const backCamera = devices.find(device =>
                        device.label.toLowerCase().includes('back') ||
                        device.label.toLowerCase().includes('trasera') ||
                        device.label.toLowerCase().includes('environment')
                    );
                    if (backCamera) {
                        setSelectedDeviceId(backCamera.deviceId);
                    }
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error listing devices', err);
                // Continue anyway, maybe default works
                setLoading(false);
            });

        return () => {
            // Cleanup on unmount or close
            if (codeReader.current) {
                codeReader.current.reset();
            }
        };
    }, [isOpen]);

    // Start Decoding
    useEffect(() => {
        if (!isOpen || !videoRef.current || !codeReader.current) return;

        // Use selectedDeviceId if available, otherwise undefined lets zxing pick default
        const deviceIdToUse = selectedDeviceId;

        console.log('Starting decode with device:', deviceIdToUse || 'default');

        codeReader.current.decodeFromVideoDevice(
            deviceIdToUse || null, // Fix: Ensure it's string or null, not undefined
            videoRef.current,
            (result, err) => {
                if (result) {
                    console.log('Barcode detected:', result.getText());

                    // Beep
                    try {
                        const audio = new Audio('/sounds/beep.mp3');
                        audio.play().catch(e => console.log('Audio play failed', e));
                    } catch (e) { }

                    onScan(result.getText());
                    onClose();
                }
            }
        ).catch(err => {
            console.error('Decode error:', err);
            setError('No se pudo acceder a la cámara. Verifique permisos.');
        });

    }, [isOpen, selectedDeviceId, onScan, onClose]);

    const switchCamera = () => {
        if (videoInputDevices.length < 2) return;

        const currentIdx = videoInputDevices.findIndex(d => d.deviceId === selectedDeviceId);
        // If current not found (e.g. using default undefined), start at 0
        const nextIdx = currentIdx === -1 ? 1 : (currentIdx + 1) % videoInputDevices.length;

        setSelectedDeviceId(videoInputDevices[nextIdx].deviceId);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Escanear Código de Barras">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    {/* Camera View */}
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        muted
                        playsInline // Critical for iOS
                        autoPlay
                    />

                    {/* Overlays */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 z-30 text-center">
                            <p className="text-red-400 font-bold text-sm">{error}</p>
                        </div>
                    )}

                    {/* Scanner Frame */}
                    {!loading && !error && (
                        <div className="absolute inset-0 z-10 border-2 border-white/30 flex items-center justify-center pointer-events-none">
                            <div className="w-64 h-32 border-2 border-primary-500 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary-500 -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary-500 -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary-500 -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary-500 -mb-1 -mr-1"></div>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-xs text-center text-gray-500 italic">
                    Coloque el código de barras dentro del recuadro.
                </p>

                <div className="flex gap-3 w-full justify-center">
                    {videoInputDevices.length > 1 && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={switchCamera}
                            className="flex gap-2 items-center"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Cambiar Cámara
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                    >
                        Cancelar
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
