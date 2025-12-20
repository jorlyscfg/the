'use client';

import { useEffect } from 'react';

/**
 * Componente para registrar el Service Worker de la PWA
 * Debe ser incluido en el layout principal
 *
 * DESACTIVADO EN DESARROLLO para evitar problemas de cache
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // Solo registrar Service Worker en producción
    if (process.env.NODE_ENV !== 'production') {
      console.log('[PWA] Service Worker desactivado en desarrollo');

      // Desregistrar cualquier service worker existente en desarrollo
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then(() => {
              console.log('[PWA] Service Worker desregistrado:', registration.scope);
            });
          }
        });
      }
      return;
    }

    if ('serviceWorker' in navigator) {
      // Registrar el service worker solo en producción
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado:', registration.scope);

          // Verificar actualizaciones cada hora
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Manejar actualizaciones del service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Hay una nueva versión disponible
                console.log('[PWA] Nueva versión disponible');

                // Opcional: Mostrar notificación al usuario
                if (confirm('Hay una nueva versión disponible. ¿Deseas actualizar?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error('[PWA] Error al registrar Service Worker:', error);
        });

      // Recargar cuando el nuevo service worker tome control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  return null; // Este componente no renderiza nada
}
