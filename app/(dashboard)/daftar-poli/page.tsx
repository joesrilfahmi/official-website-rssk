// ============================================
// FILE: src/app/(dashboard)/poli/page.tsx
// ============================================
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Search, RefreshCw, ArrowUpDown, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/utils';
import { TablePagination } from '@/components/table/TablePagination';
import { Checkbox } from '@/components/ui/checkbox';
import { AccessDeniedDialog } from '@/components/access-denied-dialog';
import { getCurrentUser } from '@/lib/auth';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface Poli {
    id: string;
    nama_poli: string;
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

interface DokterCheckResponse {
    poli_id: string;
    nama: string;
    poli: {
        nama_poli: string;
    } | null;
}

type SortField = 'nama_poli' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface FormDataType {
    nama_poli: string;
    status: 'active' | 'inactive';
}

interface FormErrorsType {
    nama_poli: string;
    status: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
    nama_poli: '',
    status: 'active',
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
    nama_poli: '',
    status: '',
};

export default function PoliPage() {
    const [poli, setPoli] = useState<Poli[]>([]);
    const [filteredPoli, setFilteredPoli] = useState<Poli[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [selectedPoli, setSelectedPoli] = useState<Poli | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Access control state
    const [showAccessDenied, setShowAccessDenied] = useState(false);

    // Selection states
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Pagination & Filter States
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

    // Sorting states
    const [sortField, setSortField] = useState<SortField>('nama_poli');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
    const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Apply filters and sorting
    const applyFilters = useCallback(() => {
        let filtered = [...poli];

        // Search filter
        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.nama_poli.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let compareValue = 0;

            if (sortField === 'nama_poli') {
                compareValue = a.nama_poli.localeCompare(b.nama_poli, 'id');
            } else if (sortField === 'status') {
                compareValue = a.status.localeCompare(b.status, 'id');
            } else if (sortField === 'created_at') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                compareValue = dateA - dateB;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setFilteredPoli(filtered);
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [debouncedSearch, statusFilter, poli, sortField, sortOrder]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Fetch poli
    const fetchPoli = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('poli')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPoli(data || []);
        } catch (error) {
            console.error('Error fetching poli:', error);
            toast.error('Gagal memuat data poli');
        }
    }, []);

    // Initial load
    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);

                // Check user access
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    setShowAccessDenied(true);
                    return;
                }

                await fetchPoli();
            } finally {
                setLoading(false);
            }
        };

        loadInitial();

        // Real-time subscription
        const channel = supabase
            .channel('poli_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'poli' },
                () => {
                    fetchPoli();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPoli]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const loadingToast = toast.loading('Memperbarui data...');

        try {
            await fetchPoli();
            toast.success('Data berhasil diperbarui!', {
                id: loadingToast
            });
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Gagal memperbarui data', {
                id: loadingToast
            });
        } finally {
            setRefreshing(false);
        }
    };

    const handleSortChange = (value: string) => {
        const [field, order] = value.split('-') as [SortField, SortOrder];
        setSortField(field);
        setSortOrder(order);
    };

    const getSortLabel = () => {
        if (sortField === 'nama_poli') {
            return sortOrder === 'asc' ? 'Nama Poli (A-Z)' : 'Nama Poli (Z-A)';
        } else if (sortField === 'status') {
            return sortOrder === 'asc' ? 'Status (A-Z)' : 'Status (Z-A)';
        } else {
            return sortOrder === 'asc' ? 'Terlama' : 'Terbaru';
        }
    };

    const handleResetFilters = () => {
        setStatusFilter('all');
        setSortField('nama_poli');
        setSortOrder('asc');
        setSearchQuery('');
    };

    const totalItems = filteredPoli.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
    const currentPoli = filteredPoli.slice(startIndex, endIndex);

    // Checkbox handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(currentPoli.map(p => p.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const isAllSelected = currentPoli.length > 0 &&
        currentPoli.every(p => selectedIds.has(p.id));

    const isSomeSelected = currentPoli.some(p => selectedIds.has(p.id)) && !isAllSelected;

    const handleOpenDialog = (poliData?: Poli) => {
        if (poliData) {
            setSelectedPoli(poliData);
            setFormData({
                nama_poli: poliData.nama_poli,
                status: poliData.status,
            });
        } else {
            setSelectedPoli(null);
            setFormData({ ...DEFAULT_FORM_DATA });
        }
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedPoli(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
    };

    const validateForm = async () => {
        const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
        let isValid = true;

        if (!formData.nama_poli.trim()) {
            errors.nama_poli = 'Nama poli wajib diisi';
            isValid = false;
        } else if (formData.nama_poli.length < 3) {
            errors.nama_poli = 'Nama poli minimal 3 karakter';
            isValid = false;
        } else if (formData.nama_poli.length > 100) {
            errors.nama_poli = 'Nama poli maksimal 100 karakter';
            isValid = false;
        } else {
            // Check duplicate nama_poli
            const { data: existingPoli } = await supabase
                .from('poli')
                .select('id, nama_poli')
                .ilike('nama_poli', formData.nama_poli.trim())
                .single();

            if (existingPoli) {
                // If editing, check if it's a different record
                if (!selectedPoli || existingPoli.id !== selectedPoli.id) {
                    errors.nama_poli = 'Nama poli sudah digunakan';
                    isValid = false;
                }
            }
        }

        if (!formData.status) {
            errors.status = 'Status wajib dipilih';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isFormValid = await validateForm();
        if (!isFormValid) {
            return;
        }

        setSubmitting(true);

        const loadingToast = toast.loading(
            selectedPoli ? 'Mengupdate poli...' : 'Menambahkan poli...'
        );

        try {
            const dataToSubmit = {
                nama_poli: formData.nama_poli.trim(),
                status: formData.status,
            };

            if (selectedPoli) {
                // Update poli
                const { error } = await supabase
                    .from('poli')
                    .update(dataToSubmit)
                    .eq('id', selectedPoli.id);

                if (error) throw error;

                toast.success('Poli berhasil diupdate', {
                    id: loadingToast
                });
            } else {
                // Insert new poli
                const { error } = await supabase
                    .from('poli')
                    .insert([dataToSubmit]);

                if (error) throw error;

                toast.success('Poli berhasil ditambahkan', {
                    id: loadingToast
                });
            }

            await fetchPoli();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving poli:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data poli';
            toast.error(errorMessage, {
                id: loadingToast
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPoli) return;
        setSubmitting(true);

        const loadingToast = toast.loading('Menghapus poli...');

        try {
            // Cek apakah poli sedang digunakan oleh dokter
            const { data: dokterData, error: checkError } = await supabase
                .from('dokter')
                .select('id, nama')
                .eq('poli_id', selectedPoli.id)
                .limit(1);

            if (checkError) throw checkError;

            if (dokterData && dokterData.length > 0) {
                toast.error(
                    `Gagal menghapus poli karena sedang digunakan oleh dokter "${dokterData[0].nama}"`,
                    { id: loadingToast, duration: 5000 }
                );
                setSubmitting(false);
                setDeleteDialogOpen(false);
                setSelectedPoli(null);
                return;
            }

            // Jika tidak digunakan, lanjutkan penghapusan
            const { error } = await supabase
                .from('poli')
                .delete()
                .eq('id', selectedPoli.id);

            if (error) {
                // Handle error dari database constraint
                if (error.code === '23503') {
                    toast.error(
                        'Gagal menghapus poli karena sedang digunakan oleh data lain',
                        { id: loadingToast, duration: 5000 }
                    );
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Poli berhasil dihapus', {
                id: loadingToast
            });
            await fetchPoli();
            setDeleteDialogOpen(false);
            setSelectedPoli(null);
        } catch (error) {
            console.error('Error deleting poli:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus poli';
            toast.error(errorMessage, {
                id: loadingToast
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setSubmitting(true);

        const loadingToast = toast.loading(`Menghapus ${selectedIds.size} poli...`);

        try {
            const idsArray = Array.from(selectedIds);

            // Cek apakah ada poli yang sedang digunakan oleh dokter
            const { data: dokterData, error: checkError } = await supabase
                .from('dokter')
                .select('poli_id, nama, poli:poli_id(nama_poli)')
                .in('poli_id', idsArray);

            if (checkError) throw checkError;

            if (dokterData && dokterData.length > 0) {
                const typedDokterData = dokterData as unknown as DokterCheckResponse[];
                const usedPoli = typedDokterData
                    .map(d => d.poli?.nama_poli || 'Unknown')
                    .join(', ');

                toast.error(
                    `Gagal menghapus karena ${dokterData.length} poli sedang digunakan oleh dokter: ${usedPoli}`,
                    { id: loadingToast, duration: 6000 }
                );
                setSubmitting(false);
                setBulkDeleteDialogOpen(false);
                setSelectedIds(new Set());
                return;
            }

            // Jika tidak ada yang digunakan, lanjutkan penghapusan
            const { error } = await supabase
                .from('poli')
                .delete()
                .in('id', idsArray);

            if (error) {
                // Handle error dari database constraint
                if (error.code === '23503') {
                    toast.error(
                        'Gagal menghapus beberapa poli karena sedang digunakan oleh data lain',
                        { id: loadingToast, duration: 5000 }
                    );
                } else {
                    throw error;
                }
                return;
            }

            setSelectedIds(new Set());

            toast.success(`${idsArray.length} poli berhasil dihapus`, {
                id: loadingToast
            });
            await fetchPoli();
            setBulkDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error bulk deleting poli:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus poli';
            toast.error(errorMessage, {
                id: loadingToast
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteDialog = (poliData: Poli) => {
        setSelectedPoli(poliData);
        setDeleteDialogOpen(true);
    };

    // Sort options
    const sortOptions = [
        { value: 'nama_poli-asc', label: 'Nama Poli (A-Z)' },
        { value: 'nama_poli-desc', label: 'Nama Poli (Z-A)' },
        { value: 'status-asc', label: 'Status (A-Z)' },
        { value: 'status-desc', label: 'Status (Z-A)' },
        { value: 'created_at-desc', label: 'Terbaru' },
        { value: 'created_at-asc', label: 'Terlama' },
    ];

    // Status filter options
    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    const showReset = statusFilter !== 'all' || sortField !== 'nama_poli' || sortOrder !== 'asc' || searchQuery !== '';

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Poli</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Poli</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola data poliklinik
                    </p>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setBulkDeleteDialogOpen(true)}
                            disabled={submitting}
                            className='bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white'
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus ({selectedIds.size})
                        </Button>
                    )}
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Poli
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        {/* Title and Search Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle>Daftar Poli ({totalItems})</CardTitle>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative grow sm:grow-0 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Cari nama poli..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="shrink-0"
                                    title="Perbarui data table"
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {/* Sort Filter */}
                            <Select value={`${sortField}-${sortOrder}`} onValueChange={handleSortChange}>
                                <SelectTrigger className="w-full">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpDown className="h-4 w-4" />
                                        <span>{getSortLabel()}</span>
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

                            {/* Status Filter */}
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}>
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

                            {/* Reset Button */}
                            {showReset && (
                                <div className="w-full">
                                    <Button
                                        variant="outline"
                                        onClick={handleResetFilters}
                                        className="w-full"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Reset Filter
                                    </Button>
                                </div>
                            )}
                        </div>

                    </div>
                </CardHeader>
                <CardContent>
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={isAllSelected}
                                            onCheckedChange={handleSelectAll}
                                            aria-label="Select all"
                                            className={isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""}
                                        />
                                    </TableHead>
                                    <TableHead className="w-16">No</TableHead>
                                    <TableHead>Nama Poli</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[180px]">Dibuat</TableHead>
                                    <TableHead className="text-right w-32">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentPoli.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                                            {searchQuery || statusFilter !== 'all'
                                                ? 'Tidak ada data yang sesuai dengan pencarian'
                                                : 'Belum ada data poli'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentPoli.map((poliItem, index) => (
                                        <TableRow key={poliItem.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(poliItem.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectOne(poliItem.id, checked as boolean)
                                                    }
                                                    aria-label={`Select ${poliItem.nama_poli}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {startIndex + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {poliItem.nama_poli}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        poliItem.status === 'active'
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700'
                                                    }
                                                >
                                                    {poliItem.status === 'active' ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {poliItem.created_at ? formatDateTime(poliItem.created_at) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleOpenDialog(poliItem)}
                                                                    className="h-8 w-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white hover:text-white"
                                                                    disabled={submitting}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleOpenDeleteDialog(poliItem)}
                                                                    className="h-8 w-8 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                                                                    disabled={submitting}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Hapus</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={totalItems}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                        startIndex={startIndex}
                        endIndex={endIndex}
                    />
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedPoli ? 'Edit Poli' : 'Tambah Poli'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedPoli
                                ? 'Update informasi poli'
                                : 'Tambah poli baru ke sistem'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            {/* Nama Poli */}
                            <div className="space-y-2">
                                <Label htmlFor="nama_poli">
                                    Nama Poli <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="nama_poli"
                                    value={formData.nama_poli}
                                    onChange={(e) => {
                                        setFormData({ ...formData, nama_poli: e.target.value });
                                        if (formErrors.nama_poli) {
                                            setFormErrors({ ...formErrors, nama_poli: '' });
                                        }
                                    }}
                                    placeholder="Contoh: Poli Umum"
                                    disabled={submitting}
                                    className={formErrors.nama_poli ? 'border-red-500' : ''}
                                />
                                {formErrors.nama_poli && (
                                    <p className="text-sm text-red-500">{formErrors.nama_poli}</p>
                                )}
                            </div>

                            {/* Status - Hanya tampil saat edit */}
                            {selectedPoli && (
                                <div className="space-y-2">
                                    <Label htmlFor="status">
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value: 'active' | 'inactive') =>
                                            setFormData({ ...formData, status: value })
                                        }
                                        disabled={submitting}
                                    >
                                        <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {formErrors.status && (
                                        <p className="text-sm text-red-500">{formErrors.status}</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={submitting}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {submitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Poli?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus poli{' '}
                            <strong>{selectedPoli?.nama_poli}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white"
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitting ? 'Menghapus...' : 'Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Confirmation Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {selectedIds.size} Poli?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus {selectedIds.size} poli yang dipilih?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitting ? 'Menghapus...' : 'Hapus Semua'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Access Denied Dialog */}
            <AccessDeniedDialog
                open={showAccessDenied}
                onOpenChange={setShowAccessDenied}
            />
        </div>
    );
}