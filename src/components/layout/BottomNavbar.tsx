'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, ClipboardList, Users, BarChart3, QrCode } from 'lucide-react';

interface BottomNavbarProps {
  onScannerClick: () => void;
}

export default function BottomNavbar({ onScannerClick }: BottomNavbarProps) {
  const pathname = usePathname();

  // No mostrar en login ni en consulta pública
  if (pathname === '/login' || pathname?.startsWith('/consulta')) {
    return null;
  }

  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/ordenes', icon: ClipboardList, label: 'Órdenes' },
    { href: '/clientes', icon: Users, label: 'Clientes' },
    { href: '/reportes', icon: BarChart3, label: 'Reportes' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {/* Primera mitad de items */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
                }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Botón central de Scanner QR */}
        <button
          onClick={onScannerClick}
          className="flex flex-col items-center justify-center flex-1 h-full relative"
          aria-label="Escanear QR"
        >
          <div className="absolute -top-6 bg-primary-600 rounded-full p-4 shadow-lg hover:bg-primary-700 transition-colors">
            <QrCode className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs mt-8 font-medium text-primary-600">Escanear</span>
        </button>

        {/* Segunda mitad de items */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
                }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Padding para safe area en dispositivos con notch */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </nav>
  );
}
