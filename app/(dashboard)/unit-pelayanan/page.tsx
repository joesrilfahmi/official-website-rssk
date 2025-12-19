
// ============================================
// FILE: src/app/(dashboard)/unit-pelayanan/page.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
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

interface UnitPelayanan {
    id: string;
    title: string;
    created_at?: string;
    updated_at?: string;
}

interface KritikSaranCheckResponse {
    unit_pelayanan_id: string;
    nama: string;
    unit_pelayanan: {
        title: string;
    } | null;
}

type SortField = 'title' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface FormDataType {
    title: string;
}

interface FormErrorsType {
    title: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
    title: '',
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
    title: '',
};

export default function UnitPelayananPage() {
    const [unitPelayanan, setUnitPelayanan] = useState<UnitPelayanan[]>([]);
    const [filteredUnitPelayanan, setFilteredUnitPelayanan] = useState<UnitPelayanan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [selectedUnitPelayanan, setSelectedUnitPelayanan] = useState<UnitPelayanan | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);

    const [sortField, setSortField] = useState<SortField>('title');
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
        let filtered = [...unitPelayanan];

        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            filtered = filtered.filter(u => u.title.toLowerCase().includes(query));
        }

        filtered.sort((a, b) => {
            let compareValue = 0;
            if (sortField === 'title') {
                compareValue = a.title.localeCompare(b.title, 'id');
            } else if (sortField === 'created_at') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                compareValue = dateA - dateB;
            }
            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setFilteredUnitPelayanan(filtered);
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [debouncedSearch, unitPelayanan, sortField, sortOrder]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // Fetch unit pelayanan
    const fetchUnitPelayanan = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('unit_pelayanan')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUnitPelayanan(data || []);
        } catch (error) {
            console.error('Error fetching unit pelayanan:', error);
            toast.error('Gagal memuat data unit pelayanan');
        }
    }, []);

    // Initial load
    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);

                // const currentUser = getCurrentUser();
                // if (!currentUser || currentUser.role !== 'administrator') {
                //     setShowAccessDenied(true);
                //     return;
                // }

                const currentUser = getCurrentUser();
                if (!currentUser) {
                    setShowAccessDenied(true);
                    return;
                }

                await fetchUnitPelayanan();
            } finally {
                setLoading(false);
            }
        };

        loadInitial();

        // Real-time subscription
        const channel = supabase
            .channel('unit_pelayanan_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'unit_pelayanan' },
                () => {
                    fetchUnitPelayanan();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchUnitPelayanan]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const loadingToast = toast.loading('Memperbarui data...');

        try {
            await fetchUnitPelayanan();
            toast.success('Data berhasil diperbarui!', { id: loadingToast });
        } catch (error) {
            console.error('Error refreshing data:', error);
            toast.error('Gagal memperbarui data', { id: loadingToast });
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
        if (sortField === 'title') {
            return sortOrder === 'asc' ? 'Judul (A-Z)' : 'Judul (Z-A)';
        } else {
            return sortOrder === 'asc' ? 'Terlama' : 'Terbaru';
        }
    };

    const handleResetFilters = () => {
        setSortField('title');
        setSortOrder('asc');
        setSearchQuery('');
    };

    const totalItems = filteredUnitPelayanan.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
    const currentUnitPelayanan = filteredUnitPelayanan.slice(startIndex, endIndex);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(currentUnitPelayanan.map(u => u.id));
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

    const isAllSelected = currentUnitPelayanan.length > 0 &&
        currentUnitPelayanan.every(u => selectedIds.has(u.id));
    const isSomeSelected = currentUnitPelayanan.some(u => selectedIds.has(u.id)) && !isAllSelected;

    const handleOpenDialog = (unitData?: UnitPelayanan) => {
        if (unitData) {
            setSelectedUnitPelayanan(unitData);
            setFormData({ title: unitData.title });
        } else {
            setSelectedUnitPelayanan(null);
            setFormData({ ...DEFAULT_FORM_DATA });
        }
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedUnitPelayanan(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
    };

    const validateForm = async () => {
        const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
        let isValid = true;

        if (!formData.title.trim()) {
            errors.title = 'Judul unit pelayanan wajib diisi';
            isValid = false;
        } else if (formData.title.length < 3) {
            errors.title = 'Judul unit pelayanan minimal 3 karakter';
            isValid = false;
        } else if (formData.title.length > 100) {
            errors.title = 'Judul unit pelayanan maksimal 100 karakter';
            isValid = false;
        } else {
            // Check duplicate
            const { data: existing } = await supabase
                .from('unit_pelayanan')
                .select('id, title')
                .ilike('title', formData.title.trim())
                .single();

            if (existing) {
                if (!selectedUnitPelayanan || existing.id !== selectedUnitPelayanan.id) {
                    errors.title = 'Judul unit pelayanan sudah digunakan';
                    isValid = false;
                }
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isFormValid = await validateForm();
        if (!isFormValid) return;

        setSubmitting(true);
        const loadingToast = toast.loading(
            selectedUnitPelayanan ? 'Mengupdate unit pelayanan...' : 'Menambahkan unit pelayanan...'
        );

        try {
            const dataToSubmit = { title: formData.title.trim() };

            if (selectedUnitPelayanan) {
                const { error } = await supabase
                    .from('unit_pelayanan')
                    .update(dataToSubmit)
                    .eq('id', selectedUnitPelayanan.id);

                if (error) throw error;
                toast.success('Unit pelayanan berhasil diupdate', { id: loadingToast });
            } else {
                const { error } = await supabase
                    .from('unit_pelayanan')
                    .insert([dataToSubmit]);

                if (error) throw error;
                toast.success('Unit pelayanan berhasil ditambahkan', { id: loadingToast });
            }

            await fetchUnitPelayanan();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving unit pelayanan:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data';
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUnitPelayanan) return;
        setSubmitting(true);
        const loadingToast = toast.loading('Menghapus unit pelayanan...');

        try {
            // Cek apakah unit pelayanan sedang digunakan oleh kritik_saran
            const { data: kritikSaranData, error: checkError } = await supabase
                .from('kritik_saran')
                .select('id, nama')
                .eq('unit_pelayanan_id', selectedUnitPelayanan.id)
                .limit(1);

            if (checkError) throw checkError;

            if (kritikSaranData && kritikSaranData.length > 0) {
                toast.error(
                    `Gagal menghapus unit pelayanan karena sedang digunakan oleh kritik & saran dari "${kritikSaranData[0].nama}"`,
                    { id: loadingToast, duration: 5000 }
                );
                setSubmitting(false);
                setDeleteDialogOpen(false);
                setSelectedUnitPelayanan(null);
                return;
            }

            // Jika tidak digunakan, lanjutkan penghapusan
            const { error } = await supabase
                .from('unit_pelayanan')
                .delete()
                .eq('id', selectedUnitPelayanan.id);

            if (error) {
                if (error.code === '23503') {
                    toast.error('Gagal menghapus karena sedang digunakan oleh data lain',
                        { id: loadingToast, duration: 5000 });
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Unit pelayanan berhasil dihapus', { id: loadingToast });
            await fetchUnitPelayanan();
            setDeleteDialogOpen(false);
            setSelectedUnitPelayanan(null);
        } catch (error) {
            console.error('Error deleting unit pelayanan:', error);
            toast.error('Gagal menghapus unit pelayanan', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setSubmitting(true);
        const loadingToast = toast.loading(`Menghapus ${selectedIds.size} unit pelayanan...`);

        try {
            const idsArray = Array.from(selectedIds);

            // Cek apakah ada unit pelayanan yang sedang digunakan oleh kritik_saran
            const { data: kritikSaranData, error: checkError } = await supabase
                .from('kritik_saran')
                .select('unit_pelayanan_id, nama, unit_pelayanan:unit_pelayanan_id(title)')
                .in('unit_pelayanan_id', idsArray);

            if (checkError) throw checkError;

            if (kritikSaranData && kritikSaranData.length > 0) {
                const typedKritikSaranData = kritikSaranData as unknown as KritikSaranCheckResponse[];
                const usedUnitPelayanan = typedKritikSaranData
                    .map(d => d.unit_pelayanan?.title || 'Unknown')
                    .join(', ');

                toast.error(
                    `Gagal menghapus karena ${kritikSaranData.length} unit pelayanan sedang digunakan oleh kritik & saran: ${usedUnitPelayanan}`,
                    { id: loadingToast, duration: 6000 }
                );
                setSubmitting(false);
                setBulkDeleteDialogOpen(false);
                setSelectedIds(new Set());
                return;
            }

            // Jika tidak ada yang digunakan, lanjutkan penghapusan
            const { error } = await supabase
                .from('unit_pelayanan')
                .delete()
                .in('id', idsArray);

            if (error) {
                if (error.code === '23503') {
                    toast.error('Gagal menghapus beberapa unit karena sedang digunakan',
                        { id: loadingToast, duration: 5000 });
                } else {
                    throw error;
                }
                return;
            }

            setSelectedIds(new Set());
            toast.success(`${selectedIds.size} unit pelayanan berhasil dihapus`, { id: loadingToast });
            await fetchUnitPelayanan();
            setBulkDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error bulk deleting:', error);
            toast.error('Gagal menghapus unit pelayanan', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const sortOptions = [
        { value: 'title-asc', label: 'Judul (A-Z)' },
        { value: 'title-desc', label: 'Judul (Z-A)' },
        { value: 'created_at-desc', label: 'Terbaru' },
        { value: 'created_at-asc', label: 'Terlama' },
    ];

    const showReset = sortField !== 'title' || sortOrder !== 'asc' || searchQuery !== '';

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-64" />
                <Card>
                    <CardHeader><Skeleton className="h-7 w-48" /></CardHeader>
                    <CardContent>
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full mb-2" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Unit Pelayanan</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Unit Pelayanan</h1>
                    <p className="text-muted-foreground mt-1">Kelola data unit pelayanan</p>
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                    {selectedIds.size > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setBulkDeleteDialogOpen(true)}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus ({selectedIds.size})
                        </Button>
                    )}
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Unit Pelayanan
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle>Daftar Unit Pelayanan ({totalItems})</CardTitle>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative grow sm:grow-0 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Cari unit pelayanan..."
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
                                    title="Perbarui data"
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Select value={`${sortField}-${sortOrder}`} onValueChange={handleSortChange}>
                                <SelectTrigger className="w-full sm:w-[200px]">
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
                            {showReset && (
                                <Button variant="outline" onClick={handleResetFilters}>
                                    <X className="h-4 w-4 mr-2" />
                                    Reset
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
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
                                    <TableHead>Judul Unit Pelayanan</TableHead>
                                    <TableHead className="w-[180px]">Dibuat</TableHead>
                                    <TableHead className="text-right w-32">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentUnitPelayanan.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground h-32">
                                            {searchQuery ? 'Tidak ada data yang sesuai' : 'Belum ada data unit pelayanan'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentUnitPelayanan.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(item.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{startIndex + index + 1}</TableCell>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {item.created_at ? formatDateTime(item.created_at) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => handleOpenDialog(item)}
                                                                    className="h-8 w-8 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white hover:text-white"
                                                                    disabled={submitting}
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit</p></TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => {
                                                                        setSelectedUnitPelayanan(item);
                                                                        setDeleteDialogOpen(true);
                                                                    }}
                                                                    className="h-8 w-8 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                                                                    disabled={submitting}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Hapus</p></TooltipContent>
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
                            {selectedUnitPelayanan ? 'Edit Unit Pelayanan' : 'Tambah Unit Pelayanan'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedUnitPelayanan ? 'Update informasi unit pelayanan' : 'Tambah unit pelayanan baru'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Judul Unit Pelayanan <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData({ title: e.target.value });
                                        if (formErrors.title) setFormErrors({ title: '' });
                                    }}
                                    placeholder="Contoh: Rawat Jalan"
                                    disabled={submitting}
                                    className={formErrors.title ? 'border-red-500' : ''}
                                />
                                {formErrors.title && (
                                    <p className="text-sm text-red-500">{formErrors.title}</p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={submitting}>
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

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Unit Pelayanan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus unit pelayanan{' '}
                            <strong>{selectedUnitPelayanan?.title}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white"
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitting ? 'Menghapus...' : 'Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Delete Dialog */}
            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {selectedIds.size} Unit Pelayanan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus {selectedIds.size} unit pelayanan yang dipilih?
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

            <AccessDeniedDialog open={showAccessDenied} onOpenChange={setShowAccessDenied} />
        </div>
    );
}