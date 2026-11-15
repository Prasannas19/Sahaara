import React, { type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  id,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full flex flex-col gap-1 text-left">
      <label htmlFor={inputId} className="text-sm font-semibold text-[#25312E]">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-[8px] bg-white border ${
          error ? 'border-[#8F2D2D] focus:ring-[#8F2D2D]' : 'border-[#DCE9DF] focus:border-[#173F35] focus:ring-[#173F35]'
        } text-[#25312E] placeholder-[#52605C]/60 text-base focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-desc` : undefined}
        {...props}
      />
      {error && (
        <span id={`${inputId}-error`} className="text-sm text-[#8F2D2D] font-medium">
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${inputId}-desc`} className="text-xs text-[#52605C]">
          {helperText}
        </span>
      )}
    </div>
  );
};

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  id,
  className = '',
  ...props
}) => {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="w-full flex flex-col gap-1 text-left">
      <label htmlFor={selectId} className="text-sm font-semibold text-[#25312E]">
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-[8px] bg-white border ${
          error ? 'border-[#8F2D2D] focus:ring-[#8F2D2D]' : 'border-[#DCE9DF] focus:border-[#173F35] focus:ring-[#173F35]'
        } text-[#25312E] text-base focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="text-sm text-[#8F2D2D] font-medium">
          {error}
        </span>
      )}
    </div>
  );
};
