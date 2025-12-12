// components/ui/custom/image-upload.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageUploadProps {
    value?: string;
    onChange: (file: File | null, previewUrl: string | null) => void;
    disabled?: boolean;
    label?: string;
    required?: boolean;
    maxSizeInMB?: number;
}

export function ImageUpload({
    value,
    onChange,
    disabled = false,
    label = 'Upload Gambar',
    required = false,
    maxSizeInMB = 5,
}: ImageUploadProps) {
    const [preview, setPreview] = useState<string | null>(value || null);
    const [error, setError] = useState<string>('');

    // Sync with external value changes
    useEffect(() => {
        setPreview(value || null);
    }, [value]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/x-webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
            return;
        }

        // Validate file size
        const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            setError(`Ukuran file terlalu besar. Maksimal ${maxSizeInMB}MB`);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            const previewUrl = reader.result as string;
            setPreview(previewUrl);
            setError('');
            onChange(file, previewUrl);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        setPreview(null);
        setError('');
        // Panggil onChange dengan null, null untuk memberitahu parent bahwa gambar dihapus
        onChange(null, null);

        // Reset input
        const input = document.getElementById('image-upload-input') as HTMLInputElement;
        if (input) {
            input.value = '';
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <Label>
                    {label} {required && <span className="text-red-500">*</span>}
                </Label>
            )}

            <div className="space-y-3">
                {!preview ? (
                    <div className="flex items-center gap-3">
                        <input
                            id="image-upload-input"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileChange}
                            disabled={disabled}
                            className="hidden"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('image-upload-input')?.click()}
                            disabled={disabled}
                            className="w-full"
                        >
                            Pilih Gambar
                        </Button>
                    </div>
                ) : (
                    <div className="relative border rounded-lg p-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="absolute top-2 right-2 h-8 w-8 bg-red-600 hover:bg-red-700 text-white hover:text-white z-10"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={preview}
                                alt="Preview"
                                className="max-h-60 w-auto object-contain rounded"
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}

                <p className="text-xs text-muted-foreground">
                    Format: JPG, PNG, WebP • Ukuran maks: {maxSizeInMB}MB
                </p>
            </div>
        </div>
    );
}