// components/table/TablePagination.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number | 'all';
    totalItems: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (value: number | 'all') => void;
    startIndex: number;
    endIndex: number;
}

export function TablePagination({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    startIndex,
    endIndex,
}: TablePaginationProps) {
    if (totalItems === 0) return null;

    const handleItemsPerPageChange = (value: string) => {
        onItemsPerPageChange(value === 'all' ? 'all' : parseInt(value));
    };

    // Show pagination when itemsPerPage is 'all'
    if (itemsPerPage === 'all') {
        return (
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="w-[65px] h-9">
                            <SelectValue placeholder="Per halaman" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        Menampilkan semua {totalItems} data
                    </p>
                </div>
            </div>
        );
    }

    // Show pagination when totalPages is 1
    if (totalPages === 1) {
        return (
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                    <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="w-[65px] h-9">
                            <SelectValue placeholder="Per halaman" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                            <SelectItem value="all">All</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        Menampilkan {totalItems} data
                    </p>
                </div>
            </div>
        );
    }

    // Full pagination
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-3">
                <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[65px] h-9">
                        <SelectValue placeholder="Per halaman" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                    Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} data
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                    {totalPages <= 5 ? (
                        [...Array(totalPages)].map((_, i) => (
                            <Button
                                key={i}
                                variant={currentPage === i + 1 ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => onPageChange(i + 1)}
                                className="w-9"
                            >
                                {i + 1}
                            </Button>
                        ))
                    ) : (
                        <>
                            {currentPage > 2 && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPageChange(1)}
                                        className="w-9"
                                    >
                                        1
                                    </Button>
                                    {currentPage > 3 && <span className="px-2">...</span>}
                                </>
                            )}

                            {[...Array(3)].map((_, i) => {
                                const pageNum = currentPage - 1 + i;
                                if (pageNum < 1 || pageNum > totalPages) return null;
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => onPageChange(pageNum)}
                                        className="w-9"
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}

                            {currentPage < totalPages - 1 && (
                                <>
                                    {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onPageChange(totalPages)}
                                        className="w-9"
                                    >
                                        {totalPages}
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}