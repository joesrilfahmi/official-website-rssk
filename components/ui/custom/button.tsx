// app/components/ui/custom/button.tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    onClick,
    ...props
}) => {
    const variants = {
        default: 'bg-white text-gray-900 hover:bg-gray-100',
        primary: 'bg-bittersweet-500 hover:bg-bittersweet-600 text-white shadow-lg',
        secondary: 'bg-transparent border-2 border-bittersweet-500 hover:bg-bittersweet-100 text-bittersweet-500 hover:text-bittersweet-600 shadow-lg hover:shadow-xl',
        outline: 'bg-transparent text-white border-2 border-white hover:bg-white hover:text-teal-600'
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    return (
        <button
            className={`inline-flex items-center gap-2 font-medium rounded-full transition-all duration-300 cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;