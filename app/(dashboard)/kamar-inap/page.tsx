// File: app/(dashboard)/kamar-inap/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Loader2, Search, RefreshCw, ArrowUpDown, X, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { KamarInap } from '@/types/index';

// ============================================================
// TYPES & INTERFACES
// ============================================================

type SortField = 'title' | 'price' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface FormDataType {
    title: string;
    description: string;
    price: string;
    facilities: string[];
    is_recommended: boolean;
}

interface FormErrorsType {
    title: string;
    description: string;
    price: string;
    facilities: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_FORM_DATA: FormDataType = {
    title: '',
    description: '',
    price: '',
    facilities: [],
    is_recommended: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
    title: '',
    description: '',
    price: '',
    facilities: '',
};

const COMMON_FACILITIES = [
    'Bedside Cabinet',
    'Waiting Chair',
    'Waiting Chair + Sofa',
    'Bathroom (Hot & Cold Water)',
    'TV LED',
    'TV LED + WiFi',
    'WiFi',
    'AC',
    'Kulkas',
    'Telepon',
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function KamarInapPage() {
    const [kamar, setKamar] = useState<KamarInap[]>([]);
    const [filteredKamar, setFilteredKamar] = useState<KamarInap[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [selectedKamar, setSelectedKamar] = useState<KamarInap | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
    const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
    const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
    const [facilityInput, setFacilityInput] = useState('');

    // ============================================================
    // EFFECTS
    // ============================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const applyFilters = useCallback(() => {
        let filtered = [...kamar];

        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            filtered = filtered.filter(k =>
                k.title.toLowerCase().includes(query) ||
                k.description.toLowerCase().includes(query) ||
                k.facilities.some(f => f.toLowerCase().includes(query))
            );
        }

        filtered.sort((a, b) => {
            let compareValue = 0;

            if (sortField === 'title') {
                compareValue = a.title.localeCompare(b.title, 'id');
            } else if (sortField === 'price') {
                compareValue = a.price - b.price;
            } else if (sortField === 'created_at') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                compareValue = dateA - dateB;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setFilteredKamar(filtered);
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [debouncedSearch, kamar, sortField, sortOrder]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const fetchKamar = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('kamar_inap')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setKamar(data || []);
        } catch (error) {
            console.error('Error fetching kamar:', error);
            toast.error('Gagal memuat data kamar inap');
        }
    }, []);

    useEffect(() => {
        const loadInitial = async () => {
            try {
                setLoading(true);
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    setShowAccessDenied(true);
                    return;
                }
                await fetchKamar();
            } finally {
                setLoading(false);
            }
        };

        loadInitial();

        const channel = supabase
            .channel('kamar_inap_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'kamar_inap' },
                () => {
                    fetchKamar();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchKamar]);

    // ============================================================
    // HANDLERS
    // ============================================================

    const handleRefresh = async () => {
        setRefreshing(true);
        const loadingToast = toast.loading('Memperbarui data...');
        try {
            await fetchKamar();
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
            return sortOrder === 'asc' ? 'Nama (A-Z)' : 'Nama (Z-A)';
        } else if (sortField === 'price') {
            return sortOrder === 'asc' ? 'Harga (Terendah)' : 'Harga (Tertinggi)';
        } else {
            return sortOrder === 'asc' ? 'Terlama' : 'Terbaru';
        }
    };

    const handleResetFilters = () => {
        setSortField('created_at');
        setSortOrder('desc');
        setSearchQuery('');
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(currentKamar.map(k => k.id));
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

    const handleOpenDialog = async (item?: KamarInap) => {
        if (item) {
            setSelectedKamar(item);
            setFormData({
                title: item.title,
                description: item.description,
                price: item.price.toString(),
                facilities: item.facilities,
                is_recommended: item.is_recommended,
            });
        } else {
            setSelectedKamar(null);
            setFormData({ ...DEFAULT_FORM_DATA });
        }
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setFacilityInput('');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedKamar(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setFacilityInput('');
    };

    const validateForm = () => {
        const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
        let isValid = true;

        if (!formData.title.trim()) {
            errors.title = 'Nama kamar wajib diisi';
            isValid = false;
        }

        if (!formData.description.trim()) {
            errors.description = 'Deskripsi wajib diisi';
            isValid = false;
        }

        if (!formData.price.trim()) {
            errors.price = 'Harga wajib diisi';
            isValid = false;
        } else if (parseFloat(formData.price) <= 0) {
            errors.price = 'Harga harus lebih dari 0';
            isValid = false;
        }

        if (formData.facilities.length === 0) {
            errors.facilities = 'Minimal 1 fasilitas wajib ditambahkan';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setSubmitting(true);

        const loadingToast = toast.loading(
            selectedKamar ? 'Mengupdate kamar...' : 'Menambahkan kamar...'
        );

        try {
            const dataToSubmit = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                facilities: formData.facilities,
                is_recommended: formData.is_recommended,
            };

            if (selectedKamar) {
                const { error } = await supabase
                    .from('kamar_inap')
                    .update(dataToSubmit)
                    .eq('id', selectedKamar.id);

                if (error) throw error;
                toast.success('Kamar berhasil diupdate', { id: loadingToast });
            } else {
                const { error } = await supabase
                    .from('kamar_inap')
                    .insert([dataToSubmit]);

                if (error) throw error;
                toast.success('Kamar berhasil ditambahkan', { id: loadingToast });
            }

            await fetchKamar();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving kamar:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data kamar';
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedKamar) return;
        setSubmitting(true);

        const loadingToast = toast.loading('Menghapus kamar...');

        try {
            const { error } = await supabase
                .from('kamar_inap')
                .delete()
                .eq('id', selectedKamar.id);

            if (error) throw error;

            toast.success('Kamar berhasil dihapus', { id: loadingToast });
            await fetchKamar();
            setDeleteDialogOpen(false);
            setSelectedKamar(null);
        } catch (error) {
            console.error('Error deleting kamar:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus kamar';
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setSubmitting(true);

        const loadingToast = toast.loading(`Menghapus ${selectedIds.size} kamar...`);

        try {
            const idsArray = Array.from(selectedIds);
            const { error } = await supabase
                .from('kamar_inap')
                .delete()
                .in('id', idsArray);

            if (error) throw error;

            setSelectedIds(new Set());
            toast.success(`${idsArray.length} kamar berhasil dihapus`, { id: loadingToast });
            await fetchKamar();
            setBulkDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error bulk deleting kamar:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus kamar';
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteDialog = (item: KamarInap) => {
        setSelectedKamar(item);
        setDeleteDialogOpen(true);
    };

    const handleAddFacility = () => {
        const trimmed = facilityInput.trim();
        if (trimmed && !formData.facilities.includes(trimmed)) {
            setFormData({
                ...formData,
                facilities: [...formData.facilities, trimmed]
            });
            setFacilityInput('');
            if (formErrors.facilities) {
                setFormErrors({ ...formErrors, facilities: '' });
            }
        }
    };

    const handleRemoveFacility = (facility: string) => {
        setFormData({
            ...formData,
            facilities: formData.facilities.filter(f => f !== facility)
        });
    };

    const handleAddCommonFacility = (facility: string) => {
        if (!formData.facilities.includes(facility)) {
            setFormData({
                ...formData,
                facilities: [...formData.facilities, facility]
            });
            if (formErrors.facilities) {
                setFormErrors({ ...formErrors, facilities: '' });
            }
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // ============================================================
    // COMPUTED VALUES
    // ============================================================

    const sortOptions = [
        { value: 'created_at-desc', label: 'Terbaru' },
        { value: 'created_at-asc', label: 'Terlama' },
        { value: 'title-asc', label: 'Nama (A-Z)' },
        { value: 'title-desc', label: 'Nama (Z-A)' },
        { value: 'price-asc', label: 'Harga (Terendah)' },
        { value: 'price-desc', label: 'Harga (Tertinggi)' },
    ];

    const showReset = sortField !== 'created_at' || sortOrder !== 'desc' || searchQuery !== '';
    const totalItems = filteredKamar.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
    const currentKamar = filteredKamar.slice(startIndex, endIndex);
    const isAllSelected = currentKamar.length > 0 && currentKamar.every(k => selectedIds.has(k.id));
    const isSomeSelected = currentKamar.some(k => selectedIds.has(k.id)) && !isAllSelected;

    // ============================================================
    // LOADING STATE
    // ============================================================

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

    // ============================================================
    // RENDER
    // ============================================================

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
                        <BreadcrumbPage>Kamar Inap</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Kamar Inap</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola data kamar inap untuk ditampilkan di website
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
                        Tambah Kamar
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle>Daftar Kamar ({totalItems})</CardTitle>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative grow sm:grow-0 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Cari nama, deskripsi..."
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
                                    Reset Filter
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
                                    <TableHead>Nama Kamar</TableHead>
                                    <TableHead className="max-w-md">Deskripsi</TableHead>
                                    <TableHead className="w-32">Harga</TableHead>
                                    <TableHead className="w-32">Fasilitas</TableHead>
                                    <TableHead className="w-32">Status</TableHead>
                                    <TableHead className="text-right w-32">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentKamar.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
                                            {searchQuery
                                                ? 'Tidak ada data yang sesuai dengan pencarian'
                                                : 'Belum ada data kamar inap'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentKamar.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(item.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectOne(item.id, checked as boolean)
                                                    }
                                                    aria-label={`Select ${item.title}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {startIndex + index + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">{item.title}</TableCell>
                                            <TableCell>
                                                <div className="max-w-md truncate text-sm text-muted-foreground">
                                                    {item.description}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-green-600">
                                                {formatPrice(item.price)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {item.facilities.length} fasilitas
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        item.is_recommended
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border border-gray-300 dark:border-gray-700'
                                                    }
                                                >
                                                    {item.is_recommended ? (
                                                        <>
                                                            Rekomendasi
                                                        </>
                                                    ) : (
                                                        'Standar'
                                                    )}
                                                </Badge>
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
                                                                    onClick={() => handleOpenDeleteDialog(item)}
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedKamar ? 'Edit Kamar Inap' : 'Tambah Kamar Inap'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedKamar
                                ? 'Update informasi kamar inap'
                                : 'Tambah kamar inap baru'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Nama Kamar <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => {
                                        setFormData({ ...formData, title: e.target.value });
                                        if (formErrors.title) {
                                            setFormErrors({ ...formErrors, title: '' });
                                        }
                                    }}
                                    placeholder="Contoh: Suite Room"
                                    disabled={submitting}
                                    className={formErrors.title ? 'border-red-500' : ''}
                                />
                                {formErrors.title && (
                                    <p className="text-sm text-red-500">{formErrors.title}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Deskripsi <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (formErrors.description) {
                                            setFormErrors({ ...formErrors, description: '' });
                                        }
                                    }}
                                    placeholder="Deskripsi kamar..."
                                    disabled={submitting}
                                    className={formErrors.description ? 'border-red-500' : ''}
                                    rows={3}
                                />
                                {formErrors.description && (
                                    <p className="text-sm text-red-500">{formErrors.description}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">
                                    Harga per Malam <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => {
                                            setFormData({ ...formData, price: e.target.value });
                                            if (formErrors.price) {
                                                setFormErrors({ ...formErrors, price: '' });
                                            }
                                        }}
                                        placeholder="1500000"
                                        disabled={submitting}
                                        className={`pl-10 ${formErrors.price ? 'border-red-500' : ''}`}
                                    />
                                </div>
                                {formErrors.price && (
                                    <p className="text-sm text-red-500">{formErrors.price}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    Masukkan harga dalam Rupiah
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>
                                    Fasilitas <span className="text-red-500">*</span>
                                </Label>

                                <div className="p-3 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-2">Fasilitas Umum:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_FACILITIES.map((facility) => (
                                            <Button
                                                key={facility}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleAddCommonFacility(facility)}
                                                disabled={submitting || formData.facilities.includes(facility)}
                                                className={formData.facilities.includes(facility) ? 'opacity-50' : ''}
                                            >
                                                {formData.facilities.includes(facility) && '✓ '}
                                                {facility}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        value={facilityInput}
                                        onChange={(e) => setFacilityInput(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddFacility();
                                            }
                                        }}
                                        placeholder="Tambah fasilitas custom..."
                                        disabled={submitting}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleAddFacility}
                                        disabled={submitting || !facilityInput.trim()}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {formData.facilities.length > 0 && (
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                        {formData.facilities.map((facility) => (
                                            <Badge
                                                key={facility}
                                                variant="secondary"
                                                className="px-3 py-1"
                                            >
                                                {facility}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFacility(facility)}
                                                    disabled={submitting}
                                                    className="ml-2 hover:text-red-500"
                                                >
                                                    ×
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {formErrors.facilities && (
                                    <p className="text-sm text-red-500">{formErrors.facilities}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_recommended" className="text-base cursor-pointer">
                                        Tandai sebagai Rekomendasi
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Kamar ini akan ditampilkan sebagai pilihan unggulan
                                    </p>
                                </div>
                                <Checkbox
                                    id="is_recommended"
                                    checked={formData.is_recommended}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_recommended: checked as boolean })
                                    }
                                    disabled={submitting}
                                />
                            </div>
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
                        <AlertDialogTitle>Hapus Kamar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus kamar{' '}
                            <strong>{selectedKamar?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
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
                        <AlertDialogTitle>Hapus {selectedIds.size} Kamar?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus {selectedIds.size} kamar yang dipilih?
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