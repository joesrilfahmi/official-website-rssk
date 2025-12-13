'use client';
import React, { useState } from 'react';
import { Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/custom/button';
import Input from '@/components/ui/custom/input';
import Textarea from '@/components/ui/custom/textarea';
import Select from '@/components/ui/custom/select';
import Title from '@/components/ui/custom/title';
import Banner from '@/components/ui/custom/banner';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        doctorType: '',
        doctorName: '',
        date: '',
        time: '',
        description: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const doctorTypeOptions = [
        { value: 'general', label: 'General Practitioner' },
        { value: 'cardio', label: 'Cardiologist' },
        { value: 'derma', label: 'Dermatologist' },
        { value: 'pediatric', label: 'Pediatrician' },
        { value: 'ortho', label: 'Orthopedic' },
        { value: 'neuro', label: 'Neurologist' }
    ];

    const doctorNameOptions = [
        { value: 'dr1', label: 'Dr. Ahmad Santoso' },
        { value: 'dr2', label: 'Dr. Siti Nurhaliza' },
        { value: 'dr3', label: 'Dr. Budi Hartono' },
        { value: 'dr4', label: 'Dr. Maya Kusuma' },
        { value: 'dr5', label: 'Dr. Rian Pratama' }
    ];

    const timeOptions = [
        { value: '08:00', label: '08:00' },
        { value: '09:00', label: '09:00' },
        { value: '10:00', label: '10:00' },
        { value: '11:00', label: '11:00' },
        { value: '13:00', label: '13:00' },
        { value: '14:00', label: '14:00' },
        { value: '15:00', label: '15:00' },
        { value: '16:00', label: '16:00' }
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!formData.doctorType) newErrors.doctorType = 'Please select doctor type';
        if (!formData.doctorName) newErrors.doctorName = 'Please select doctor';
        if (!formData.date) newErrors.date = 'Please select date';
        if (!formData.time) newErrors.time = 'Please select time';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('Form submitted:', formData);
        alert('Appointment booked successfully!');

        setFormData({
            name: '',
            email: '',
            doctorType: '',
            doctorName: '',
            date: '',
            time: '',
            description: ''
        });
        setIsSubmitting(false);
    };

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

                {/* Appointment Form Section with Blue Background */}
                <div className="mb-4">
                    <div className="max-w-4xl mx-auto px-4 relative">
                        <div className="absolute -bottom-4 left-0 right-0 bg-mariner-500 rounded-3xl h-1/2"></div>
                        {/* Blue Background - Only half height */}

                        {/* White Form Container */}
                        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 mt-12">
                            <div className="text-center mb-8">
                                <Title
                                    badge="Appointment"
                                    title="Book Your Appointment"
                                    badgeVariant="default"
                                    align='center'
                                />
                            </div>

                            <div className="space-y-6">
                                {/* Name and Email Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Name"
                                        name="name"
                                        placeholder="Your Full Name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        error={errors.name}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <Input
                                        label="Email"
                                        name="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        error={errors.email}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Doctor Type and Name Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Select
                                        label="Doctor Type"
                                        placeholder="Choose Doctor Type"
                                        value={formData.doctorType}
                                        onChange={(value) => handleSelectChange('doctorType', value)}
                                        options={doctorTypeOptions}
                                        error={errors.doctorType}
                                        required
                                        disabled={isSubmitting}
                                        searchable
                                    />

                                    <Select
                                        label="Doctor Name"
                                        placeholder="Choose Doctor Name"
                                        value={formData.doctorName}
                                        onChange={(value) => handleSelectChange('doctorName', value)}
                                        options={doctorNameOptions}
                                        error={errors.doctorName}
                                        required
                                        disabled={isSubmitting}
                                        searchable
                                    />
                                </div>

                                {/* Date and Time Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Date"
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        error={errors.date}
                                        required
                                        disabled={isSubmitting}
                                    />

                                    <Select
                                        label="Time"
                                        placeholder="Choose Time"
                                        value={formData.time}
                                        onChange={(value) => handleSelectChange('time', value)}
                                        options={timeOptions}
                                        error={errors.time}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Description */}
                                <Textarea
                                    label="Description"
                                    name="description"
                                    placeholder="Describe Your Problem"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    disabled={isSubmitting}
                                />

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        className="w-full justify-center"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send'}
                                        {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;