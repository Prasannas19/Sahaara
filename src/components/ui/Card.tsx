import React, { type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  clickable?: boolean;
  highlight?: boolean;
  elevated?: boolean;
  variant?: 'default' | 'subtle' | 'translucent';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  interactive = true,
  clickable = false,
  highlight = false,
  elevated = false,
  variant = 'default',
  onClick,
  onKeyDown,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white border-[#DCE9DF]',
    subtle: 'bg-[#F8F7F1] border-[#DCE9DF]',
    translucent: 'bg-white/80 backdrop-blur-md border-[#DCE9DF]/80',
  }[variant];

  const highlightStyles = highlight
    ? 'border-[#173F35] ring-2 ring-[#173F35]/15'
    : '';

  const elevationStyles = elevated
    ? 'shadow-[0_8px_24px_rgba(23,63,53,0.1)]'
    : 'shadow-[0_2px_8px_rgba(23,63,53,0.06)]';

  // Universal card interaction: restrained translateY + softened elevation + border polish
  const interactiveStyles = interactive
    ? 'transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(23,63,53,0.09)] hover:border-[#173F35]/30'
    : '';

  const clickableStyles = clickable
    ? 'cursor-pointer active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-[#173F35] focus:ring-offset-2 select-none'
    : '';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    if (onKeyDown) onKeyDown(e);
  };

  return (
    <div
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group rounded-[20px] border p-6 ${variantStyles} ${highlightStyles} ${elevationStyles} ${interactiveStyles} ${clickableStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
