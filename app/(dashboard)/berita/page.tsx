// app/(dashboard)/berita/page.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BeritaWithAuthor, BeritaStatus } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Loader2, Search, RefreshCw, ArrowUpDown, X, Eye, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import ReactMarkdown from 'react-markdown';
import { uploadFile, deleteFile, getFilePathFromUrl } from '@/lib/upload';
import { validateImage } from '@/lib/validasi/validasiImage';

type SortField = 'title' | 'category' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface FormDataType {
    title: string;
    description: string;
    category: string;
    tags: string[];
    thumbnail: string;
    status: BeritaStatus;
    thumbnailFile: File | null;
    thumbnailDeleted: boolean;
}

interface FormErrorsType {
    title: string;
    description: string;
    category: string;
    tags: string;
    thumbnail: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
    title: '',
    description: '',
    category: '',
    tags: [],
    thumbnail: '',
    status: 'active',
    thumbnailFile: null,
    thumbnailDeleted: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
    title: '',
    description: '',
    category: '',
    tags: '',
    thumbnail: '',
};

const STATUS_OPTIONS: { value: BeritaStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Aktif', color: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700' },
    { value: 'non_active', label: 'Tidak Aktif', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700' },
    { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700' },
];

const CATEGORY_OPTIONS = [
    'Berita',
    'Pengumuman',
    'Artikel',
    'Teknologi',
    'Kesehatan',
    'Pendidikan',
    'Olahraga',
    'Hiburan',
    'Lainnya',
];

const COMMON_TAGS = [
    'Rumah Sakit',
    'Kesehatan',
    'Pelayanan',
    'Fasilitas',
    'Dokter',
    'Pasien',
    'Medis',
    'Pengobatan',
    'Konsultasi',
    'Emergency',
    'IGD',
    'Rawat Inap',
    'Rawat Jalan',
    'Laboratorium',
    'Radiologi',
    'Apotek',
];

export default function BeritaPage() {
    const [berita, setBerita] = useState<BeritaWithAuthor[]>([]);
    const [filteredBerita, setFilteredBerita] = useState<BeritaWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedBerita, setSelectedBerita] = useState<BeritaWithAuthor | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [statusFilter, setStatusFilter] = useState<BeritaStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
    const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const generateSlug = (title: string): string => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const applyFilters = useCallback(() => {
        let filtered = [...berita];

        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            filtered = filtered.filter(b =>
                b.title.toLowerCase().includes(query) ||
                b.description.toLowerCase().includes(query) ||
                b.category.toLowerCase().includes(query) ||
                b.tags.some(t => t.toLowerCase().includes(query)) ||
                b.author_detail?.nama.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(b => b.status === statusFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(b => b.category === categoryFilter);
        }

        filtered.sort((a, b) => {
            let compareValue = 0;

            if (sortField === 'title') {
                compareValue = a.title.localeCompare(b.title, 'id');
            } else if (sortField === 'category') {
                compareValue = a.category.localeCompare(b.category, 'id');
            } else if (sortField === 'status') {
                compareValue = a.status.localeCompare(b.status);
            } else if (sortField === 'created_at') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                compareValue = dateA - dateB;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setFilteredBerita(filtered);
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [debouncedSearch, berita, sortField, sortOrder, statusFilter, categoryFilter]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const fetchBerita = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('berita')
                .select(`
                    *,
                    author_detail:users!berita_author_fkey (
                        id,
                        nama,
                        username,
                        avatar
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setBerita(data || []);
        } catch (error) {
            console.error('Error fetching berita:', error);
            toast.error('Gagal memuat data berita');
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

                setCurrentUserId(currentUser.id);
                await fetchBerita();
            } finally {
                setLoading(false);
            }
        };

        loadInitial();

        const channel = supabase
            .channel('berita_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'berita' },
                () => {
                    fetchBerita();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchBerita]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const loadingToast = toast.loading('Memperbarui data...');

        try {
            await fetchBerita();
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
        const labels: Record<SortField, string> = {
            title: sortOrder === 'asc' ? 'Judul (A-Z)' : 'Judul (Z-A)',
            category: sortOrder === 'asc' ? 'Kategori (A-Z)' : 'Kategori (Z-A)',
            status: sortOrder === 'asc' ? 'Status (A-Z)' : 'Status (Z-A)',
            created_at: sortOrder === 'asc' ? 'Terlama' : 'Terbaru',
        };
        return labels[sortField];
    };

    const handleResetFilters = () => {
        setSortField('created_at');
        setSortOrder('desc');
        setSearchQuery('');
        setStatusFilter('all');
        setCategoryFilter('all');
    };

    const totalItems = filteredBerita.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
    const currentBerita = filteredBerita.slice(startIndex, endIndex);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(currentBerita.map(b => b.id));
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

    const isAllSelected = currentBerita.length > 0 &&
        currentBerita.every(b => selectedIds.has(b.id));

    const isSomeSelected = currentBerita.some(b => selectedIds.has(b.id)) && !isAllSelected;

    const handleOpenDialog = (item?: BeritaWithAuthor) => {
        if (item) {
            setSelectedBerita(item);
            setFormData({
                title: item.title,
                description: item.description,
                category: item.category,
                tags: item.tags || [],
                thumbnail: item.thumbnail || '',
                status: item.status,
                thumbnailFile: null,
                thumbnailDeleted: false,
            });
        } else {
            setSelectedBerita(null);
            setFormData({ ...DEFAULT_FORM_DATA });
        }
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setTagInput('');
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedBerita(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setTagInput('');

        const input = document.getElementById('thumbnail-upload') as HTMLInputElement;
        if (input) input.value = '';
    };

    const handleAddTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !formData.tags.includes(trimmed)) {
            setFormData({
                ...formData,
                tags: [...formData.tags, trimmed]
            });
            setTagInput('');
            if (formErrors.tags) {
                setFormErrors({ ...formErrors, tags: '' });
            }
        }
    };

    const handleRemoveTag = (tag: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(t => t !== tag)
        });
    };

    const handleAddCommonTag = (tag: string) => {
        if (!formData.tags.includes(tag)) {
            setFormData({
                ...formData,
                tags: [...formData.tags, tag]
            });
            if (formErrors.tags) {
                setFormErrors({ ...formErrors, tags: '' });
            }
        }
    };

    const validateForm = async () => {
        const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
        let isValid = true;

        if (!formData.title.trim()) {
            errors.title = 'Judul wajib diisi';
            isValid = false;
        }

        const generatedSlug = generateSlug(formData.title);
        if (generatedSlug) {
            try {
                const { data, error } = await supabase
                    .from('berita')
                    .select('id')
                    .eq('slug', generatedSlug);

                if (error) {
                    console.error('Error checking slug:', error);
                }

                if (data && data.length > 0) {
                    const existingItem = data[0];
                    if (!selectedBerita || existingItem.id !== selectedBerita.id) {
                        errors.title = 'Judul menghasilkan slug yang sudah digunakan. Gunakan judul yang berbeda.';
                        isValid = false;
                    }
                }
            } catch (error) {
                console.error('Error validating slug:', error);
            }
        }

        if (!formData.description.trim()) {
            errors.description = 'Konten wajib diisi';
            isValid = false;
        }

        if (!formData.category.trim()) {
            errors.category = 'Kategori wajib dipilih';
            isValid = false;
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!await validateForm()) {
            return;
        }

        setSubmitting(true);

        const loadingToast = toast.loading(
            selectedBerita ? 'Mengupdate berita...' : 'Menambahkan berita...'
        );

        let newUploadedPath: string | null = null;

        try {
            let finalThumbnailUrl: string | null = null;

            if (formData.thumbnailFile) {
                const uploadResult = await uploadFile({
                    bucket: 'berita-thumbnails',
                    folder: currentUserId,
                    file: formData.thumbnailFile,
                });

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'Gagal mengupload thumbnail');
                }

                finalThumbnailUrl = uploadResult.url || null;
                newUploadedPath = uploadResult.path || null;
            } else if (formData.thumbnailDeleted) {
                finalThumbnailUrl = null;
            } else {
                finalThumbnailUrl = selectedBerita?.thumbnail || null;
            }

            const generatedSlug = generateSlug(formData.title);

            const dataToSubmit = {
                title: formData.title,
                slug: generatedSlug,
                description: formData.description,
                category: formData.category,
                tags: formData.tags,
                thumbnail: finalThumbnailUrl,
                status: selectedBerita ? formData.status : 'active',
                author: selectedBerita ? selectedBerita.author : currentUserId,
            };

            if (selectedBerita) {
                if (!selectedBerita.id) {
                    throw new Error('ID berita tidak valid');
                }

                const { data, error } = await supabase
                    .from('berita')
                    .update(dataToSubmit)
                    .eq('id', selectedBerita.id)
                    .select();

                if (error) {
                    throw new Error(`Gagal update: ${error.message}`);
                }

                if (!data || data.length === 0) {
                    throw new Error('Data tidak ditemukan atau tidak berhasil diupdate');
                }
            } else {
                const { data, error } = await supabase
                    .from('berita')
                    .insert([dataToSubmit])
                    .select();

                if (error) {
                    throw new Error(`Gagal insert: ${error.message}`);
                }

                if (!data || data.length === 0) {
                    throw new Error('Data tidak berhasil ditambahkan');
                }
            }

            if (selectedBerita?.thumbnail && (formData.thumbnailFile || formData.thumbnailDeleted)) {
                const oldPath = getFilePathFromUrl(selectedBerita.thumbnail, 'berita-thumbnails');
                if (oldPath) {
                    await deleteFile('berita-thumbnails', oldPath);
                }
            }

            toast.success(
                selectedBerita ? 'Berita berhasil diupdate' : 'Berita berhasil ditambahkan',
                { id: loadingToast }
            );

            await fetchBerita();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving berita:', error);

            if (newUploadedPath) {
                await deleteFile('berita-thumbnails', newUploadedPath);
            }

            const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data berita';
            toast.error(errorMessage, {
                id: loadingToast
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedBerita) return;
        setSubmitting(true);

        const loadingToast = toast.loading('Menghapus berita...');

        try {
            if (selectedBerita.thumbnail) {
                const path = getFilePathFromUrl(selectedBerita.thumbnail, 'berita-thumbnails');
                if (path) {
                    await deleteFile('berita-thumbnails', path);
                }
            }

            const { error } = await supabase
                .from('berita')
                .delete()
                .eq('id', selectedBerita.id);

            if (error) throw error;

            toast.success('Berita berhasil dihapus', {
                id: loadingToast
            });
            await fetchBerita();
            setDeleteDialogOpen(false);
            setSelectedBerita(null);
        } catch (error) {
            console.error('Error deleting berita:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus berita';
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

        const loadingToast = toast.loading(`Menghapus ${selectedIds.size} berita...`);

        try {
            const idsArray = Array.from(selectedIds);

            for (const id of idsArray) {
                const item = berita.find(b => b.id === id);
                if (item?.thumbnail) {
                    const path = getFilePathFromUrl(item.thumbnail, 'berita-thumbnails');
                    if (path) {
                        await deleteFile('berita-thumbnails', path);
                    }
                }
            }

            const { error } = await supabase
                .from('berita')
                .delete()
                .in('id', idsArray);

            if (error) throw error;

            setSelectedIds(new Set());

            toast.success(`${idsArray.length} berita berhasil dihapus`, {
                id: loadingToast
            });
            await fetchBerita();
            setBulkDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error bulk deleting berita:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus berita';
            toast.error(errorMessage, {
                id: loadingToast
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteDialog = (item: BeritaWithAuthor) => {
        setSelectedBerita(item);
        setDeleteDialogOpen(true);
    };

    const handleOpenPreview = (item: BeritaWithAuthor) => {
        setSelectedBerita(item);
        setPreviewDialogOpen(true);
    };

    const getStatusBadge = (status: BeritaStatus) => {
        const option = STATUS_OPTIONS.find(opt => opt.value === status);
        return (
            <Badge className={`${option?.color} text-white`}>
                {option?.label}
            </Badge>
        );
    };

    const sortOptions = [
        { value: 'created_at-desc', label: 'Terbaru' },
        { value: 'created_at-asc', label: 'Terlama' },
        { value: 'title-asc', label: 'Judul (A-Z)' },
        { value: 'title-desc', label: 'Judul (Z-A)' },
        { value: 'category-asc', label: 'Kategori (A-Z)' },
        { value: 'category-desc', label: 'Kategori (Z-A)' },
    ];

    const showReset = sortField !== 'created_at' || sortOrder !== 'desc' ||
        searchQuery !== '' || statusFilter !== 'all' ||
        categoryFilter !== 'all';

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
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Berita</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Manajemen Berita</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola berita dan artikel untuk website
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
                        Tambah Berita
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle>Daftar Berita ({totalItems})</CardTitle>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative grow sm:grow-0 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Cari judul, kategori, tags..."
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

                        <div className="flex flex-wrap gap-3">
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BeritaStatus | 'all')}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {CATEGORY_OPTIONS.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

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
                                <Button
                                    variant="outline"
                                    onClick={handleResetFilters}
                                >
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
                                    <TableHead>Judul</TableHead>
                                    <TableHead>Kategori</TableHead>
                                    <TableHead>Tags</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Penulis</TableHead>
                                    <TableHead className="w-[180px]">Dibuat</TableHead>
                                    <TableHead className="text-right w-40">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentBerita.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground h-32">
                                            {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                                                ? 'Tidak ada data yang sesuai dengan filter'
                                                : 'Belum ada data berita'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentBerita.map((item, index) => (
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
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p className="font-medium truncate">{item.title}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        {item.slug}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.tags && item.tags.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {item.tags.slice(0, 2).map((tag, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                        {item.tags.length > 2 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{item.tags.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Tidak ada tags</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage
                                                            src={item.author_detail?.avatar}
                                                            alt={item.author_detail?.nama || 'User'}
                                                        />
                                                        <AvatarFallback className="text-xs">
                                                            {item.author_detail?.nama?.charAt(0).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm truncate max-w-[120px]">
                                                        {item.author_detail?.nama}
                                                    </span>
                                                </div>
                                            </TableCell>
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
                                                                    onClick={() => handleOpenPreview(item)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Preview</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
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

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedBerita ? 'Edit Berita' : 'Tambah Berita'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedBerita
                                ? 'Update informasi berita'
                                : 'Tambah berita baru ke website'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Thumbnail</Label>

                            {selectedBerita?.thumbnail && !formData.thumbnailFile && !formData.thumbnailDeleted && (
                                <div className="space-y-2">
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                                        <Image
                                            src={selectedBerita.thumbnail}
                                            alt="Current thumbnail"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    thumbnailDeleted: true,
                                                });
                                            }}
                                            disabled={submitting}
                                            className="w-full sm:w-auto"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Hapus & Upload Baru
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Thumbnail saat ini. Klik tombol di atas untuk menggantinya.
                                    </p>
                                </div>
                            )}

                            {(!selectedBerita?.thumbnail || formData.thumbnailDeleted || formData.thumbnailFile) && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor="thumbnail-upload"
                                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                                        >
                                            {formData.thumbnailFile ? (
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={URL.createObjectURL(formData.thumbnailFile)}
                                                        alt="Preview"
                                                        fill
                                                        className="object-cover rounded-lg"
                                                        unoptimized
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="absolute top-2 right-2"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setFormData({
                                                                ...formData,
                                                                thumbnailFile: null,
                                                                thumbnailDeleted: false,
                                                            });
                                                            const input = document.getElementById('thumbnail-upload') as HTMLInputElement;
                                                            if (input) input.value = '';
                                                        }}
                                                        disabled={submitting}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg
                                                        className="w-10 h-10 mb-3 text-muted-foreground"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                                        />
                                                    </svg>
                                                    <p className="mb-2 text-sm text-muted-foreground">
                                                        <span className="font-semibold">Klik untuk upload</span> atau drag and drop
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        PNG, JPG, JPEG, WebP (MAX. 5MB)
                                                    </p>
                                                </div>
                                            )}
                                            <Input
                                                id="thumbnail-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                disabled={submitting}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const validationResult = validateImage(file);
                                                        if (!validationResult.valid) {
                                                            toast.error(validationResult.error || 'File tidak valid');
                                                            e.target.value = '';
                                                            return;
                                                        }

                                                        setFormData({
                                                            ...formData,
                                                            thumbnailFile: file,
                                                            thumbnailDeleted: false,
                                                        });

                                                        toast.success('Gambar siap untuk diupload!');
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {formData.thumbnailFile && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                    ✓ {formData.thumbnailFile.name}
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    {(formData.thumbnailFile.size / 1024 / 1024).toFixed(2)} MB - Siap diupload
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground">
                                Format: JPG, JPEG, PNG, WebP. Maksimal 5MB
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="title">
                                Judul <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => {
                                    setFormData({
                                        ...formData,
                                        title: e.target.value
                                    });
                                    if (formErrors.title) {
                                        setFormErrors({ ...formErrors, title: '' });
                                    }
                                }}
                                placeholder="Masukkan judul berita"
                                disabled={submitting}
                                className={formErrors.title ? 'border-red-500' : ''}
                            />
                            {formErrors.title && (
                                <p className="text-sm text-red-500">{formErrors.title}</p>
                            )}
                            {formData.title && (
                                <p className="text-xs text-muted-foreground">
                                    URL: <span className="font-mono">{generateSlug(formData.title)}</span>
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">
                                Kategori <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, category: value });
                                    if (formErrors.category) {
                                        setFormErrors({ ...formErrors, category: '' });
                                    }
                                }}
                                disabled={submitting}
                            >
                                <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORY_OPTIONS.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {formErrors.category && (
                                <p className="text-sm text-red-500">{formErrors.category}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>

                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm font-medium mb-2">Tags Umum:</p>
                                <div className="flex flex-wrap gap-2">
                                    {COMMON_TAGS.map((tag) => (
                                        <Button
                                            key={tag}
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddCommonTag(tag)}
                                            disabled={submitting || formData.tags.includes(tag)}
                                            className={formData.tags.includes(tag) ? 'opacity-50' : ''}
                                        >
                                            {formData.tags.includes(tag) && '✓ '}
                                            {tag}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddTag();
                                        }
                                    }}
                                    placeholder="Tambah tag custom..."
                                    disabled={submitting}
                                />
                                <Button
                                    type="button"
                                    onClick={handleAddTag}
                                    disabled={submitting || !tagInput.trim()}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {formData.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                    {formData.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="px-3 py-1"
                                        >
                                            <Tag className="h-3 w-3 mr-1" />
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTag(tag)}
                                                disabled={submitting}
                                                className="ml-2 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {formErrors.tags && (
                                <p className="text-sm text-red-500">{formErrors.tags}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Konten (Markdown) <span className="text-red-500">*</span>
                            </Label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => {
                                    setFormData({ ...formData, description: e.target.value });
                                    if (formErrors.description) {
                                        setFormErrors({ ...formErrors, description: '' });
                                    }
                                }}
                                disabled={submitting}
                                placeholder="Tulis konten berita dalam format Markdown..."
                                className={`w-full min-h-[400px] p-3 rounded-md border ${formErrors.description ? 'border-red-500' : 'border-input'
                                    } bg-background resize-y font-mono text-sm`}
                            />
                            {formErrors.description && (
                                <p className="text-sm text-red-500">{formErrors.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Gunakan format Markdown untuk styling teks
                            </p>
                        </div>

                        {selectedBerita && (
                            <div className="space-y-2">
                                <Label htmlFor="status">
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, status: value as BeritaStatus });
                                    }}
                                    disabled={submitting}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

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

            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview Berita</DialogTitle>
                    </DialogHeader>
                    {selectedBerita && (
                        <div className="space-y-4">
                            {selectedBerita.thumbnail && (
                                <div className="relative w-full h-64">
                                    <Image
                                        src={selectedBerita.thumbnail}
                                        alt={selectedBerita.title}
                                        fill
                                        className="object-cover rounded-lg"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                                        priority
                                        unoptimized
                                    />
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold">{selectedBerita.title}</h2>
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    <Badge variant="outline">{selectedBerita.category}</Badge>
                                    {getStatusBadge(selectedBerita.status)}
                                    {selectedBerita.tags && selectedBerita.tags.length > 0 && (
                                        <>
                                            {selectedBerita.tags.map((tag, idx) => (
                                                <Badge key={idx} variant="secondary">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage
                                            src={selectedBerita.author_detail?.avatar}
                                            alt={selectedBerita.author_detail?.nama || 'User'}
                                        />
                                        <AvatarFallback className="text-xs">
                                            {selectedBerita.author_detail?.nama?.charAt(0).toUpperCase() || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span>
                                        Oleh {selectedBerita.author_detail?.nama} • {formatDateTime(selectedBerita.created_at)}
                                    </span>
                                </div>
                            </div>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{selectedBerita.description}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Berita?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus berita{' '}
                            <strong>{selectedBerita?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
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

            <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {selectedIds.size} Berita?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus {selectedIds.size} berita yang dipilih?
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

            <AccessDeniedDialog
                open={showAccessDenied}
                onOpenChange={setShowAccessDenied}
            />
        </div>
    );
}