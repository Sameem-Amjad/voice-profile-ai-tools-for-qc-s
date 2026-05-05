import React from 'react';
import clsx from 'clsx';

const VARIANTS = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
  ghost:
    'bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Reusable button with primary / secondary / ghost variants.
 *
 * Props:
 *   variant   – 'primary' | 'secondary' | 'ghost'  (default: primary)
 *   size      – 'sm' | 'md' | 'lg'                  (default: md)
 *   icon      – Optional lucide-react icon component
 *   disabled  – boolean
 *   className – extra classes
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  className,
  ...rest
}) => {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        VARIANTS[variant],
        SIZES[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...rest}
    >
      {Icon && <Icon size={size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
};
