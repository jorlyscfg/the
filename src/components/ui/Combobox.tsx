import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface ComboboxProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    icon?: React.ReactNode;
    disabled?: boolean;
    required?: boolean;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    label,
    icon,
    disabled = false,
    required = false
}: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options based on search
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <div
                    className={`
            relative flex items-center w-full px-3 py-2.5 border rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white cursor-pointer
            ${open ? 'ring-2 ring-primary-500/20 border-primary-500' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'}
          `}
                    onClick={() => !disabled && setOpen(!open)}
                >
                    {icon && (
                        <span className="text-gray-400 mr-2.5 pointer-events-none">
                            {icon}
                        </span>
                    )}
                    <span className={`block truncate flex-1 ${!value ? 'text-gray-400 font-normal' : ''}`}>
                        {value || placeholder}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronsUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                    </span>
                </div>

                {open && (
                    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-2 sticky top-0 bg-white border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border-none rounded-lg focus:ring-0 text-gray-700"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        {filteredOptions.length === 0 ? (
                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700 text-xs italic text-center">
                                No hay resultados.
                                <button
                                    className="block w-full mt-2 text-primary-600 font-bold hover:underline"
                                    onClick={() => {
                                        onChange(search); // Allow custom value creation
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    Usar "{search}"
                                </button>
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => (
                                <div
                                    key={index}
                                    className={`
                    relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-primary-50 text-gray-800
                    ${option === value ? 'bg-primary-50 text-primary-700 font-bold' : ''}
                  `}
                                    onClick={() => {
                                        onChange(option);
                                        setOpen(false);
                                        setSearch('');
                                    }}
                                >
                                    <span className="block truncate">{option}</span>
                                    {option === value && (
                                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-600">
                                            <Check className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
