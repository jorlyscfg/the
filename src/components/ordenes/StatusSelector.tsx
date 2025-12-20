'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2, Check } from 'lucide-react';

interface StatusOption {
    value: string;
    label: string;
    description?: string;
}

interface StatusSelectorProps {
    value: string;
    onChange: (newValue: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
    options: StatusOption[];
    getBadgeClass: (value: string) => string;
    variant?: 'badge' | 'form';
    icon?: React.ReactNode;
    label?: string;
}

export function StatusSelector({
    value,
    onChange,
    isLoading = false,
    disabled = false,
    options,
    getBadgeClass,
    variant = 'badge',
    icon,
    label
}: StatusSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (newValue: string) => {
        if (newValue !== value) {
            onChange(newValue);
        }
        setIsOpen(false);
    };

    const currentOption = options.find(opt => opt.value === value);

    return (
        <div className={`relative ${variant === 'form' ? 'w-full' : ''}`} ref={containerRef}>
            {variant === 'form' && label && (
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                    {label}
                </label>
            )}
            {/* Botón Disparador */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    flex items-center justify-between transition-all outline-none
                    ${variant === 'badge'
                        ? `gap-1 pl-2 pr-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-tight border border-transparent hover:border-current/20 active:scale-95 ${getBadgeClass(value)}`
                        : `w-full px-3 py-2.5 border rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:border-gray-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 ${icon ? 'pl-10' : ''} ${disabled ? 'bg-gray-50 border-gray-200' : 'border-gray-300'}`
                    }
                    ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
                `}
            >
                <div className="flex items-center gap-2">
                    {variant === 'form' && icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    {variant === 'form' && (
                        <div className={`w-2 h-2 rounded-full ${getBadgeClass(value).split(' ')[0]}`} />
                    )}
                    <span className={variant === 'badge' ? '' : 'truncate uppercase tracking-tight'}>
                        {currentOption?.label || value.replace('_', ' ')}
                    </span>
                </div>

                {isLoading ? (
                    <Loader2 className={`w-3 h-3 animate-spin ${variant === 'form' ? 'text-gray-400' : ''}`} />
                ) : (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${variant === 'form' ? 'text-gray-400' : ''}`} />
                )}
            </button>

            {/* Menú Desplegable / Submenú */}
            {isOpen && (
                <>
                    {/* Backdrop para móviles (opcional, pero ayuda a cerrar) */}
                    <div
                        className="fixed inset-0 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className={`absolute mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right ${variant === 'form' ? 'left-0 right-0' : 'right-0 w-48'}`}>
                        <div className="px-3 py-1 mb-1 border-b border-gray-50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cambiar Estado</span>
                        </div>

                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold transition-colors hover:bg-gray-50 ${isSelected ? 'text-primary-600' : 'text-gray-700'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getBadgeClass(option.value).split(' ')[0]}`} />
                                        <span className="uppercase tracking-tight">{option.label}</span>
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
