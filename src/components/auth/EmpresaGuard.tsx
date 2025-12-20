'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { verificarSiTieneEmpresa } from '@/app/onboarding/actions';

export default function EmpresaGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      // No verificar sesión en login, registro o rutas de callback de auth
      if (
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/auth/')
      ) {
        setVerificando(false);
        return;
      }

      // Primero verificar si está autenticado
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No autenticado, redirigir a login
        router.push('/login');
        return;
      }

      // Ya autenticado, verificar si tiene empresa
      const result = await verificarSiTieneEmpresa();

      if (result.success && !result.tieneEmpresa) {
        // Usuario autenticado pero sin empresa
        if (pathname !== '/onboarding') {
          // Si no está en onboarding, mandarlo para allá
          router.push('/onboarding');
        } else {
          // Si ya está en onboarding, dejarlo ver la página
          setVerificando(false);
        }
      } else if (pathname === '/onboarding' && result.tieneEmpresa) {
        // Si ya tiene empresa y está en onboarding, mandarlo al inicio
        router.push('/');
      } else {
        setVerificando(false);
      }
    };

    verificar();
  }, [pathname, router]);

  if (verificando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}
