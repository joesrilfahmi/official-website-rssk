// app/(dashboard)/dokter/page.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
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
import { Plus, Pencil, Trash2, Loader2, Search, RefreshCw, ArrowUpDown, X, Eye, Clock } from 'lucide-react';
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
import { uploadFile, deleteFile, getFilePathFromUrl } from '@/lib/upload';
import { validateImage } from '@/lib/validasi/validasiImage';
import type {
    DokterStatus,
    HariType,
    SortField,
    SortOrder,
    Poli,
    DokterWithRelations,
    DokterFormData,
    DokterFormErrors,
} from '@/types';

const DEFAULT_FORM_DATA: DokterFormData = {
    gelar_depan: '',
    nama: '',
    gelar_belakang: '',
    poli_id: '',
    profile: '',
    status: 'active',
    profileFile: null,
    profileDeleted: false,
    jadwal: []
};

const DEFAULT_FORM_ERRORS: DokterFormErrors = {
    nama: '',
    poli_id: '',
    jadwal: ''
};

const STATUS_OPTIONS: { value: DokterStatus; label: string }[] = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Tidak Aktif' },
    { value: 'cuti', label: 'Cuti' },
    { value: 'libur', label: 'Libur' }
];

const HARI_OPTIONS: HariType[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function DokterPage() {
    const [dokterList, setDokterList] = useState<DokterWithRelations[]>([]);
    const [filteredDokter, setFilteredDokter] = useState<DokterWithRelations[]>([]);
    const [poliList, setPoliList] = useState<Poli[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedDokter, setSelectedDokter] = useState<DokterWithRelations | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    const [showAccessDenied, setShowAccessDenied] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState<number | 'all'>(10);
    const [statusFilter, setStatusFilter] = useState<DokterStatus | 'all'>('all');
    const [poliFilter, setPoliFilter] = useState<string>('all');

    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    const [formData, setFormData] = useState<DokterFormData>(DEFAULT_FORM_DATA);
    const [formErrors, setFormErrors] = useState<DokterFormErrors>(DEFAULT_FORM_ERRORS);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const getNamaLengkap = (dokter: DokterWithRelations) => {
        const parts = [];
        if (dokter.gelar_depan) parts.push(dokter.gelar_depan);
        parts.push(dokter.nama);
        if (dokter.gelar_belakang) parts.push(dokter.gelar_belakang);
        return parts.join(' ');
    };

    const applyFilters = useCallback(() => {
        let filtered = [...dokterList];

        if (debouncedSearch.trim()) {
            const query = debouncedSearch.toLowerCase();
            filtered = filtered.filter(d =>
                getNamaLengkap(d).toLowerCase().includes(query) ||
                d.poli_detail?.nama_poli.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(d => d.status === statusFilter);
        }

        if (poliFilter !== 'all') {
            filtered = filtered.filter(d => d.poli_id === poliFilter);
        }

        filtered.sort((a, b) => {
            let compareValue = 0;

            if (sortField === 'nama') {
                compareValue = getNamaLengkap(a).localeCompare(getNamaLengkap(b), 'id');
            } else if (sortField === 'poli') {
                const poliA = a.poli_detail?.nama_poli || '';
                const poliB = b.poli_detail?.nama_poli || '';
                compareValue = poliA.localeCompare(poliB, 'id');
            } else if (sortField === 'status') {
                compareValue = a.status.localeCompare(b.status);
            } else if (sortField === 'created_at') {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                compareValue = dateA - dateB;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        setFilteredDokter(filtered);
        setCurrentPage(1);
        setSelectedIds(new Set());
    }, [debouncedSearch, dokterList, sortField, sortOrder, statusFilter, poliFilter]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    const fetchPoli = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('poli')
                .select('*')
                .eq('status', 'active')
                .order('nama_poli', { ascending: true });

            if (error) throw error;
            setPoliList(data || []);
        } catch (error) {
            console.error('Error fetching poli:', error);
            toast.error('Gagal memuat data poli');
        }
    }, []);

    const fetchDokter = useCallback(async () => {
        try {
            const { data: dokterData, error: dokterError } = await supabase
                .from('dokter')
                .select(`
                    *,
                    poli_detail:poli!dokter_poli_fkey (
                        id,
                        nama_poli,
                        status
                    )
                `)
                .order('created_at', { ascending: false });

            if (dokterError) throw dokterError;

            const { data: jadwalData, error: jadwalError } = await supabase
                .from('jadwal_dokter')
                .select('*')
                .order('hari', { ascending: true });

            if (jadwalError) throw jadwalError;

            const dokterWithJadwal = (dokterData || []).map(dokter => ({
                ...dokter,
                jadwal: (jadwalData || []).filter(j => j.dokter_id === dokter.id)
            }));

            setDokterList(dokterWithJadwal);
        } catch (error) {
            console.error('Error fetching dokter:', error);
            toast.error('Gagal memuat data dokter');
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
                await fetchPoli();
                await fetchDokter();
            } finally {
                setLoading(false);
            }
        };

        loadInitial();

        const dokterChannel = supabase
            .channel('dokter_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'dokter' },
                () => fetchDokter()
            )
            .subscribe();

        const jadwalChannel = supabase
            .channel('jadwal_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'jadwal_dokter' },
                () => fetchDokter()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(dokterChannel);
            supabase.removeChannel(jadwalChannel);
        };
    }, [fetchPoli, fetchDokter]);

    const handleRefresh = async () => {
        setRefreshing(true);
        const loadingToast = toast.loading('Memperbarui data...');

        try {
            await fetchDokter();
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
        const labels: Record<SortField, string> = {
            nama: sortOrder === 'asc' ? 'Nama (A-Z)' : 'Nama (Z-A)',
            poli: sortOrder === 'asc' ? 'Poli (A-Z)' : 'Poli (Z-A)',
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
        setPoliFilter('all');
    };

    const totalItems = filteredDokter.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
    const currentDokter = filteredDokter.slice(startIndex, endIndex);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = new Set(currentDokter.map(d => d.id));
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

    const isAllSelected = currentDokter.length > 0 && currentDokter.every(d => selectedIds.has(d.id));
    const isSomeSelected = currentDokter.some(d => selectedIds.has(d.id)) && !isAllSelected;

    const handleOpenDialog = (item?: DokterWithRelations) => {
        if (item) {
            setSelectedDokter(item);
            setFormData({
                gelar_depan: item.gelar_depan || '',
                nama: item.nama,
                gelar_belakang: item.gelar_belakang || '',
                poli_id: item.poli_id,
                profile: item.profile || '',
                status: item.status,
                profileFile: null,
                profileDeleted: false,
                jadwal: (item.jadwal || []).map(j => ({
                    id: j.id,
                    hari: j.hari,
                    jam_mulai: j.jam_mulai,
                    jam_selesai: j.jam_selesai,
                    _temp_id: j.id
                }))
            });
        } else {
            setSelectedDokter(null);
            setFormData({ ...DEFAULT_FORM_DATA });
        }
        setFormErrors({ ...DEFAULT_FORM_ERRORS });
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedDokter(null);
        setFormData({ ...DEFAULT_FORM_DATA });
        setFormErrors({ ...DEFAULT_FORM_ERRORS });

        const input = document.getElementById('profile-upload') as HTMLInputElement;
        if (input) input.value = '';
    };

    const handleAddJadwal = () => {
        setFormData({
            ...formData,
            jadwal: [
                ...formData.jadwal,
                {
                    hari: '',
                    jam_mulai: '',
                    jam_selesai: '',
                    _temp_id: `temp_${Date.now()}`
                }
            ]
        });
    };

    const handleRemoveJadwal = (tempId: string) => {
        setFormData({
            ...formData,
            jadwal: formData.jadwal.filter(j => j._temp_id !== tempId)
        });
    };

    const handleJadwalChange = (tempId: string, field: string, value: string) => {
        setFormData({
            ...formData,
            jadwal: formData.jadwal.map(j =>
                j._temp_id === tempId ? { ...j, [field]: value } : j
            )
        });
    };

    const validateForm = () => {
        const errors: DokterFormErrors = { ...DEFAULT_FORM_ERRORS };
        let isValid = true;

        if (!formData.nama.trim()) {
            errors.nama = 'Nama dokter wajib diisi';
            isValid = false;
        }

        if (!formData.poli_id) {
            errors.poli_id = 'Poli wajib dipilih';
            isValid = false;
        }

        if (formData.jadwal.length > 0) {
            const timeFormatRegex = /^\d{2}\.\d{2}$/;

            for (const j of formData.jadwal) {
                if (!j.hari || !j.jam_mulai || !j.jam_selesai) {
                    errors.jadwal = 'Semua field jadwal harus diisi';
                    isValid = false;
                    break;
                }

                if (!timeFormatRegex.test(j.jam_mulai) || !timeFormatRegex.test(j.jam_selesai)) {
                    errors.jadwal = 'Format jam harus 00.00 (contoh: 08.00, 14.30)';
                    isValid = false;
                    break;
                }

                const [jamMulaiHour, jamMulaiMinute] = j.jam_mulai.split('.').map(Number);
                const [jamSelesaiHour, jamSelesaiMinute] = j.jam_selesai.split('.').map(Number);

                if (jamMulaiHour > 23 || jamMulaiMinute > 59 || jamSelesaiHour > 23 || jamSelesaiMinute > 59) {
                    errors.jadwal = 'Jam tidak valid (Jam: 00-23, Menit: 00-59)';
                    isValid = false;
                    break;
                }

                const mulaiInMinutes = jamMulaiHour * 60 + jamMulaiMinute;
                const selesaiInMinutes = jamSelesaiHour * 60 + jamSelesaiMinute;

                if (selesaiInMinutes <= mulaiInMinutes) {
                    errors.jadwal = 'Jam selesai harus lebih besar dari jam mulai';
                    isValid = false;
                    break;
                }
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSubmitting(true);
        const loadingToast = toast.loading(
            selectedDokter ? 'Mengupdate dokter...' : 'Menambahkan dokter...'
        );

        let newUploadedPath: string | null = null;

        try {
            let finalProfileUrl: string | null = null;

            if (formData.profileFile) {
                const uploadResult = await uploadFile({
                    bucket: 'dokter-profiles',
                    folder: currentUserId,
                    file: formData.profileFile,
                });

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'Gagal mengupload profile');
                }

                finalProfileUrl = uploadResult.url || null;
                newUploadedPath = uploadResult.path || null;
            } else if (formData.profileDeleted) {
                finalProfileUrl = null;
            } else {
                finalProfileUrl = selectedDokter?.profile || null;
            }

            const dokterData = {
                gelar_depan: formData.gelar_depan || null,
                nama: formData.nama,
                gelar_belakang: formData.gelar_belakang || null,
                poli_id: formData.poli_id,
                profile: finalProfileUrl,
                status: formData.status
            };

            let dokterId: string;

            if (selectedDokter) {
                const { data, error } = await supabase
                    .from('dokter')
                    .update(dokterData)
                    .eq('id', selectedDokter.id)
                    .select()
                    .single();

                if (error) throw error;
                dokterId = data.id;

                await supabase
                    .from('jadwal_dokter')
                    .delete()
                    .eq('dokter_id', dokterId);
            } else {
                const { data, error } = await supabase
                    .from('dokter')
                    .insert([dokterData])
                    .select()
                    .single();

                if (error) throw error;
                dokterId = data.id;
            }

            if (formData.jadwal.length > 0) {
                const jadwalToInsert = formData.jadwal.map(j => ({
                    dokter_id: dokterId,
                    hari: j.hari as HariType,
                    jam_mulai: j.jam_mulai,
                    jam_selesai: j.jam_selesai
                }));

                const { error: jadwalError } = await supabase
                    .from('jadwal_dokter')
                    .insert(jadwalToInsert);

                if (jadwalError) throw jadwalError;
            }

            if (selectedDokter?.profile && (formData.profileFile || formData.profileDeleted)) {
                const oldPath = getFilePathFromUrl(selectedDokter.profile, 'dokter-profiles');
                if (oldPath) {
                    await deleteFile('dokter-profiles', oldPath);
                }
            }

            toast.success(
                selectedDokter ? 'Dokter berhasil diupdate' : 'Dokter berhasil ditambahkan',
                { id: loadingToast }
            );

            await fetchDokter();
            handleCloseDialog();
        } catch (error) {
            console.error('Error saving dokter:', error);

            if (newUploadedPath) {
                await deleteFile('dokter-profiles', newUploadedPath);
            }

            const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan data dokter';
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedDokter) return;
        setSubmitting(true);

        const loadingToast = toast.loading('Menghapus dokter...');

        try {
            if (selectedDokter.profile) {
                const path = getFilePathFromUrl(selectedDokter.profile, 'dokter-profiles');
                if (path) {
                    await deleteFile('dokter-profiles', path);
                }
            }

            const { error } = await supabase
                .from('dokter')
                .delete()
                .eq('id', selectedDokter.id);

            if (error) throw error;

            toast.success('Dokter berhasil dihapus', { id: loadingToast });
            await fetchDokter();
            setDeleteDialogOpen(false);
            setSelectedDokter(null);
        } catch (error) {
            console.error('Error deleting dokter:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus dokter';
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setSubmitting(true);

        const loadingToast = toast.loading(`Menghapus ${selectedIds.size} dokter...`);

        try {
            const idsArray = Array.from(selectedIds);

            for (const id of idsArray) {
                const item = dokterList.find(d => d.id === id);
                if (item?.profile) {
                    const path = getFilePathFromUrl(item.profile, 'dokter-profiles');
                    if (path) {
                        await deleteFile('dokter-profiles', path);
                    }
                }
            }

            const { error } = await supabase
                .from('dokter')
                .delete()
                .in('id', idsArray);

            if (error) throw error;

            setSelectedIds(new Set());
            toast.success(`${idsArray.length} dokter berhasil dihapus`, { id: loadingToast });
            await fetchDokter();
            setBulkDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error bulk deleting dokter:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gagal menghapus dokter';
            toast.error(errorMessage, { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDeleteDialog = (item: DokterWithRelations) => {
        setSelectedDokter(item);
        setDeleteDialogOpen(true);
    };

    const handleOpenPreview = (item: DokterWithRelations) => {
        setSelectedDokter(item);
        setPreviewDialogOpen(true);
    };

    const getStatusBadge = (status: DokterStatus) => {
        const statusConfig: Record<DokterStatus, { label: string; className: string }> = {
            active: {
                label: 'Aktif',
                className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700'
            },
            inactive: {
                label: 'Tidak Aktif',
                className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700'
            },
            cuti: {
                label: 'Cuti',
                className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
            },
            libur: {
                label: 'Libur',
                className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
            }
        };

        const config = statusConfig[status];
        return (
            <Badge className={config.className}>
                {config.label}
            </Badge>
        );
    };

    const sortOptions = [
        { value: 'created_at-desc', label: 'Terbaru' },
        { value: 'created_at-asc', label: 'Terlama' },
        { value: 'nama-asc', label: 'Nama (A-Z)' },
        { value: 'nama-desc', label: 'Nama (Z-A)' },
        { value: 'poli-asc', label: 'Poli (A-Z)' },
        { value: 'poli-desc', label: 'Poli (Z-A)' },
    ];

    const showReset = sortField !== 'created_at' || sortOrder !== 'desc' ||
        searchQuery !== '' || statusFilter !== 'all' || poliFilter !== 'all';

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
                        <BreadcrumbPage>Dokter</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Manajemen Dokter</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola data dokter dan jadwal praktik
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
                        Tambah Dokter
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <CardTitle>Daftar Dokter ({totalItems})</CardTitle>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <div className="relative grow sm:grow-0 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                    <Input
                                        placeholder="Cari nama dokter, poli..."
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
                            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as DokterStatus | 'all')}>
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

                            <Select value={poliFilter} onValueChange={setPoliFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Semua Poli" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Poli</SelectItem>
                                    {poliList.map((poli) => (
                                        <SelectItem key={poli.id} value={poli.id}>
                                            {poli.nama_poli}
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
                                    <TableHead>Dokter</TableHead>
                                    <TableHead>Poli</TableHead>
                                    <TableHead>Jadwal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[180px]">Dibuat</TableHead>
                                    <TableHead className="text-right w-40">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentDokter.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground h-32">
                                            {searchQuery || statusFilter !== 'all' || poliFilter !== 'all'
                                                ? 'Tidak ada data yang sesuai dengan filter'
                                                : 'Belum ada data dokter'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentDokter.map((item, index) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.has(item.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectOne(item.id, checked as boolean)
                                                    }
                                                    aria-label={`Select ${item.nama}`}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {startIndex + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium">{getNamaLengkap(item)}</p>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{item.poli_detail?.nama_poli}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm space-y-1">
                                                    {item.jadwal?.slice(0, 2).map(j => (
                                                        <div key={j.id} className="flex items-center gap-1 text-muted-foreground">
                                                            <Clock className="w-3 h-3" />
                                                            <span>{j.hari}: {j.jam_mulai}-{j.jam_selesai}</span>
                                                        </div>
                                                    ))}
                                                    {(item.jadwal?.length || 0) > 2 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            +{(item.jadwal?.length || 0) - 2} jadwal lainnya
                                                        </div>
                                                    )}
                                                    {(item.jadwal?.length || 0) === 0 && (
                                                        <span className="text-xs text-muted-foreground">Belum ada jadwal</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(item.status)}
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
                            {selectedDokter ? 'Edit Dokter' : 'Tambah Dokter'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDokter
                                ? 'Update informasi dokter dan jadwal praktik'
                                : 'Tambah dokter baru dengan jadwal praktik'}
                        </DialogDescription>
                    </DialogHeader>
                    <div onSubmit={handleSubmit}>
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="basic">Informasi Dasar</TabsTrigger>
                                <TabsTrigger value="jadwal">Jadwal Praktik</TabsTrigger>
                            </TabsList>

                            <TabsContent value="basic" className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="gelar_depan">Gelar Depan</Label>
                                        <Input
                                            id="gelar_depan"
                                            value={formData.gelar_depan}
                                            onChange={(e) => setFormData({ ...formData, gelar_depan: e.target.value })}
                                            placeholder="dr., drg."
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="gelar_belakang">Gelar Belakang</Label>
                                        <Input
                                            id="gelar_belakang"
                                            value={formData.gelar_belakang}
                                            onChange={(e) => setFormData({ ...formData, gelar_belakang: e.target.value })}
                                            placeholder="Sp.PD, Sp.KG"
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nama">
                                        Nama Dokter <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="nama"
                                        value={formData.nama}
                                        onChange={(e) => {
                                            setFormData({ ...formData, nama: e.target.value });
                                            if (formErrors.nama) {
                                                setFormErrors({ ...formErrors, nama: '' });
                                            }
                                        }}
                                        placeholder="Masukkan nama dokter"
                                        disabled={submitting}
                                        className={formErrors.nama ? 'border-red-500' : ''}
                                    />
                                    {formErrors.nama && (
                                        <p className="text-sm text-red-500">{formErrors.nama}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="poli_id">
                                        Poli <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.poli_id}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, poli_id: value });
                                            if (formErrors.poli_id) {
                                                setFormErrors({ ...formErrors, poli_id: '' });
                                            }
                                        }}
                                        disabled={submitting}
                                    >
                                        <SelectTrigger className={formErrors.poli_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Pilih poli" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {poliList.map((poli) => (
                                                <SelectItem key={poli.id} value={poli.id}>
                                                    {poli.nama_poli}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {formErrors.poli_id && (
                                        <p className="text-sm text-red-500">{formErrors.poli_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">
                                        Status <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => {
                                            setFormData({ ...formData, status: value as DokterStatus });
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

                                <div className="space-y-2">
                                    <Label>Foto Profile</Label>

                                    {selectedDokter?.profile && !formData.profileFile && !formData.profileDeleted && (
                                        <div className="space-y-2">
                                            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                                                <Image
                                                    src={selectedDokter.profile}
                                                    alt="Current profile"
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
                                                            profileDeleted: true,
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
                                                Profile saat ini. Klik tombol di atas untuk menggantinya.
                                            </p>
                                        </div>
                                    )}

                                    {(!selectedDokter?.profile || formData.profileDeleted || formData.profileFile) && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center w-full">
                                                <label
                                                    htmlFor="profile-upload"
                                                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
                                                >
                                                    {formData.profileFile ? (
                                                        <div className="relative w-full h-full">
                                                            <Image
                                                                src={URL.createObjectURL(formData.profileFile)}
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
                                                                        profileFile: null,
                                                                        profileDeleted: false,
                                                                    });
                                                                    const input = document.getElementById('profile-upload') as HTMLInputElement;
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
                                                        id="profile-upload"
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
                                                                    profileFile: file,
                                                                    profileDeleted: false,
                                                                });

                                                                toast.success('Gambar siap untuk diupload!');
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>

                                            {formData.profileFile && (
                                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                            ✓ {formData.profileFile.name}
                                                        </p>
                                                        <p className="text-xs text-green-600 dark:text-green-400">
                                                            {(formData.profileFile.size / 1024 / 1024).toFixed(2)} MB - Siap diupload
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
                            </TabsContent>

                            <TabsContent value="jadwal" className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Jadwal Praktik</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddJadwal}
                                            disabled={submitting}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Tambah Jadwal
                                        </Button>
                                    </div>

                                    {formErrors.jadwal && (
                                        <p className="text-sm text-red-500">{formErrors.jadwal}</p>
                                    )}

                                    <div className="space-y-3 mt-4">
                                        {formData.jadwal.length === 0 ? (
                                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                                <p className="text-sm text-muted-foreground">
                                                    Belum ada jadwal praktik
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Klik tombol &quot;Tambah Jadwal&quot; untuk menambahkan
                                                </p>
                                            </div>
                                        ) : (
                                            formData.jadwal.map((jadwal, index) => (
                                                <div key={jadwal._temp_id} className="p-4 border rounded-lg space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-sm font-medium">Jadwal #{index + 1}</Label>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveJadwal(jadwal._temp_id)}
                                                            disabled={submitting}
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Hari</Label>
                                                            <Select
                                                                value={jadwal.hari}
                                                                onValueChange={(value) => handleJadwalChange(jadwal._temp_id, 'hari', value)}
                                                                disabled={submitting}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Pilih hari" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {HARI_OPTIONS.map(h => (
                                                                        <SelectItem key={h} value={h}>{h}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Jam Mulai</Label>
                                                            <Input
                                                                type="text"
                                                                placeholder="00.00"
                                                                value={jadwal.jam_mulai}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/[^0-9.]/g, '');
                                                                    const parts = value.split('.');

                                                                    if (parts.length <= 2) {
                                                                        let formatted = value;
                                                                        if (parts[0] && parts[0].length > 2) {
                                                                            formatted = parts[0].slice(0, 2) + (parts[1] !== undefined ? '.' + parts[1] : '');
                                                                        }
                                                                        if (parts[1] && parts[1].length > 2) {
                                                                            formatted = parts[0] + '.' + parts[1].slice(0, 2);
                                                                        }
                                                                        handleJadwalChange(jadwal._temp_id, 'jam_mulai', formatted);
                                                                    }
                                                                }}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Jam Selesai</Label>
                                                            <Input
                                                                type="text"
                                                                placeholder="00.00"
                                                                value={jadwal.jam_selesai}
                                                                onChange={(e) => {
                                                                    const value = e.target.value.replace(/[^0-9.]/g, '');
                                                                    const parts = value.split('.');

                                                                    if (parts.length <= 2) {
                                                                        let formatted = value;
                                                                        if (parts[0] && parts[0].length > 2) {
                                                                            formatted = parts[0].slice(0, 2) + (parts[1] !== undefined ? '.' + parts[1] : '');
                                                                        }
                                                                        if (parts[1] && parts[1].length > 2) {
                                                                            formatted = parts[0] + '.' + parts[1].slice(0, 2);
                                                                        }
                                                                        handleJadwalChange(jadwal._temp_id, 'jam_selesai', formatted);
                                                                    }
                                                                }}
                                                                disabled={submitting}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground mt-2">
                                        Format jam: 00.00 (Contoh: 08.00, 14.30). Satu dokter dapat memiliki beberapa jadwal praktik.
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
                            <Button onClick={(e) => { e.preventDefault(); handleSubmit(e); }} disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {submitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview Dokter</DialogTitle>
                    </DialogHeader>
                    {selectedDokter && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage
                                        src={selectedDokter.profile || undefined}
                                        alt={selectedDokter.nama}
                                    />
                                    <AvatarFallback className="text-2xl">
                                        {selectedDokter.nama.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold">{getNamaLengkap(selectedDokter)}</h2>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant="outline">{selectedDokter.poli_detail?.nama_poli}</Badge>
                                        {getStatusBadge(selectedDokter.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Dibuat: {formatDateTime(selectedDokter.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Jadwal Praktik
                                </h3>
                                {selectedDokter.jadwal && selectedDokter.jadwal.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedDokter.jadwal.map(j => (
                                            <div key={j.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium min-w-20">{j.hari}</span>
                                                <span className="text-muted-foreground">:</span>
                                                <span>{j.jam_mulai} - {j.jam_selesai}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                                        Belum ada jadwal praktik
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Dokter?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus dokter{' '}
                            <strong>{selectedDokter && getNamaLengkap(selectedDokter)}</strong>?
                            Semua jadwal praktik dokter ini juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
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
                        <AlertDialogTitle>Hapus {selectedIds.size} Dokter?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus {selectedIds.size} dokter yang dipilih?
                            Semua jadwal praktik dokter-dokter ini juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
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