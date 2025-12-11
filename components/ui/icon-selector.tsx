// components/ui/icon-selector.tsx
'use client';

import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

interface IconSelectorProps {
    value: string;
    onChange: (iconName: string) => void;
    error?: string;
    disabled?: boolean;
}

// Daftar icon yang tersedia
const availableIcons = [
    'Heart', 'Activity', 'AlertCircle', 'Baby', 'Pill', 'Stethoscope',
    'Hospital', 'HeartPulse', 'Cross', 'Syringe', 'Microscope', 'TestTube',
    'Bone', 'Eye', 'Ear', 'Brain', 'Droplet', 'Users',
    'UserCheck', 'Shield', 'ShieldCheck', 'Sparkles', 'Star', 'Award',
    'Zap', 'Coffee', 'Sun', 'Moon', 'Wind',
    'Flame', 'Snowflake', 'Leaf', 'Mountain',
    'Home', 'Building', 'Building2', 'Store', 'Briefcase', 'GraduationCap',
    'BookOpen', 'Mail', 'Phone', 'MapPin', 'Navigation', 'Compass',
    'Clock', 'Calendar', 'FileText', 'Folder', 'Save', 'Download',
    'Upload', 'Image', 'Video', 'Music', 'Settings', 'Bell',
    'CheckCircle', 'XCircle', 'Info', 'HelpCircle', 'Plus', 'Minus',
    'Edit', 'Trash', 'Search', 'Filter', 'List', 'Grid'
];

// Helper function to check if icon is valid
const isValidIcon = (iconName: string): boolean => {
    const IconComponent = Icons[iconName as keyof typeof Icons];
    return typeof IconComponent === 'function' || typeof IconComponent === 'object';
};

const IconSelector: React.FC<IconSelectorProps> = ({ value, onChange, error, disabled }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch by only rendering after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Filter icon berdasarkan pencarian
    const filteredIcons = availableIcons.filter(key =>
        isValidIcon(key) && key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const IconComponent = value && isValidIcon(value)
        ? Icons[value as keyof typeof Icons] as React.ElementType
        : null;

    // Show loading state during mount to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className="space-y-3">
                <Label>
                    Icon <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                    <div className="h-12 w-full animate-pulse bg-muted rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Label>
                Icon <span className="text-red-500">*</span>
            </Label>

            {/* Selected Icon Display */}
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                {IconComponent ? (
                    <>
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">{value}</p>
                            <p className="text-sm text-muted-foreground">Icon terpilih</p>
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">Belum ada icon dipilih</p>
                )}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Cari icon..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    disabled={disabled}
                />
            </div>

            {/* Icon Grid */}
            <ScrollArea className="h-[300px] border rounded-lg p-4">
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                    {filteredIcons.map((iconName) => {
                        if (!isValidIcon(iconName)) return null;

                        const Icon = Icons[iconName as keyof typeof Icons] as React.ElementType;
                        const isSelected = value === iconName;

                        return (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => onChange(iconName)}
                                disabled={disabled}
                                className={`p-3 rounded-lg border-2 transition-all hover:bg-primary/10 hover:border-primary flex items-center justify-center ${isSelected
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background border-border'
                                    }`}
                                title={iconName}
                            >
                                <Icon className="h-5 w-5" />
                            </button>
                        );
                    })}
                </div>

                {filteredIcons.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Tidak ada icon ditemukan</p>
                    </div>
                )}
            </ScrollArea>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
};

export default IconSelector;