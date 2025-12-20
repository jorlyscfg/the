'use client';

import { useState } from 'react';
import { QrCode, X } from 'lucide-react';
import QRScannerModal from './QRScannerModal';

export default function FloatingQRButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 group"
        aria-label="Escanear QR"
        title="Escanear código QR"
      >
        <QrCode className="w-6 h-6" />

        {/* Tooltip */}
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Escanear QR
        </span>
      </button>

      {/* Modal del scanner */}
      <QRScannerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
