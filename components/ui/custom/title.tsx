// app/components/ui/custom/title.tsx
import React from 'react';
import Badge from './badge';

interface TitleProps {
    badge?: string;
    title: string;
    badgeVariant?: 'default' | 'primary' | 'secondary';
    titleClassName?: string;
    containerClassName?: string;
    align?: 'left' | 'center' | 'right';
}

const Title: React.FC<TitleProps> = ({
    badge,
    title,
    badgeVariant = 'default',
    titleClassName = '',
    containerClassName = '',
    align = 'left'
}) => {
    const alignmentClasses = {
        left: 'text-left items-start',
        center: 'text-center items-center',
        right: 'text-right items-end'
    };

    return (
        <div className={`space-y-5 sm:space-y-6 flex flex-col ${alignmentClasses[align]} ${containerClassName}`}>
            {/* Conditional Badge */}
            {badge && (
                <Badge variant={badgeVariant}>
                    {badge}
                </Badge>
            )}

            {/* Title */}
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-mariner-500 leading-tight ${titleClassName}`}>
                {title}
            </h1>
        </div>
    );
};

export default Title;