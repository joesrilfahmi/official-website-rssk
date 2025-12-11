import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'secondary';
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const variants = {
        default: 'bg-pastelgreen-500 border-2 border-pastelgreen-400 text-white',
        primary: 'bg-emerald-500 text-white',
        secondary: 'bg-gray-100 text-gray-800'
    };

    return (
        <span
            className={`inline-flex items-center px-4 py-2 rounded-t-full rounded-bl-full text-sm font-medium backdrop-blur-sm ${variants[variant]} ${className}`}
        >
            {children}
        </span>
    );
};

export default Badge;