"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Calendar, Stethoscope, UserRound, X, AlertCircle, CheckCircle2 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';
import Select from '@/components/ui/custom/select';

interface DateInfo {
    day: string;
    date: number;
    fullDate: Date;
    isToday: boolean;
}

interface DropdownOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface Klinik {
    unit_id: string;
    unit_name: string;
}

interface Doctor {
    ms_doctors_schedule_id: string;
    unit_id: string;
    doctor_id: string;
    day: string;
    starts: string;
    ends: string;
    doctor_name: string;
    unit_name: string;
    employee_ft: string;
    employee_bt: string;
    quota: string;
    daynumber: string;
}

interface DoctorSchedule {
    doctor_id: string;
    doctor_name: string;
    employee_ft: string;
    employee_bt: string;
    schedules: {
        day: string;
        starts: string;
        ends: string;
        quota: string;
        ms_doctors_schedule_id: string;
    }[];
}

export default function RumahSakit() {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
    const [selectedKlinikId, setSelectedKlinikId] = useState<string>("");
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [alertMessage, setAlertMessage] = useState<string>("");
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');

    const [kliniks, setKliniks] = useState<Klinik[]>([]);
    const [doctors, setDoctors] = useState<DoctorSchedule[]>([]);

    const [loading, setLoading] = useState({
        kliniks: true,
        doctors: false
    });

    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: false,
        align: "center",
        containScroll: "trimSnaps"
    });

    // Fetch kliniks on mount
    useEffect(() => {
        fetchKliniks();
    }, []);

    // Fetch doctors when klinik changes
    useEffect(() => {
        if (selectedKlinikId) {
            fetchDoctors(selectedKlinikId);
            setSelectedDoctorId('');
        } else {
            setDoctors([]);
        }
    }, [selectedKlinikId]);

    const fetchKliniks = async () => {
        try {
            setLoading(prev => ({ ...prev, kliniks: true }));
            const response = await fetch('/api/kliniks');
            const data = await response.json();
            if (data.data) {
                setKliniks(data.data);
            }
        } catch (error) {
            console.error('Error fetching kliniks:', error);
        } finally {
            setLoading(prev => ({ ...prev, kliniks: false }));
        }
    };

    const fetchDoctors = async (unitId: string) => {
        try {
            setLoading(prev => ({ ...prev, doctors: true }));
            const response = await fetch(`/api/doctors/${unitId}`);
            const data = await response.json();

            if (data.data) {
                const doctorMap = new Map<string, DoctorSchedule>();

                data.data.forEach((item: Doctor) => {
                    if (!doctorMap.has(item.doctor_id)) {
                        doctorMap.set(item.doctor_id, {
                            doctor_id: item.doctor_id,
                            doctor_name: item.doctor_name,
                            employee_ft: item.employee_ft || '',
                            employee_bt: item.employee_bt || '',
                            schedules: []
                        });
                    }

                    const doctor = doctorMap.get(item.doctor_id)!;
                    doctor.schedules.push({
                        day: item.day,
                        starts: item.starts,
                        ends: item.ends,
                        quota: item.quota,
                        ms_doctors_schedule_id: item.ms_doctors_schedule_id
                    });
                });

                setDoctors(Array.from(doctorMap.values()));
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setLoading(prev => ({ ...prev, doctors: false }));
        }
    };

    const formatDoctorName = (doctor: DoctorSchedule) => {
        const parts = [
            doctor.employee_ft?.trim(),
            doctor.doctor_name?.trim(),
            doctor.employee_bt?.trim()
        ].filter(Boolean);

        let fullName = parts.join(' ');
        fullName = fullName.replace(/\.\.+/g, '.');
        fullName = fullName.replace(/,,+/g, ',');
        fullName = fullName.replace(/\s+([,.])/g, '$1');
        fullName = fullName.replace(/,(?!\s)/g, ', ');

        return fullName;
    };

    // Generate 7 dates: 3 before, today, 3 after
    const generateSevenDates = (centerDate: Date): DateInfo[] => {
        const dates: DateInfo[] = [];
        const daysShort = ["MIN", "SEN", "SEL", "RAB", "KAM", "JUM", "SAB"];

        for (let i = -3; i <= 3; i++) {
            const date = new Date(centerDate);
            date.setDate(centerDate.getDate() + i);
            dates.push({
                day: daysShort[date.getDay()],
                date: date.getDate(),
                fullDate: new Date(date),
                isToday: date.toDateString() === new Date(today).toDateString(),
            });
        }
        return dates;
    };

    const sevenDates: DateInfo[] = generateSevenDates(selectedDate);

    const isNotToday: boolean =
        selectedDate.toDateString() !== new Date(today).toDateString();

    const handlePrevDate = (): void => {
        if (emblaApi) emblaApi.scrollPrev();
    };

    const handleNextDate = (): void => {
        if (emblaApi) emblaApi.scrollNext();
    };

    const handleBackToToday = (): void => {
        setSelectedDate(new Date(today));
        if (emblaApi) {
            const todayIndex = sevenDates.findIndex(d => d.isToday);
            emblaApi.scrollTo(todayIndex);
        }
    };

    const handleCheckAvailability = (): void => {
        if (!selectedKlinikId || !selectedDoctorId) {
            setAlertMessage("Mohon pilih Klinik dan Dokter terlebih dahulu");
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 5000);
            return;
        }

        const selectedKlinik = kliniks.find(k => k.unit_id === selectedKlinikId);
        const selectedDoctor = doctors.find(d => d.doctor_id === selectedDoctorId);

        if (!selectedDoctor) {
            setAlertMessage("Dokter tidak ditemukan");
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 5000);
            return;
        }

        const doctorFullName = formatDoctorName(selectedDoctor);

        // Get selected day name in Indonesian
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const selectedDayName = dayNames[selectedDate.getDay()];

        // Filter schedules by selected day
        const availableSchedules = selectedDoctor.schedules.filter(schedule =>
            schedule.day.toLowerCase() === selectedDayName.toLowerCase()
        );

        // Format selected date in Indonesian
        const formattedDate = selectedDate.toLocaleDateString("id-ID", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        if (availableSchedules.length === 0) {
            const message = `❌ Dokter tidak praktik pada hari ini\n\nTanggal: ${formattedDate}\nKlinik: ${selectedKlinik?.unit_name || ''}\nDokter: ${doctorFullName}\n\nMohon pilih tanggal lain`;
            setAlertMessage(message);
            setAlertType('error');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 8000);
        } else {
            // Build schedule list
            const scheduleList = availableSchedules.map(s =>
                `• ${s.starts} - ${s.ends} (Kuota: ${s.quota})`
            ).join('\n');

            const message = `✅ Dokter tersedia!\n\nTanggal: ${formattedDate}\nKlinik: ${selectedKlinik?.unit_name || ''}\nDokter: ${doctorFullName}\n\nJadwal Praktik:\n${scheduleList}`;
            setAlertMessage(message);
            setAlertType('success');
            setShowAlert(true);
            setTimeout(() => setShowAlert(false), 10000);
        }
    };

    // Prepare dropdown options
    const klinikOptions: DropdownOption[] = kliniks.map(k => ({
        value: k.unit_id,
        label: k.unit_name
    }));

    const doctorOptions: DropdownOption[] = doctors.map(d => {
        const fullName = formatDoctorName(d);
        return {
            value: d.doctor_id,
            label: fullName.length > 40 ? fullName.substring(0, 40) + '...' : fullName
        };
    });

    return (
        <section className="bg-white py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <Title
                    title="RS Siti Khodijah Muhammadiyah Cabang Sepanjang"
                    badgeVariant="default"
                    titleClassName="mt-8"
                />

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mt-8">
                    {/* Left Section - Appointment Form */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8">
                        {/* Alert Message */}
                        {showAlert && (
                            <div className={`mb-6 p-4 border rounded-xl flex items-start gap-3 ${alertType === 'success'
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                                }`}>
                                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${alertType === 'success' ? 'text-green-600' : 'text-red-600'
                                    }`} />
                                <div className="flex-1">
                                    <p className={`text-sm whitespace-pre-line font-medium ${alertType === 'success' ? 'text-green-800' : 'text-red-800'
                                        }`}>
                                        {alertMessage}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAlert(false)}
                                    className={`transition-colors ${alertType === 'success'
                                        ? 'text-green-400 hover:text-green-600'
                                        : 'text-red-400 hover:text-red-600'
                                        }`}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Date Selector */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-base font-semibold text-gray-700">
                                    {selectedDate.toLocaleDateString("id-ID", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                <Calendar className="w-5 h-5 text-mariner-500" />
                            </div>

                            {/* Date Navigation with Embla Carousel */}
                            <div className="flex items-center gap-3 mb-4">
                                <button
                                    onClick={handlePrevDate}
                                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                                    title="Tanggal sebelumnya"
                                    aria-label="Tanggal sebelumnya"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                                </button>

                                {/* Embla Carousel Container */}
                                <div className="overflow-hidden flex-1" ref={emblaRef}>
                                    <div className="flex gap-2">
                                        {sevenDates.map((item, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedDate(item.fullDate)}
                                                className={`flex flex-col items-center shrink-0 py-3 px-4 rounded-xl transition-all duration-300 ${selectedDate.toDateString() === item.fullDate.toDateString()
                                                    ? "bg-mariner-500 text-white shadow-lg scale-105"
                                                    : item.isToday
                                                        ? "bg-mariner-100 text-mariner-700 border-2 border-mariner-300"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    }`}
                                                style={{ minWidth: '70px' }}
                                                aria-label={`Pilih tanggal ${item.date}`}
                                            >
                                                <span className="text-xs font-semibold">{item.day}</span>
                                                <span className="text-xl font-bold mt-1">
                                                    {item.date}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleNextDate}
                                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shrink-0"
                                    title="Tanggal berikutnya"
                                    aria-label="Tanggal berikutnya"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-700" />
                                </button>
                            </div>

                            {/* Back to Today Button */}
                            {isNotToday && (
                                <div className="flex justify-center">
                                    <Button
                                        onClick={handleBackToToday}
                                        variant="secondary"
                                        size="sm"
                                    >
                                        Reset ke Hari Ini
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Klinik Select */}
                        <div className="mb-6">
                            <Select
                                label="Poliklinik Spesialis"
                                placeholder="Pilih Poliklinik"
                                value={selectedKlinikId}
                                onChange={setSelectedKlinikId}
                                options={klinikOptions}
                                icon={Stethoscope}
                                searchable={true}
                                loading={loading.kliniks}
                                required={true}
                            />
                        </div>

                        {/* Nama Dokter Select */}
                        <div className="mb-8">
                            <Select
                                label="Nama Dokter"
                                placeholder="Pilih Dokter"
                                value={selectedDoctorId}
                                onChange={setSelectedDoctorId}
                                options={doctorOptions}
                                icon={UserRound}
                                searchable={true}
                                disabled={!selectedKlinikId}
                                loading={loading.doctors}
                                required={true}
                            />
                        </div>

                        {/* Submit Button */}
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={handleCheckAvailability}
                        >
                            Cek Ketersediaan Dokter
                        </Button>
                    </div>

                    {/* Right Section - Featured Services & Info */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Main Image Card */}
                        <div className="relative h-[400px] lg:h-[500px]">
                            {/* Background Shape */}
                            <div className="absolute inset-0 bg-teal-100 rounded-3xl transform -rotate-3"></div>

                            {/* Image */}
                            <div className="relative bg-gray-400 rounded-3xl overflow-hidden h-full shadow-lg">
                                <Image
                                    src="/mario.jpg"
                                    alt="RS Siti Khodijah Muhammadiyah"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>

                            {/* Service Badge - Bottom Right (Desktop only) */}
                            <div className="hidden lg:block absolute bottom-1/3 right-2 bg-white rounded-t-2xl rounded-br-2xl p-6 shadow-2xl z-20 max-w-sm">
                                <div className="space-y-4">
                                    <h4 className="text-2xl font-bold text-greenfresh-600 mb-4">
                                        Layanan 24 Jam
                                    </h4>

                                    <p className="text-base text-gray-600 mb-0">
                                        Layanan 24 Jam kami siap melayani
                                    </p>
                                    <p className="text-base text-gray-600 mb-6">
                                        Anda setiap hari & 24 jam meliputi:
                                    </p>

                                    <ul className="space-y-1">
                                        <li className="flex items-start">
                                            <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                            <p className="text-base text-gray-600 ml-3">
                                                Instalasi Gawat Darurat (IGD)
                                            </p>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                            <p className="text-base text-gray-600 ml-3">
                                                Rawat Inap
                                            </p>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                            <p className="text-base text-gray-600 ml-3">
                                                Laboratorium & Radiologi
                                            </p>
                                        </li>
                                        <li className="flex items-start">
                                            <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                            <p className="text-base text-gray-600 ml-3">
                                                Farmasi
                                            </p>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Service Badge - Mobile Version (Below Image) */}
                        <div className="lg:hidden bg-white rounded-2xl p-6 shadow-2xl">
                            <div className="space-y-4">
                                <h4 className="text-2xl font-bold text-greenfresh-600 mb-4">
                                    Layanan 24 Jam
                                </h4>

                                <p className="text-base text-gray-600 mb-0">
                                    Layanan 24 Jam kami siap melayani
                                </p>
                                <p className="text-base text-gray-600 mb-6">
                                    Anda setiap hari & 24 jam meliputi:
                                </p>

                                <ul className="space-y-3">
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                        <p className="text-base text-gray-600 ml-3">
                                            Instalasi Gawat Darurat (IGD)
                                        </p>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                        <p className="text-base text-gray-600 ml-3">
                                            Rawat Inap
                                        </p>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                        <p className="text-base text-gray-600 ml-3">
                                            Laboratorium & Radiologi
                                        </p>
                                    </li>
                                    <li className="flex items-start">
                                        <CheckCircle2 className="w-5 h-5 text-greenfresh-600 shrink-0 mt-0.5" />
                                        <p className="text-base text-gray-600 ml-3">
                                            Farmasi
                                        </p>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}