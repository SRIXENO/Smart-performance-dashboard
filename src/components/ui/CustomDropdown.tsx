'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

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
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listId = useId();

  const selectedLabel = useMemo(() => {
    const selected = options.find((opt) => opt.value === value);
    return selected?.label || placeholder;
  }, [options, placeholder, value]);

  const visibleOptions = useMemo(() => options.filter((opt) => opt.value !== value), [options, value]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, open]);

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

  const chooseOption = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex(0);
      return;
    }

    if (!open) return;

    if (!visibleOptions.length) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % visibleOptions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + visibleOptions.length) % visibleOptions.length);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      chooseOption(visibleOptions[activeIndex]?.value);
      return;
    }

    if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative w-full select-none ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={selectedLabel}
        className="interactive-btn w-full bg-white text-slate-800 px-3 py-2 rounded-xl flex items-center justify-between border border-slate-300 hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className={`h-3 w-5 fill-slate-700 transition-transform dark:fill-slate-200 ${open ? 'rotate-0' : '-rotate-90'}`}
          aria-hidden="true"
        >
          <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
        </svg>
      </button>

      <div
        id={listId}
        role="listbox"
        className={`absolute left-0 right-0 z-30 mt-1 rounded-xl bg-white border border-slate-200 shadow-sm p-1 transition-all duration-300 dark:bg-slate-900 dark:border-slate-700 ${menuClassName} ${
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {visibleOptions.map((option, index) => (
          <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => chooseOption(option.value)}
            className={`w-full text-left text-slate-700 px-3 py-2 rounded-lg text-sm transition dark:text-slate-200 ${
              index === activeIndex ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
