'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Phone, Mail } from 'lucide-react';
import Button from '@/components/ui/custom/button';
import { supabase } from '@/lib/supabase/client';
import Badge from '@/components/ui/custom/badge';

interface DoctorSpecialty {
    id: string;
    name: string;
}

interface Doctor {
    id: string;
    name: string;
    specialty_id: string;
}

export default function PendaftaranSection() {
    const [loading, setLoading] = useState(false);
    const [specialties, setSpecialties] = useState<DoctorSpecialty[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        specialty: '',
        doctor: '',
        date: '',
        time: '',
        description: ''
    });

    useEffect(() => {
        fetchSpecialties();
        fetchDoctors();
    }, []);

    const fetchSpecialties = async () => {
        try {
            const { data, error } = await supabase
                .from('doctor_specialties')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setSpecialties(data || []);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        }
    };

    const fetchDoctors = async () => {
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setDoctors(data || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        }
    };

    const handleSpecialtyChange = (specialtyId: string) => {
        setFormData({ ...formData, specialty: specialtyId, doctor: '' });

        if (specialtyId) {
            const filtered = doctors.filter(doc => doc.specialty_id === specialtyId);
            setFilteredDoctors(filtered);
        } else {
            setFilteredDoctors([]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('appointments')
                .insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        specialty_id: formData.specialty,
                        doctor_id: formData.doctor,
                        appointment_date: formData.date,
                        appointment_time: formData.time,
                        description: formData.description,
                        status: 'pending'
                    }
                ]);

            if (error) throw error;

            alert('Pendaftaran berhasil! Kami akan segera menghubungi Anda.');

            // Reset form
            setFormData({
                name: '',
                email: '',
                specialty: '',
                doctor: '',
                date: '',
                time: '',
                description: ''
            });
            setFilteredDoctors([]);

        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative min-h-screen py-12 sm:py-16 lg:py-20 overflow-hidden">
            {/* Background with Blue Gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-mariner-600 via-mariner-500 to-mariner-700">
                {/* Overlay Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}></div>
                </div>
            </div>

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                    {/* Left Side - Form */}
                    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10">
                        {/* Badge */}
                        <Badge>
                            Buat Janji
                        </Badge>

                        {/* Title */}
                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-mariner-500 mb-8">
                            Konsultasi Dokter Lebih Mudah, dan Buat Janji Temu Kamu Disini
                        </h2>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name & Email */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="mymail@l"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mariner-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Input Email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mariner-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Poli Spesialis & Nama Dokter */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Poli Spesialis
                                    </label>
                                    <select
                                        value={formData.specialty}
                                        onChange={(e) => handleSpecialtyChange(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mariner-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                        required
                                    >
                                        <option value="">Choose Doctor Type</option>
                                        {specialties.map((specialty) => (
                                            <option key={specialty.id} value={specialty.id}>
                                                {specialty.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nama Dokter
                                    </label>
                                    <select
                                        value={formData.doctor}
                                        onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mariner-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                        required
                                        disabled={!formData.specialty}
                                    >
                                        <option value="">Choose Doctor Name</option>
                                        {filteredDoctors.map((doctor) => (
                                            <option key={doctor.id} value={doctor.id}>
                                                {doctor.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Tanggal & Time */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mariner-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mariner-500 focus:border-transparent outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Deskripsi Keluhan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Deskripsi Keluhan Anda
                                </label>
                                <textarea
                                    rows={4}
                                    placeholder="Tuliskan keluhan Anda..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-mariner-500 focus:border-transparent outline-none transition-all resize-none"
                                    required
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full shadow-lg bg-bittersweet-500 hover:bg-bittersweet-600"
                                disabled={loading}
                            >
                                {loading ? 'Mengirim...' : 'Send'}
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>

                    {/* Right Side - Contact Info */}
                    <div className="space-y-6">
                        {/* Badge & Title */}
                        <div>
                            <Badge>
                                Kontak
                            </Badge>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                                Informasi Pendaftaran
                            </h2>
                            <p className="text-white/90 text-base sm:text-lg leading-relaxed">
                                Kini pendaftaran layanan kesehatan di RS Siti Khodijah semakin mudah melalui website kami. Cukup dengan beberapa langkah sederhana, Anda dapat memilih jadwal dokter, jenis layanan. Nikmati kemudahan ini kapan saja dan di mana saja, langsung dari perangkat Anda!
                            </p>
                        </div>

                        {/* Contact Cards */}
                        <div className="space-y-4">
                            {/* Phone Card */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex items-center gap-4 hover:bg-white/20 transition-all duration-300">
                                <div className="w-16 h-16 bg-bittersweet-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                    <Phone className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-sm font-medium uppercase tracking-wide mb-1">
                                        Pusat Informasi
                                    </p>
                                    <a
                                        href="tel:0811-3326-757"
                                        className="text-white text-xl sm:text-2xl font-bold hover:text-teal-300 transition-colors"
                                    >
                                        0811-3326-757
                                    </a>
                                </div>
                            </div>

                            {/* Email Card */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 flex items-center gap-4 hover:bg-white/20 transition-all duration-300">
                                <div className="w-16 h-16 bg-teal-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                                    <Mail className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-white/80 text-sm font-medium uppercase tracking-wide mb-1">
                                        Email
                                    </p>
                                    <a
                                        href="mailto:humas@sitikhodijah.com"
                                        className="text-white text-lg sm:text-xl font-bold hover:text-teal-300 transition-colors break-all"
                                    >
                                        humas@sitikhodijah.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}