// app/(dashboard)/berita/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { BeritaWithAuthor, BeritaStatus } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownEditor } from '@/components/ui/custom/markdown-editor';
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
import { Plus, Pencil, Trash2, Loader2, Search, RefreshCw, ArrowUpDown, X, Eye } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ui/custom/image-upload';
import ReactMarkdown from 'react-markdown';
import { uploadFile, deleteFile, getFilePathFromUrl } from '@/lib/upload';

type SortField = 'title' | 'category' | 'status' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface FormDataType {
    title: string;
    slug: string;
    description: string;
    category: string;
    thumbnail: string;
    status: BeritaStatus;
    thumbnailFile: File | null;
    thumbnailPreview: string | null;
    thumbnailDeleted: boolean; // Flag untuk menandai thumbnail dihapus
}

interface FormErrorsType {
    title: string;
    slug: string;
    description: string;
    category: string;
    thumbnail: string;
    status: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
    title: '',
    slug: '',
    description: '',
    category: '',
    thumbnail: '',
    status: 'draft',
    thumbnailFile: null,
    thumbnailPreview: null,
    thumbnailDeleted: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
    title: '',
    slug: '',
    description: '',
    category: '',
    thumbnail: '',
    status: '',
};

const STATUS_OPTIONS: { value: BeritaStatus; label: string; color: string }[] = [
    { value: 'active', label: 'Aktif', color: 'bg-green-500' },
    { value: 'non_active', label: 'Tidak Aktif', color: 'bg-gray-500' },
    { value: 'draft', label: 'Draft', color: 'bg-yellow-500' },
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
                slug: item.slug,
                description: item.description,
                category: item.category,
                thumbnail: item.thumbnail || '',
                status: item.status,
                thumbnailFile: null,
                thumbnailPreview: item.thumbnail || null,
                thumbnailDeleted: false,
            });
        } else {
            setSelectedBerita(null);
            setFormData({ ...DEFAULT_FORM_DATA });
        }
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedBerita(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
    };

    const validateForm = async () => {
        const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
        let isValid = true;

        if (!formData.title.trim()) {
            errors.title = 'Judul wajib diisi';
            isValid = false;
        }

        if (!formData.slug.trim()) {
            errors.slug = 'Slug wajib diisi';
            isValid = false;
        } else {
            // Check if slug already exists (except current item)
            try {
                const { data, error } = await supabase
                    .from('berita')
                    .select('id')
                    .eq('slug', formData.slug);

                if (error) {
                    console.error('Error checking slug:', error);
                }

                // Check if slug exists and belongs to different item
                if (data && data.length > 0) {
                    const existingItem = data[0];
                    if (!selectedBerita || existingItem.id !== selectedBerita.id) {
                        errors.slug = 'Slug sudah digunakan';
                        isValid = false;
                    }
                }
            } catch (error) {
                console.error('Error validating slug:', error);
            }
        }

        if (!formData.description.trim()) {
            errors.description = 'Deskripsi wajib diisi';
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

        try {
            let thumbnailUrl: string | null = null;

            // Logika pengelolaan thumbnail
            if (formData.thumbnailFile) {
                // CASE 1: Ada file baru yang akan diupload
                console.log('Case 1: Uploading new file');

                // Delete old thumbnail if exists (untuk update)
                if (selectedBerita?.thumbnail) {
                    const oldPath = getFilePathFromUrl(selectedBerita.thumbnail, 'berita-thumbnails');
                    if (oldPath) {
                        console.log('Deleting old thumbnail:', oldPath);
                        await deleteFile('berita-thumbnails', oldPath);
                    }
                }

                // Upload new thumbnail
                console.log('Uploading new thumbnail...');
                const uploadResult = await uploadFile({
                    bucket: 'berita-thumbnails',
                    folder: currentUserId,
                    file: formData.thumbnailFile,
                    maxSizeInMB: 5,
                });

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'Gagal mengupload thumbnail');
                }

                thumbnailUrl = uploadResult.url || null;
                console.log('Upload success:', thumbnailUrl);
            } else if (formData.thumbnailDeleted) {
                // CASE 2: User menghapus thumbnail (klik X)
                console.log('Case 2: Thumbnail deleted by user');

                // Hapus thumbnail lama dari storage
                if (selectedBerita?.thumbnail) {
                    const oldPath = getFilePathFromUrl(selectedBerita.thumbnail, 'berita-thumbnails');
                    if (oldPath) {
                        console.log('Deleting thumbnail:', oldPath);
                        await deleteFile('berita-thumbnails', oldPath);
                    }
                }
                thumbnailUrl = null;
            } else if (selectedBerita?.thumbnail) {
                // CASE 3: Edit mode - thumbnail tidak berubah, pakai yang lama
                console.log('Case 3: Using existing thumbnail from database');
                thumbnailUrl = selectedBerita.thumbnail;
            } else {
                // CASE 4: Tidak ada thumbnail sama sekali
                console.log('Case 4: No thumbnail');
                thumbnailUrl = null;
            }

            const dataToSubmit = {
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                category: formData.category,
                thumbnail: thumbnailUrl,
                status: formData.status,
                author: selectedBerita ? selectedBerita.author : currentUserId,
            };

            console.log('Data to submit:', dataToSubmit);

            if (selectedBerita) {
                const { error } = await supabase
                    .from('berita')
                    .update(dataToSubmit)
                    .eq('id', selectedBerita.id);

                if (error) {
                    console.error('Supabase update error:', error);
                    throw error;
                }

                toast.success('Berita berhasil diupdate', {
                    id: loadingToast
                });
            } else {
                const { error } = await supabase
                    .from('berita')
                    .insert([dataToSubmit]);

                if (error) {
                    console.error('Supabase insert error:', error);
                    throw error;
                }

                toast.success('Berita berhasil ditambahkan', {
                    id: loadingToast
                });
            }

            await fetchBerita();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving berita:', error);
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
            // Delete thumbnail if exists
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

            // Delete thumbnails
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
                                        placeholder="Cari judul, kategori..."
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
                                    <TableHead>Status</TableHead>
                                    <TableHead>Penulis</TableHead>
                                    <TableHead className="w-[180px]">Dibuat</TableHead>
                                    <TableHead className="text-right w-40">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentBerita.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
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
                                                {getStatusBadge(item.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {item.author_detail?.avatar && (
                                                        <Image
                                                            src={item.author_detail.avatar}
                                                            alt={item.author_detail.nama || 'Avatar'}
                                                            width={24}
                                                            height={24}
                                                            className="w-6 h-6 rounded-full object-cover"
                                                            unoptimized
                                                        />
                                                    )}
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
                                : 'Tambah berita baru'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                                <TabsTrigger value="content">Konten</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">
                                        Judul <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => {
                                            const newTitle = e.target.value;
                                            setFormData({
                                                ...formData,
                                                title: newTitle,
                                                slug: generateSlug(newTitle)
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
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="slug">
                                        Slug <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => {
                                            setFormData({ ...formData, slug: e.target.value });
                                            if (formErrors.slug) {
                                                setFormErrors({ ...formErrors, slug: '' });
                                            }
                                        }}
                                        placeholder="url-friendly-slug"
                                        disabled={submitting}
                                        className={formErrors.slug ? 'border-red-500' : ''}
                                    />
                                    {formErrors.slug && (
                                        <p className="text-sm text-red-500">{formErrors.slug}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        URL yang akan digunakan untuk mengakses berita ini
                                    </p>
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
                                    <ImageUpload
                                        label="Thumbnail"
                                        value={formData.thumbnailPreview || ''}
                                        onChange={(file, previewUrl) => {
                                            console.log('ImageUpload onChange called', { file: file?.name, previewUrl: previewUrl?.substring(0, 50) });
                                            if (file) {
                                                // User memilih file baru - HANYA SIMPAN DI STATE, TIDAK UPLOAD
                                                setFormData({
                                                    ...formData,
                                                    thumbnailFile: file,
                                                    thumbnailPreview: previewUrl,
                                                    thumbnailDeleted: false,
                                                });
                                            } else {
                                                // User menghapus gambar (klik X) - HANYA SET FLAG, TIDAK HAPUS FILE
                                                setFormData({
                                                    ...formData,
                                                    thumbnailFile: null,
                                                    thumbnailPreview: null,
                                                    thumbnailDeleted: true,
                                                });
                                            }
                                        }}
                                        disabled={submitting}
                                        maxSizeInMB={5}
                                    />
                                </div>

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
                            </TabsContent>

                            <TabsContent value="content" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Konten (Markdown) <span className="text-red-500">*</span>
                                    </Label>
                                    <MarkdownEditor
                                        value={formData.description}
                                        onChange={(value) => {
                                            setFormData({ ...formData, description: value });
                                            if (formErrors.description) {
                                                setFormErrors({ ...formErrors, description: '' });
                                            }
                                        }}
                                        disabled={submitting}
                                        placeholder="Tulis konten berita dalam format Markdown..."
                                        className={formErrors.description ? 'border-red-500' : ''}
                                    />
                                    {formErrors.description && (
                                        <p className="text-sm text-red-500">{formErrors.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Gunakan toolbar di atas untuk format teks atau tulis Markdown manual
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                        <DialogFooter className="mt-6">
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
                                <div className="flex gap-2 mt-2">
                                    <Badge variant="outline">{selectedBerita.category}</Badge>
                                    {getStatusBadge(selectedBerita.status)}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Oleh {selectedBerita.author_detail?.nama} • {formatDateTime(selectedBerita.created_at)}
                                </p>
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