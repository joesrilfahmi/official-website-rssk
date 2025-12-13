'use client';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import Badge from '@/components/ui/custom/badge';
import Button from '@/components/ui/custom/button';

const Hero: React.FC = () => {
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <div className="min-h-screen bg-easternblue-500 relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
            <div className='max-w-7xl mx-auto'>
                {/* Content */}
                <div className="relative z-10 container mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12 items-center justify-center min-h-[calc(100vh-8rem)]">

                        <div className="space-y-8 w-full lg:w-1/2">
                            <Badge variant="default">
                                YOUR HEALTH IS OUR PRIORITY
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                    RS Siti Khodijah Muhammadiyah Cabang Sepanjang
                                </h1>
                            </div>

                            <p className="text-xl text-white/90 leading-relaxed max-w-xl">
                                Memilih rumah sakit yang tepat untuk kesehatan Anda dan keluarga merupakan keputusan yang sangat penting.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-4">
                                <Button variant="primary" size="lg" className='group'>
                                    Buat Janji
                                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button variant="outline" size="lg">
                                    Kontak Kami
                                </Button>
                            </div>
                        </div>

                        {/* Right Side - Image with Professional Gallery Style (Hidden on mobile and tablet) */}
                        <div className="hidden lg:flex w-full lg:w-1/2 items-center justify-center">
                            <div className="relative w-full max-w-lg lg:max-w-xl">
                                {/* Background decorative frame - larger */}
                                <div className="absolute -inset-6 bg-white/10 rounded-3xl backdrop-blur-sm transform rotate-3"></div>

                                {/* Background decorative frame - medium */}
                                <div className="absolute -inset-4 bg-white/15 rounded-3xl backdrop-blur-sm transform -rotate-2"></div>

                                {/* Main image container with frame effect */}
                                <div className="relative">
                                    {/* White frame/border effect */}
                                    <div className="absolute -inset-3 bg-white/90 rounded-3xl shadow-2xl"></div>

                                    {/* Main image area */}
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-4/3 border-4 border-white">
                                        {/* Skeleton Loader */}
                                        {!imageLoaded && (
                                            <div className="absolute inset-0 bg-linear-to-r from-white/20 via-white/30 to-white/20 animate-pulse">
                                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                                            </div>
                                        )}

                                        {/* Image */}
                                        <Image
                                            src="/mario.jpg"
                                            alt="RS Siti Khodijah Muhammadiyah"
                                            fill
                                            className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                                                }`}
                                            priority
                                            onLoadingComplete={() => setImageLoaded(true)}
                                        />
                                    </div>
                                </div>

                                {/* Floating decorative elements */}
                                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-white/15 rounded-full blur-2xl"></div>

                                {/* Small accent dots */}
                                <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full opacity-60"></div>
                                <div className="absolute bottom-8 right-12 w-2 h-2 bg-white rounded-full opacity-40"></div>
                                <div className="absolute top-12 left-4 w-2 h-2 bg-white rounded-full opacity-50"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
    );
};

export default Hero;