'use client';
import { ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/custom/badge';
import Button from '@/components/ui/custom/button';

const Hero: React.FC = () => {
    return (
        <div className="min-h-screen bg-easternblue-500 relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8">
            <div className='max-w-7xl mx-auto'>
                {/* Content */}
                <div className="relative z-10 container mx-auto">
                    <div className="flex flex-col lg:flex-row gap-12 items-center min-h-[calc(100vh-8rem)]">

                        <div className="space-y-8 w-full lg:w-1/2">
                            <Badge variant="default">
                                YOUR HEALTH IS OUR PRIORITY
                            </Badge>

                            <div className="space-y-4">
                                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
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
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Hero;