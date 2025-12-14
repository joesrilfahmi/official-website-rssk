'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { PromoWithCreator, PromoStatus } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Download from 'yet-another-react-lightbox/plugins/download';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Plus, Pencil, Trash2, Loader2, Search, RefreshCw, X, Expand } from 'lucide-react';
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
import { AccessDeniedDialog } from '@/components/access-denied-dialog';
import { getCurrentUser } from '@/lib/auth';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { uploadFile, deleteFile, getFilePathFromUrl } from '@/lib/upload';
import { validateImage } from '@/lib/validasi/validasiImage';

interface FormDataType {
    title: string;
    description: string;
    picture: string;
    status: PromoStatus;
    pictureFile: File | null;
    pictureDeleted: boolean;
}

interface FormErrorsType {
    title: string;
    description: string;
    picture: string;
}

const DEFAULT_FORM_DATA: FormDataType = {
    title: '',
    description: '',
    picture: '',
    status: 'active',
    pictureFile: null,
    pictureDeleted: false,
};

const DEFAULT_FORM_ERRORS: FormErrorsType = {
    title: '',
    description: '',
    picture: '',
};

const STATUS_CONFIG = {
    active: {
        label: 'Aktif',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700'
    },
    non_active: {
        label: 'Tidak Aktif',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700'
    },
};

const STATUS_OPTIONS: { value: PromoStatus; label: string }[] = [
    { value: 'active', label: 'Aktif' },
    { value: 'non_active', label: 'Tidak Aktif' },
];

export default function PromoPage() {
    const [promos, setPromos] = useState<PromoWithCreator[]>([]);
    const [filteredPromos, setFilteredPromos] = useState<PromoWithCreator[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedPromo, setSelectedPromo] = useState<PromoWithCreator | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const [formData, setFormData] = useState<FormDataType>(DEFAULT_FORM_DATA);
    const [formErrors, setFormErrors] = useState<FormErrorsType>(DEFAULT_FORM_ERRORS);

    const applyFilters = useCallback(() => {
        let filtered = [...promos];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
        });

        setFilteredPromos(filtered);
    }, [searchQuery, promos]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const fetchPromos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('promo')
                .select(`
                    *,
                    created_by_user:users!promo_created_by_fkey (
                        id,
                        nama,
                        username,
                        avatar
                    ),
                    updated_by_user:users!promo_updated_by_fkey (
                        id,
                        nama,
                        username,
                        avatar
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPromos(data || []);
        } catch (error) {
            console.error('Error fetching promos:', error);
            toast.error('Gagal memuat data promo');
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
                await fetchPromos();
            } finally {
                setLoading(false);
            }
        };

        loadInitial();

        const channel = supabase
            .channel('promo_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'promo' },
                () => {
                    fetchPromos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPromos]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const loadingToast = toast.loading('Memperbarui data...');

        try {
            await fetchPromos();
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

    const handleOpenDialog = (item?: PromoWithCreator) => {
        if (item) {
            setSelectedPromo(item);
            setFormData({
                title: item.title,
                description: item.description,
                picture: item.picture || '',
                status: item.status,
                pictureFile: null,
                pictureDeleted: false,
            });
        } else {
            setSelectedPromo(null);
            setFormData({ ...DEFAULT_FORM_DATA });
        }
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedPromo(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormErrors({ ...DEFAULT_FORM_ERRORS });

        const input = document.getElementById('picture-upload') as HTMLInputElement;
        if (input) input.value = '';
    };

    const validateForm = () => {
        const errors: FormErrorsType = { ...DEFAULT_FORM_ERRORS };
        let isValid = true;

        if (!formData.title.trim()) {
            errors.title = 'Judul wajib diisi';
            isValid = false;
        }

        if (!formData.description.trim()) {
            errors.description = 'Deskripsi wajib diisi';
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
            selectedPromo ? 'Mengupdate promo...' : 'Menambahkan promo...'
        );

        let newUploadedPath: string | null = null;

        try {
            let finalPictureUrl: string | null = null;

            if (formData.pictureFile) {
                const uploadResult = await uploadFile({
                    bucket: 'promo-pictures',
                    folder: currentUserId,
                    file: formData.pictureFile,
                });

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'Gagal mengupload gambar');
                }

                finalPictureUrl = uploadResult.url || null;
                newUploadedPath = uploadResult.path || null;
            } else if (formData.pictureDeleted) {
                finalPictureUrl = null;
            } else {
                finalPictureUrl = selectedPromo?.picture || null;
            }

            const dataToSubmit = {
                title: formData.title,
                description: formData.description,
                picture: finalPictureUrl,
                status: formData.status,
                created_by: selectedPromo ? selectedPromo.created_by : currentUserId,
                updated_by: currentUserId,
            };

            if (selectedPromo) {
                if (!selectedPromo.id) {
                    throw new Error('ID promo tidak valid');
                }

                const { data, error } = await supabase
                    .from('promo')
                    .update(dataToSubmit)
                    .eq('id', selectedPromo.id)
                    .select();

                if (error) {
                    throw new Error(`Gagal update: ${error.message}`);
                }

                if (!data || data.length === 0) {
                    throw new Error('Data tidak ditemukan atau tidak berhasil diupdate');
                }
            } else {
                const { data, error } = await supabase
                    .from('promo')
                    .insert([dataToSubmit])
                    .select();

                if (error) {
                    throw new Error(`Gagal insert: ${error.message}`);
                }

                if (!data || data.length === 0) {
                    throw new Error('Data tidak berhasil ditambahkan');
                }
            }

            if (selectedPromo?.picture && (formData.pictureFile || formData.pictureDeleted)) {
                const oldPath = getFilePathFromUrl(selectedPromo.picture, 'promo-pictures');
                if (oldPath) {
                    await deleteFile('promo-pictures', oldPath);
                }
            }

            toast.success(
                selectedPromo ? 'Promo berhasil diupdate' : 'Promo berhasil ditambahkan',
                { id: loadingToast }
            );

            await fetchPromos();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving promo:', error);

            if (newUploadedPath) {
                await deleteFile('promo-pictures', newUploadedPath);
            }

            const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data promo';
            toast.error(errorMessage, {
                id: loadingToast
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedPromo) return;
        setSubmitting(true);

        const loadingToast = toast.loading('Menghapus promo...');

        try {
            if (selectedPromo.picture) {
                const path = getFilePathFromUrl(selectedPromo.picture, 'promo-pictures');
                if (path) {
                    await deleteFile('promo-pictures', path);
                }
            }

            const { error } = await supabase
                .from('promo')
                .delete()
                .eq('id', selectedPromo.id);

            if (error) throw error;

            toast.success('Promo berhasil dihapus', {
                id: loadingToast
            });
            await fetchPromos();
            setDeleteDialogOpen(false);
            setSelectedPromo(null);
        } catch (error) {
            console.error('Error deleting promo:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus promo';
            toast.error(errorMessage, {
                id: loadingToast
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteDialog = (item: PromoWithCreator) => {
        setSelectedPromo(item);
        setDeleteDialogOpen(true);
    };

    const getStatusBadge = (status: PromoStatus) => {
        const config = STATUS_CONFIG[status];
        return (
            <Badge className={config.className}>
                {config.label}
            </Badge>
        );
    };

    // Handle image click to open lightbox
    const handleImageClick = (index: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click event
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    // Prepare slides for lightbox (only promos with pictures)
    const lightboxSlides = filteredPromos
        .filter(promo => promo.picture)
        .map(promo => ({
            src: promo.picture!,
        }));

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full rounded-lg" />
                    ))}
                </div>
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
                        <BreadcrumbPage>Promo</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Manajemen Promo</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola promo dan penawaran khusus
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Promo
                </Button>
            </div>

            <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle>Daftar Promo ({filteredPromos.length})</CardTitle>

                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative grow sm:grow-0 sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Cari promo..."
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
                            title="Perbarui data"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredPromos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {searchQuery
                            ? 'Tidak ada promo yang sesuai dengan pencarian'
                            : 'Belum ada data promo'}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPromos.map((promo) => {
                            const promoIndex = lightboxSlides.findIndex(
                                slide => slide.src === promo.picture
                            );

                            return (
                                <Card key={promo.id} className="overflow-hidden hover:shadow-lg transition-shadow relative group pt-0">
                                    {promo.picture && (
                                        <div
                                            className="relative w-full h-48 cursor-pointer group/image"
                                            onClick={(e) => handleImageClick(promoIndex, e)}
                                        >
                                            <Image
                                                src={promo.picture}
                                                alt={promo.title}
                                                fill
                                                className="object-cover transition-transform group-hover/image:scale-105"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                unoptimized
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                                <div className="opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                                                    <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-3 shadow-lg">
                                                        <Expand className="h-6 w-6 text-gray-800 dark:text-gray-200" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <CardContent className="space-y-3 pt-4">
                                        <div>
                                            {getStatusBadge(promo.status)}
                                        </div>
                                        <h3 className="font-semibold text-lg line-clamp-2">{promo.title}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {promo.description}
                                        </p>
                                    </CardContent>

                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(promo)}
                                                        className="h-9 w-9 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white dark:text-white hover:text-white border-0 shadow-lg"
                                                        disabled={submitting}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit Promo</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleOpenDeleteDialog(promo)}
                                                        className="h-9 w-9 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white dark:text-white hover:text-white border-0 shadow-lg"
                                                        disabled={submitting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Hapus Promo</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>

            {/* Lightbox Component */}
            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={lightboxSlides}
                index={lightboxIndex}
                plugins={[Zoom, Download, Fullscreen]}
                carousel={{ finite: lightboxSlides.length > 1 }}
                styles={{
                    container: { backgroundColor: 'rgba(0, 0, 0, 0.95)' },
                }}
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedPromo ? 'Edit Promo' : 'Tambah Promo'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedPromo
                                ? 'Update informasi promo'
                                : 'Tambah promo baru'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Gambar Promo</Label>

                            {selectedPromo?.picture && !formData.pictureFile && !formData.pictureDeleted && (
                                <div className="space-y-2">
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                                        <Image
                                            src={selectedPromo.picture}
                                            alt="Current picture"
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                pictureDeleted: true,
                                            });
                                        }}
                                        disabled={submitting}
                                        className="w-full"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Hapus & Upload Baru
                                    </Button>
                                </div>
                            )}

                            {(!selectedPromo?.picture || formData.pictureDeleted || formData.pictureFile) && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor="picture-upload"
                                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                                        >
                                            {formData.pictureFile ? (
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={URL.createObjectURL(formData.pictureFile)}
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
                                                                pictureFile: null,
                                                                pictureDeleted: false,
                                                            });
                                                            const input = document.getElementById('picture-upload') as HTMLInputElement;
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
                                                id="picture-upload"
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
                                                            pictureFile: file,
                                                            pictureDeleted: false,
                                                        });

                                                        toast.success('Gambar siap untuk diupload!');
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {formData.pictureFile && (
                                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                    ✓ {formData.pictureFile.name}
                                                </p>
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    {(formData.pictureFile.size / 1024 / 1024).toFixed(2)} MB - Siap diupload
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
                                placeholder="Masukkan judul promo"
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
                                placeholder="Masukkan deskripsi promo..."
                                className={`w-full min-h-[150px] p-3 rounded-md border ${formErrors.description ? 'border-red-500' : 'border-input'
                                    } bg-background resize-y`}
                            />
                            {formErrors.description && (
                                <p className="text-sm text-red-500">{formErrors.description}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">
                                Status <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => {
                                    setFormData({ ...formData, status: value as PromoStatus });
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

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Promo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus promo{' '}
                            <strong>{selectedPromo?.title}</strong>? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {submitting ? 'Menghapus...' : 'Hapus'}
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