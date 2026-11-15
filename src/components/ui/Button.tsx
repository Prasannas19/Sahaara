import React, { type ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'amber';
  size?: 'normal' | 'large' | 'small' | 'sm';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'normal',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#173F35] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles =
    size === 'large'
      ? 'min-h-[56px] px-6 text-lg py-3'
      : size === 'small' || size === 'sm'
      ? 'min-h-[36px] px-3 text-xs py-1.5'
      : 'min-h-[48px] px-4 text-base py-2.5';

  const variantStyles = {
    primary: 'bg-[#173F35] text-white hover:bg-[#13352D] active:bg-[#0E2721]',
    secondary: 'bg-[#DCE9DF] text-[#173F35] hover:bg-[#CFDFD3] border border-[#173F35]/15',
    destructive: 'bg-[#8F2D2D] text-white hover:bg-[#782424]',
    ghost: 'bg-transparent text-[#173F35] hover:bg-[#DCE9DF]/50',
    amber: 'bg-[#E8B968] text-[#25312E] hover:bg-[#DFAB53]',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
