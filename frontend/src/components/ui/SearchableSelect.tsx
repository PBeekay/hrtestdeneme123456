import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

interface SearchableSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    required?: boolean;
    creatable?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = 'Seçiniz...',
    required,
    creatable = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Click outside to close
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter options
    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (opt: string) => {
        onChange(opt);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
        // If creatable, update value immediately as user types (optional, or wait for blur/enter)
        // But usually searchable select keeps value separate.
        if (creatable) {
            onChange(e.target.value);
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div
                className="relative"
                onClick={() => {
                    if (!isOpen) {
                        setIsOpen(true);
                        // If value exists, set search term to it so user can edit or just see text
                        // But better UX: keep value display and search separate?
                        // For this simple implementation: Input IS the display.
                    }
                }}
            >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>

                <input
                    type="text"
                    className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 pl-10 pr-10 py-2 text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    placeholder={placeholder}
                    value={isOpen ? searchTerm : value || searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => {
                        setIsOpen(true);
                        // When focusing, if there is a value, stick it in search term to allow editing?
                        // Or keep empty to show all options?
                        // Let's set search term to current value if we want to filter by it, 
                        // or empty to show list. Empty is usually better for "Select", 
                        // but if "Creatable" text input, we want to allow editing.
                        if (value && creatable) setSearchTerm(value);
                    }}
                    required={required && !value} // Only required if value is empty
                />

                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    if (value && !isOpen) {
                        // Clear value
                        onChange('');
                        setSearchTerm('');
                    } else {
                        setIsOpen(!isOpen);
                    }
                }}>
                    {value && !isOpen ? (
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    ) : (
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 rounded-md shadow-lg max-h-60 overflow-y-auto border border-neutral-200 dark:border-neutral-700 animate-in fade-in zoom-in-95 duration-100">
                    {filteredOptions.length > 0 ? (
                        <ul className="py-1">
                            {filteredOptions.map((opt, idx) => (
                                <li
                                    key={idx}
                                    className="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer flex items-center justify-between"
                                    onClick={() => handleSelect(opt)}
                                >
                                    {opt}
                                    {value === opt && <span className="text-primary-600 font-bold">✓</span>}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                            {creatable ? (
                                <span className="text-primary-600">"{searchTerm}" <span className="opacity-75">olarak ayarlanacak</span></span>
                            ) : (
                                "Sonuç bulunamadı"
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
