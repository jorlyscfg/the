'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SessionWatcher() {
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Escuchar cambios en el estado de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`[SessionWatcher] Evento de Auth: ${event}`);

            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
                // Si el usuario cerró sesión o el refresco falló, ir al login
                router.push('/login');
                router.refresh();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, supabase]);

    return null; // Este componente no renderiza nada
}
