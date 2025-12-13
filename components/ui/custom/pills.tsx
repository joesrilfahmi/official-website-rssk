import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PillsProps {
    label: string;
    count?: number | string;
    variant?: 'default' | 'active';
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
    className?: string;
}

const Pills: React.FC<PillsProps> = ({
    label,
    count,
    variant = 'default',
    size = 'md',
    onClick,
    icon: Icon,
    disabled = false,
    className = '',
}) => {
    const baseClasses = `
    shrink-0 rounded-full font-medium
    transition-all duration-200
    flex items-center gap-2
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
  `;

    const sizeClasses = {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-6 py-2.5 text-sm',
        lg: 'px-8 py-3.5 text-base',
    };

    const iconSizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    const countSizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-0.5',
        lg: 'text-sm px-2.5 py-1',
    };

    const variantClasses = {
        default: `
      bg-white text-gray-600 border border-gray-200
      ${!disabled && 'hover:border-mariner-500 hover:text-mariner-500 hover:shadow-md'}
    `,
        active: `
      bg-mariner-500 text-white shadow-lg scale-105
    `,
    };

    const countClasses = {
        default: 'bg-gray-100',
        active: 'bg-white/20',
    };

    const handleClick = () => {
        if (!disabled && onClick) {
            onClick();
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            type="button"
        >
            {Icon && <Icon className={iconSizeClasses[size]} />}
            <span>{label}</span>
            {count !== undefined && (
                <span className={`rounded-full ${countSizeClasses[size]} ${countClasses[variant]}`}>
                    {count}
                </span>
            )}
        </button>
    );
};

export default Pills;