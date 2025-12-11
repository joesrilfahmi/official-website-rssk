// ============================================
// FILE: src/components/ui/password-input.tsx
// Reusable password input component with toggle visibility
// ============================================

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    required?: boolean;
    showError?: boolean;
}

export function PasswordInput({
    label,
    error,
    required = false,
    showError = true,
    className = '',
    disabled = false,
    ...props
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                    {required && <span className="text-red-500"> *</span>}
                </label>
            )}
            <div className="relative">
                <Input
                    {...props}
                    type={showPassword ? 'text' : 'password'}
                    disabled={disabled}
                    className={`pr-10 ${error ? 'border-red-500' : ''} ${className}`}
                />
                <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={disabled}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
            {showError && error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}