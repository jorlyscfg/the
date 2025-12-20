'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import BottomNavbar from '../layout/BottomNavbar';
import QRScannerModal from './QRScannerModal';

export default function FloatingQRButtonWrapper() {
  const pathname = usePathname();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // No mostrar en páginas de autenticación, onboarding o consulta pública
  if (pathname === '/login' || pathname === '/register' || pathname === '/onboarding' || pathname?.startsWith('/consulta')) {
    return null;
  }

  return (
    <>
      <BottomNavbar onScannerClick={() => setIsScannerOpen(true)} />
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
    </>
  );
}
