import React from 'react';

export interface BrandLogoProps {
  variant?: 'full' | 'symbol' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light' | 'forest';
  className?: string;
  showTagline?: boolean;
}

export const BrandSymbol: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 36,
  className = '',
  color = '#173F35',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Outer sheltering arch / supportive guardian arm */}
      <path
        d="M8 36C8 21.6406 19.6406 10 34 10C37.5 10 40.5 11 40.5 11"
        stroke={color}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Inner foundational arch / elder core being lifted and protected */}
      <path
        d="M16 38C16 26.9543 24.9543 18 36 18"
        stroke={color === '#FFFFFF' ? '#DCE9DF' : '#6C9B8B'}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Central focal node representing the circle of care */}
      <circle
        cx="36"
        cy="18"
        r="4.5"
        fill={color === '#FFFFFF' ? '#FFFFFF' : '#173F35'}
      />
      <circle
        cx="14"
        cy="38"
        r="3"
        fill={color === '#FFFFFF' ? '#DCE9DF' : '#E8B968'}
      />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'forest',
  className = '',
  showTagline = false,
}) => {
  const symbolSizes = { sm: 28, md: 38, lg: 48 };
  const symbolSize = symbolSizes[size];

  const primaryColor = theme === 'light' ? '#FFFFFF' : '#173F35';
  const textColor = theme === 'light' ? 'text-white' : 'text-[#173F35]';
  const taglineColor = theme === 'light' ? 'text-white/70' : 'text-[#52605C]';

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  if (variant === 'symbol') {
    return <BrandSymbol size={symbolSize} color={primaryColor} className={className} />;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BrandSymbol size={symbolSize} color={primaryColor} className="shrink-0" />
      <div className="flex flex-col">
        <span
          className={`font-heading font-extrabold tracking-tight ${titleSizes[size]} ${textColor} leading-none`}
        >
          Sahaara
        </span>
        {showTagline && (
          <span className={`text-[11px] font-medium tracking-normal ${taglineColor} mt-1`}>
            Care that connects. Support that matters.
          </span>
        )}
      </div>
    </div>
  );
};
