import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PillsProps {
    label: string;
    count?: number | string;
    variant?: 'default' | 'active';
    onClick?: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
    className?: string;
}

const Pills: React.FC<PillsProps> = ({
    label,
    count,
    variant = 'default',
    onClick,
    icon: Icon,
    disabled = false,
    className = '',
}) => {
    const baseClasses = `
    shrink-0 px-6 py-2.5 rounded-full text-sm font-medium
    transition-all duration-200
    flex items-center gap-2
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
  `;

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
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            type="button"
        >
            {Icon && <Icon className="w-4 h-4" />}
            <span>{label}</span>
            {count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${countClasses[variant]}`}>
                    {count}
                </span>
            )}
        </button>
    );
};

export default Pills;