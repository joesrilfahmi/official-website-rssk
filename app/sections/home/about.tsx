import React from 'react';
import { Play, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/custom/badge';
import Button from '@/components/ui/custom/button';

const About = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                    {/* Left Side - Video/Image Section */}
                    <div className="relative w-full h-80 sm:h-96 lg:h-[450px] max-w-xl mx-auto lg:mx-0">
                        {/* Back decorative shape - smaller, positioned at top right */}
                        <div className="absolute top-0 right-0 w-[75%] sm:w-96 lg:w-[420px] h-48 sm:h-56 lg:h-64 bg-gray-300 rounded-2xl sm:rounded-3xl"></div>

                        {/* Main content area - larger, positioned at bottom left */}
                        <div className="absolute bottom-0 left-0 w-[70%] sm:w-72 lg:w-80 h-64 sm:h-72 lg:h-80 bg-gray-300 rounded-2xl sm:rounded-3xl flex items-center justify-center">
                            {/* Play button - bottom left corner */}
                            <button className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white rounded-full p-4 sm:p-5 shadow-lg hover:scale-110 transition-transform">
                                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 fill-blue-500" />
                            </button>
                        </div>

                        {/* Years badge - positioned at middle right overlapping both shapes */}
                        <div className="absolute top-1/2 right-4 sm:right-8 lg:right-12 transform -translate-y-1/2 bg-green-500 rounded-xl sm:rounded-2xl px-6 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-8 text-center shadow-xl z-10">
                            <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-1">58</div>
                            <div className="text-white text-sm sm:text-base font-medium whitespace-nowrap">Tahun Bersama</div>
                        </div>
                    </div>

                    {/* Right Side - Content Section */}
                    <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto lg:mx-0">
                        {/* Profile badge */}
                        <Badge>
                            Profil
                        </Badge>

                        {/* Hospital name */}
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-mariner-500 leading-tight">
                            RS Siti Khodijah Muhammmadiyah Cabang Sepanjang
                        </h1>

                        {/* Description */}
                        <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                            Rumah Sakit Siti Khodijah adalah rumah sakit tipe B dan merupakan salah satu amal usaha kesehatan milik Persyarikatan Muhammadiyah dibawah naungan Pimpinan Cabang Muhammadiyah Sepanjang yang didukung dengan fasilitas yang modern dan sumber daya insani yang profesional dan islami.
                        </p>

                        {/* Button */}
                        <div className="pt-2">
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