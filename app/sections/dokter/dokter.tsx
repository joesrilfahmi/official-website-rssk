// app/sections/dokter/dokter.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Search, Calendar, X } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';
import Banner from '@/components/ui/custom/banner';
import Input from '@/components/ui/custom/input';
import Select from '@/components/ui/custom/select';
import Pills from '@/components/ui/custom/pills';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

// Types
interface Poli {
    id: string;
    nama_poli: string;
}

interface JadwalDokter {
    id: string;
    hari: string;
    jam_mulai: string;
    jam_selesai: string;
}

interface Dokter {
    id: string;
    gelar_depan: string | null;
    nama: string;
    gelar_belakang: string | null;
    poli_id: string;
    profile: string | null;
    status: string;
    poli: Poli;
    jadwal_dokter: JadwalDokter[];
}

const HARI_OPTIONS = [
    { value: 'all', label: 'Semua' },
    { value: 'Senin', label: 'Senin' },
    { value: 'Selasa', label: 'Selasa' },
    { value: 'Rabu', label: 'Rabu' },
    { value: 'Kamis', label: 'Kamis' },
    { value: 'Jumat', label: 'Jumat' },
    { value: 'Sabtu', label: 'Sabtu' },
    { value: 'Minggu', label: 'Minggu' }
];

const HARI_ORDER: Record<string, number> = {
    'Senin': 1,
    'Selasa': 2,
    'Rabu': 3,
    'Kamis': 4,
    'Jumat': 5,
    'Sabtu': 6,
    'Minggu': 7
};

const DokterSpesialis = () => {
    const [poliList, setPoliList] = useState<Poli[]>([]);
    const [dokterList, setDokterList] = useState<Dokter[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null);

    // Filters
    const [selectedPoli, setSelectedPoli] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedHari, setSelectedHari] = useState<string>('all');

    // Embla Carousel for categories only
    const [emblaRef] = useEmblaCarousel({
        loop: false,
        align: 'start',
        skipSnaps: false,
        slidesToScroll: 1,
        dragFree: true,
        containScroll: 'trimSnaps',
    });

    useEffect(() => {
        fetchData();

        // Real-time subscription
        const dokterChannel = supabase
            .channel('dokter_public')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'dokter' },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        const jadwalChannel = supabase
            .channel('jadwal_dokter_public')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'jadwal_dokter' },
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(dokterChannel);
            supabase.removeChannel(jadwalChannel);
        };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch dokter dengan relasi
            const { data: dokterData, error: dokterError } = await supabase
                .from('dokter')
                .select(`
                    *,
                    poli:poli_id (
                        id,
                        nama_poli
                    ),
                    jadwal_dokter (
                        id,
                        hari,
                        jam_mulai,
                        jam_selesai
                    )
                `)
                .eq('status', 'active');

            if (dokterError) throw dokterError;

            // Sort by poli nama_poli ascending
            const sortedDokter = (dokterData || []).sort((a, b) => {
                const nameA = a.poli?.nama_poli?.toLowerCase() || '';
                const nameB = b.poli?.nama_poli?.toLowerCase() || '';
                return nameA.localeCompare(nameB);
            });

            setDokterList(sortedDokter);

            // Get unique poli from active doctors only
            const uniquePoliIds = new Set<string>();
            const uniquePoliList: Poli[] = [];

            sortedDokter.forEach(dokter => {
                if (dokter.poli && !uniquePoliIds.has(dokter.poli.id)) {
                    uniquePoliIds.add(dokter.poli.id);
                    uniquePoliList.push(dokter.poli);
                }
            });

            // Sort poli by nama_poli
            uniquePoliList.sort((a, b) =>
                a.nama_poli.toLowerCase().localeCompare(b.nama_poli.toLowerCase())
            );

            setPoliList(uniquePoliList);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter dokter berdasarkan search query (untuk menentukan kategori yang relevan)
    const searchFilteredDokter = dokterList.filter(dokter => {
        if (!searchQuery) return true;

        const fullName = `${dokter.gelar_depan || ''} ${dokter.nama} ${dokter.gelar_belakang || ''}`.toLowerCase();
        const poliName = dokter.poli?.nama_poli?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();

        return fullName.includes(query) || poliName.includes(query);
    });

    // Get poli list yang relevan dengan search query
    const relevantPoliList = searchQuery
        ? poliList.filter(poli => {
            // Check if any doctor in this poli matches the search
            return searchFilteredDokter.some(dokter => dokter.poli_id === poli.id);
        })
        : poliList;

    // Filter dokter lengkap (dengan semua filter)
    const filteredDokter = dokterList.filter(dokter => {
        // Filter by search query
        if (searchQuery) {
            const fullName = `${dokter.gelar_depan || ''} ${dokter.nama} ${dokter.gelar_belakang || ''}`.toLowerCase();
            const poliName = dokter.poli?.nama_poli?.toLowerCase() || '';
            const query = searchQuery.toLowerCase();

            if (!fullName.includes(query) && !poliName.includes(query)) {
                return false;
            }
        }

        // Filter by poli
        if (selectedPoli !== 'all' && dokter.poli_id !== selectedPoli) {
            return false;
        }

        // Filter by hari
        if (selectedHari !== 'all') {
            const hasSchedule = dokter.jadwal_dokter.some(jadwal => jadwal.hari === selectedHari);
            if (!hasSchedule) {
                return false;
            }
        }

        return true;
    });

    // Handler untuk search query - reset kategori dan hari ke "all"
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (value) {
            setSelectedPoli('all');
            setSelectedHari('all');
        }
    };

    // Handler untuk clear search
    const handleClearSearch = () => {
        setSearchQuery('');
    };

    // Handler untuk pilih kategori - clear search query
    const handlePoliChange = (poliId: string) => {
        setSelectedPoli(poliId);
        if (poliId !== 'all') {
            setSearchQuery('');
        }
    };

    // Sort jadwal by hari order, then by start time
    const sortJadwalByHari = (jadwal: JadwalDokter[]) => {
        return [...jadwal].sort((a, b) => {
            // First sort by day
            const hariDiff = (HARI_ORDER[a.hari] || 999) - (HARI_ORDER[b.hari] || 999);
            if (hariDiff !== 0) {
                return hariDiff;
            }

            // If same day, sort by start time
            const timeToNumber = (time: string) => {
                const cleanTime = time.replace(/[.:]/g, '');
                return parseInt(cleanTime) || 0;
            };

            return timeToNumber(a.jam_mulai) - timeToNumber(b.jam_mulai);
        });
    };

    const renderDokterCard = (dokter: Dokter) => {
        const fullName = `${dokter.gelar_depan || ''} ${dokter.nama} ${dokter.gelar_belakang || ''}`.trim();
        const initial = dokter.nama.charAt(0).toUpperCase();

        return (
            <div
                onClick={() => setSelectedDokter(dokter)}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group border border-gray-100 hover:border-mariner-200 h-full"
            >
                <div className="flex flex-col items-center text-center h-full">
                    {/* Profile Image */}
                    <div className="relative w-56 h-56 mb-4 shrink-0">
                        {dokter.profile ? (
                            <div className="w-full h-full rounded-full overflow-hidden">
                                <Image
                                    src={dokter.profile}
                                    alt={fullName}
                                    fill
                                    className="object-cover rounded-full"
                                    sizes="224px"
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full rounded-full bg-linear-to-br from-mariner-400 to-mariner-600 flex items-center justify-center text-white text-6xl font-bold">
                                {initial}
                            </div>
                        )}
                    </div>

                    {/* Doctor Name */}
                    <h3 className="text-xl font-bold text-mariner-500 mb-2 group-hover:text-mariner-600 transition-colors">
                        {fullName}
                    </h3>

                    {/* Specialization */}
                    <p className="text-gray-600 mb-3">
                        {dokter.poli?.nama_poli || '-'}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <Banner
                    title="Dokter Spesialis Kami"
                    subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
                />

                <div className="text-center mt-8 mb-12 sm:mb-16">
                    <Title
                        title="Daftar Dokter Spesialis"
                        align='center'
                        subtitle="Temukan dokter spesialis terbaik untuk kebutuhan kesehatan Anda"
                    />
                </div>

                {/* Main Content Container */}
                <div className="container mx-auto px-4 py-8">
                    {/* Filters Section */}
                    <div className="mb-8 space-y-6">
                        {/* Search and Day Filter - Centered */}
                        <div className="flex justify-center">
                            <div className="w-full max-w-3xl space-y-4">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Input
                                            type="text"
                                            placeholder="Cari dokter atau spesialisasi..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            icon={Search}
                                            iconPosition="left"
                                            rounded="full"
                                            inputSize="md"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={handleClearSearch}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors z-20"
                                                type="button"
                                            >
                                                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Day Filter */}
                                    <div className="w-full sm:w-48 shrink-0">
                                        <Select
                                            icon={Calendar}
                                            value={selectedHari}
                                            onChange={setSelectedHari}
                                            options={HARI_OPTIONS}
                                            placeholder="Pilih hari"
                                            rounded="full"
                                            searchable={false}
                                            selectSize="md"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Pills - Carousel */}
                        {!loading && poliList.length > 0 && (
                            <div className="relative -mx-4 px-4">
                                <div className="overflow-hidden px-4 py-4" ref={emblaRef}>
                                    <div className="flex gap-3">
                                        <Pills
                                            label="Semua"
                                            count={searchQuery ? searchFilteredDokter.length : dokterList.length}
                                            variant={selectedPoli === 'all' ? 'active' : 'default'}
                                            onClick={() => handlePoliChange('all')}
                                            size='md'
                                        />
                                        {relevantPoliList.map((poli) => {
                                            const count = searchFilteredDokter.filter(d => d.poli_id === poli.id).length;
                                            return (
                                                <Pills
                                                    key={poli.id}
                                                    label={poli.nama_poli}
                                                    count={count}
                                                    variant={selectedPoli === poli.id ? 'active' : 'default'}
                                                    onClick={() => handlePoliChange(poli.id)}
                                                    size='md'
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
                                    <div className="flex flex-col items-center">
                                        <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
                                        <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredDokter.length === 0 && (
                        <div className="text-center py-12">
                            <div className="inline-flex p-6 rounded-full bg-gray-100 mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                Tidak Ada Dokter Ditemukan
                            </h3>
                            <p className="text-gray-500">
                                Coba ubah filter atau kata kunci pencarian Anda.
                            </p>
                        </div>
                    )}

                    {/* Dokter Grid */}
                    {!loading && filteredDokter.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {filteredDokter.map((dokter) => (
                                <div key={dokter.id}>
                                    {renderDokterCard(dokter)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {selectedDokter && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedDokter(null)}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Content */}
                        <div className="p-8">
                            {/* Close Button */}
                            <div className="flex justify-end mb-4">
                                <button
                                    onClick={() => setSelectedDokter(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Doctor Profile - Centered */}
                            <div className="flex flex-col items-center text-center mb-8">
                                {/* Large Profile Image */}
                                <div className="relative w-56 h-56 mb-6">
                                    {selectedDokter.profile ? (
                                        <Image
                                            src={selectedDokter.profile}
                                            alt={selectedDokter.nama}
                                            fill
                                            className="rounded-full object-cover"
                                            sizes="224px"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-linear-to-br from-mariner-400 to-mariner-600 flex items-center justify-center text-white text-6xl font-bold">
                                            {selectedDokter.nama.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Full Name with Titles */}
                                <h3 className="text-3xl font-bold text-mariner-500 mb-3">
                                    {`${selectedDokter.gelar_depan || ''} ${selectedDokter.nama} ${selectedDokter.gelar_belakang || ''}`.trim()}
                                </h3>

                                {/* Poli Name */}
                                <p className="text-xl text-gray-600 mb-3">
                                    {selectedDokter.poli?.nama_poli || '-'}
                                </p>

                                {/* Status Badge */}
                                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-6">
                                    {selectedDokter.status === 'active' ? 'Aktif' : selectedDokter.status}
                                </span>
                            </div>

                            {/* Schedule Section */}
                            {selectedDokter.jadwal_dokter.length > 0 && (
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-4 text-center">Detail Jadwal Praktik</h4>
                                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                                        {sortJadwalByHari(selectedDokter.jadwal_dokter).map((jadwal, index, array) => {
                                            // Format time display
                                            const formatTime = (time: string) => {
                                                if (time.includes('.')) {
                                                    return time.replace('.', ':');
                                                }
                                                return time;
                                            };

                                            // Check if this is a new day
                                            const isNewDay = index === 0 || array[index - 1].hari !== jadwal.hari;

                                            return (
                                                <div key={jadwal.id}>
                                                    {/* Show divider if not first item and day changed */}
                                                    {index > 0 && isNewDay && (
                                                        <div className="border-t border-gray-300 my-3"></div>
                                                    )}

                                                    <div className="flex items-center justify-between py-2">
                                                        <div className="flex items-center gap-3">
                                                            {isNewDay ? (
                                                                <>
                                                                    <Calendar className="w-5 h-5 text-mariner-500" />
                                                                    <span className="font-medium text-gray-900 min-w-20">{jadwal.hari}</span>
                                                                </>
                                                            ) : (
                                                                <span className="min-w-20 ml-8"></span>
                                                            )}
                                                        </div>
                                                        <span className="text-gray-600 font-medium">
                                                            {formatTime(jadwal.jam_mulai)} - {formatTime(jadwal.jam_selesai)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Close Button */}
                                    <div className="flex justify-center">
                                        <Button
                                            variant='primary'
                                            onClick={() => setSelectedDokter(null)}
                                        >
                                            Tutup
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {selectedDokter.jadwal_dokter.length === 0 && (
                                <div>
                                    <div className="text-center py-8 mb-6">
                                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">Jadwal praktik belum tersedia</p>
                                    </div>

                                    {/* Close Button */}
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => setSelectedDokter(null)}
                                            className="px-8 py-2.5 bg-mariner-500 hover:bg-mariner-600 text-white font-medium rounded-full transition-colors"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DokterSpesialis;