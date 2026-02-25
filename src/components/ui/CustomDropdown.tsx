'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type DropdownOption = {
  value: string;
  label: string;
};

type CustomDropdownProps = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuClassName?: string;
};

export default function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select',
  disabled = false,
  className = '',
  menuClassName = '',
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected?.label || placeholder;
  }, [options, placeholder, value]);

  const visibleOptions = useMemo(() => options.filter((opt) => opt.value !== value), [options, value]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={rootRef} className={`relative w-full select-none ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-white text-slate-800 px-3 py-2 rounded-xl flex items-center justify-between border border-slate-300 hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className={`h-3 w-5 fill-slate-700 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
          aria-hidden="true"
        >
          <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
        </svg>
      </button>

      <div
        className={`absolute left-0 right-0 z-30 mt-1 rounded-xl bg-white border border-slate-200 shadow-sm p-1 transition-all duration-300 ${menuClassName} ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {visibleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
            className="w-full text-left text-slate-700 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 transition"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
