// app/not-found.tsx
import React from 'react';
import Link from 'next/link';
import { Home, Frown } from 'lucide-react';
import Title from '@/components/ui/custom/title';
import Button from '@/components/ui/custom/button';

const NotFound = () => {
    return (
        <div className="min-h-screen bg-linear-to-b from-blue-50 to-white flex items-center justify-center relative overflow-hidden">
            {/* Left Decorative circles */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-32 w-64 h-64 sm:w-96 sm:h-96">
                <div className="absolute inset-0 bg-blue-100 rounded-full opacity-30"></div>
                <div className="absolute inset-8 bg-blue-200 rounded-full opacity-20"></div>
                <div className="absolute inset-16 bg-blue-300 rounded-full opacity-10"></div>
            </div>

            {/* Right Decorative circles */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-32 w-64 h-64 sm:w-96 sm:h-96">
                <div className="absolute inset-0 bg-blue-100 rounded-full opacity-30"></div>
                <div className="absolute inset-8 bg-blue-200 rounded-full opacity-20"></div>
                <div className="absolute inset-16 bg-blue-300 rounded-full opacity-10"></div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 relative z-10">
                <div className="flex flex-col items-center justify-center text-center space-y-8">
                    {/* Large 404 Text */}
                    <div className="relative">
                        <h1 className="text-[150px] sm:text-[200px] md:text-[250px] lg:text-[300px] font-bold text-mariner-500 leading-none opacity-90">
                            404
                        </h1>
                        {/* Sad face icon in the middle "0" with yellow square background */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                                <Frown className="w-12 h-12 sm:w-14 sm:h-14 md:w-20 md:h-20 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Title Component */}
                    <div className="max-w-2xl">
                        <Title
                            title="Page Not Found"
                            subtitle="Sorry, the page you are looking for does not exist."
                            align="center"
                            titleClassName="text-mariner-500"
                        />
                    </div>

                    {/* Button */}
                    <Link href="/">
                        <Button variant="primary" size="lg">
                            <Home className="w-5 h-5" />
                            Back to Homepage
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;