'use client';
import React from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import Title from '@/components/ui/custom/title';
import Banner from '@/components/ui/custom/banner';

const Contact = () => {
    return (
        <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <Banner
                    title="Emergency Contact"
                    subtitle="CONTACT"
                />

                {/* Header Section */}
                <div className="text-center mt-8 mb-12 sm:mb-16">
                    <Title
                        badge="Kontak"
                        title="Kontak Kami"
                        badgeVariant="default"
                        align='center'
                    />
                </div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {/* Phone Card */}
                    <div className="bg-bittersweet-500 rounded-3xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative pt-16">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-bittersweet-500">
                                <Phone className="w-8 h-8 text-bittersweet-500" />
                            </div>
                        </div>
                        <h3 className="text-center font-semibold text-lg mb-2">Call Us Now</h3>
                        <p className="text-center text-white font-medium">+62 985456782</p>
                    </div>

                    {/* Email Card */}
                    <div className="bg-greenfresh-600 rounded-3xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative pt-16">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-greenfresh-600">
                                <Mail className="w-8 h-8 text-greenfresh-600" />
                            </div>
                        </div>
                        <h3 className="text-center font-semibold text-lg mb-2">Mail Us Now</h3>
                        <p className="text-center text-white font-medium text-sm">info@mithessios.com</p>
                    </div>

                    {/* Address Card */}
                    <div className="bg-mariner-600 rounded-3xl p-8 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative pt-16">
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                            <div className="bg-white rounded-2xl p-4 shadow-lg border-4 border-mariner-600">
                                <MapPin className="w-8 h-8 text-mariner-600" />
                            </div>
                        </div>
                        <h3 className="text-center font-semibold text-lg mb-2">Address</h3>
                        <p className="text-center text-white font-medium text-sm">Jl. Dantau Jonge 12, SBY</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;