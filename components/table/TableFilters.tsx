// components/table/TableFilters.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, ArrowUpDown, X } from 'lucide-react';

export type SortOption = {
    value: string;
    label: string;
};

export type FilterOption = {
    value: string;
    label: string;
};

interface TableFiltersProps {
    // Search
    searchQuery: string;
    onSearchChange: (value: string) => void;
    searchPlaceholder?: string;

    // Refresh
    refreshing?: boolean;
    onRefresh?: () => void;

    // Sort
    sortValue: string;
    onSortChange: (value: string) => void;
    sortOptions: SortOption[];
    sortLabel: string;

    // Status Filter (optional)
    statusFilter?: string;
    onStatusFilterChange?: (value: string) => void;
    statusOptions?: FilterOption[];

    // Reset
    showReset?: boolean;
    onReset?: () => void;
}

export function TableFilters({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Cari...',
    refreshing = false,
    onRefresh,
    sortValue,
    onSortChange,
    sortOptions,
    sortLabel,
    statusFilter,
    onStatusFilterChange,
    statusOptions,
    showReset = false,
    onReset,
}: TableFiltersProps) {
    return (
        <div className="space-y-4">
            {/* Search and Refresh */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-3 w-full">
                    <div className="relative grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {onRefresh && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="shrink-0"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Sort Filter */}
                <Select value={sortValue} onValueChange={onSortChange}>
                    <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            <span>{sortLabel}</span>
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Status Filter (optional) */}
                {statusFilter !== undefined && onStatusFilterChange && statusOptions && (
                    <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Reset Button */}
                {showReset && onReset && (
                    <div className="w-full">
                        <Button variant="outline" onClick={onReset} className="w-full">
                            <X className="h-4 w-4 mr-2" />
                            Reset Filter
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}