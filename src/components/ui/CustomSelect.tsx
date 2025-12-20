'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
    icon?: React.ReactNode;
    color?: string; // e.g. 'bg-green-100 text-green-700'
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    label?: string;
    icon?: React.ReactNode;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    required?: boolean;
}

export function CustomSelect({
    value,
    onChange,
    options,
    label,
    icon,
    placeholder = 'Seleccionar...',
    disabled = false,
    className,
    required = false
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
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
        onChange(newValue);
        setIsOpen(false);
    };

    const currentOption = options.find(opt => opt.value === value);

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                    {label} {required && '*'}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    "w-full px-3 py-3 border rounded-xl shadow-sm text-sm font-semibold transition-all outline-none flex items-center justify-between",
                    "bg-white hover:border-gray-400 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500",
                    isOpen && "border-primary-500 ring-4 ring-primary-500/10",
                    icon ? "pl-10" : "",
                    disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200" : "text-gray-700 cursor-pointer border-gray-200"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {icon}
                        </div>
                    )}
                    {currentOption?.color && (
                        <div className={cn("w-2 h-2 rounded-full shrink-0", currentOption.color.split(' ')[0])} />
                    )}
                    <span className={cn("truncate", !currentOption && "text-gray-400 font-normal")}>
                        {currentOption ? currentOption.label : placeholder}
                    </span>
                </div>

                <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-gray-400 font-medium text-center">
                            No hay opciones
                        </div>
                    ) : (
                        options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-colors hover:bg-gray-50",
                                        isSelected ? "text-primary-600 bg-primary-50/50" : "text-gray-700"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 truncate">
                                        {option.color && (
                                            <div className={cn("w-2 h-2 rounded-full shrink-0", option.color.split(' ')[0])} />
                                        )}
                                        {option.icon && (
                                            <span className="text-gray-400">{option.icon}</span>
                                        )}
                                        <span className={cn("uppercase tracking-tight truncate", isSelected && "font-black")}>
                                            {option.label}
                                        </span>
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
