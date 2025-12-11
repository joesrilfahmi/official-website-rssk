// app/sections/home/about.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { Play, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/custom/button';
import Title from '@/components/ui/custom/title';

const About = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Side - Video/Image Section */}
                    <div className="relative w-full h-[420px] sm:h-[480px] lg:h-[520px] max-w-xl mx-auto lg:mx-0">
                        {/* Back decorative shape */}
                        <div className="absolute top-0 right-0 w-[72%] sm:w-[380px] lg:w-[420px] h-60 sm:h-[280px] lg:h-80 bg-linear-to-br from-blue-100 to-blue-200 rounded-3xl overflow-hidden shadow-lg border-white">
                            <Image
                                src="/mario.jpg"
                                alt="RS Siti Khodijah"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Gradient overlay for depth */}
                            <div className="absolute inset-0 bg-linear-to-br from-transparent to-blue-900/10"></div>
                        </div>

                        {/* Main content area */}
                        <div className="absolute bottom-0 left-0 w-[72%] sm:w-[360px] lg:w-[400px] h-[280px] sm:h-80 lg:h-[360px] bg-linear-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center overflow-hidden shadow-xl z-20 border-4 border-white">
                            <Image
                                src="/mario.jpg"
                                alt="RS Siti Khodijah Interior"
                                fill
                                className="object-cover"
                                priority
                            />
                            {/* Gradient overlay for depth */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent"></div>

                            {/* Play button with enhanced styling */}
                            <button className="absolute bottom-6 left-6 bg-white rounded-full p-5 shadow-2xl hover:scale-110 hover:shadow-blue-500/50 transition-all duration-300 z-10 group">
                                <Play className="w-6 h-6 text-blue-500 fill-blue-500 group-hover:scale-110 transition-transform" />
                            </button>

                        </div>

                        {/* Years badge - positioned more centered with enhanced design */}
                        <div className="absolute top-[55%] right-[8%] sm:right-[12%] lg:right-[15%] transform -translate-y-1/2 bg-greenfresh-500 rounded-t-2xl rounded-br-2xl px-8 py-6 sm:px-10 sm:py-7 text-center shadow-2xl z-30">
                            <div className="text-5xl sm:text-6xl font-bold text-white mb-1 drop-shadow-lg">58</div>
                            <div className="text-white text-sm sm:text-base font-medium whitespace-nowrap">Tahun Bersama</div>
                        </div>
                    </div>

                    {/* Right Side - Content Section */}
                    <div className="max-w-xl mx-auto lg:mx-0">
                        {/* Using Title Component */}
                        <Title
                            badge="Profil"
                            title="RS Siti Khodijah Muhammadiyah Cabang Sepanjang"
                            badgeVariant="default"
                        />

                        {/* Description */}
                        <p className="text-gray-700 text-base sm:text-lg leading-relaxed mt-5 sm:mt-6">
                            Rumah Sakit Siti Khodijah adalah rumah sakit tipe B dan merupakan salah satu amal usaha kesehatan milik Persyarikatan Muhammadiyah dibawah naungan Pimpinan Cabang Muhammadiyah Sepanjang yang didukung dengan fasilitas yang modern dan sumber daya insani yang profesional dan islami.
                        </p>

                        {/* Button */}
                        <div className="pt-2 mt-5 sm:mt-6">
                            <Button variant="primary" size="lg" className='group'>
                                Selengkapnya
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;