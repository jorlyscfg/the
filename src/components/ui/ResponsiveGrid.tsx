'use client';

import { ReactNode } from 'react';

interface ResponsiveGridProps {
    children: ReactNode;
    className?: string;
}

/**
 * Un componente de grid responsivo que adapta el número de columnas 
 * según el tamaño de la pantalla. Ideal para mostrar cards.
 */
export function ResponsiveGrid({ children, className = '' }: ResponsiveGridProps) {
    return (
        <div className={`grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 sm:gap-6 ${className}`}>
            {children}
        </div>
    );
}
