"use client";
import Banner from "@/components/ui/custom/banner";
import Button from "@/components/ui/custom/button";
import Input from "@/components/ui/custom/input";
import Select from "@/components/ui/custom/select";
import Textarea from "@/components/ui/custom/textarea";
import Title from "@/components/ui/custom/title";
import { supabase } from "@/lib/supabase/client";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import React, { useEffect, useState } from "react";

interface Kategori {
  id: string;
  title: string;
}

interface UnitPelayanan {
  id: string;
  title: string;
}

const KritikSaran = () => {
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [unitPelayananList, setUnitPelayananList] = useState<UnitPelayanan[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    nama: "",
    no_hp: "",
    unit_pelayanan_id: "",
    kategori_id: "",
    pesan: "",
    rating: 0,
    is_anonymus: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch Kategori
  useEffect(() => {
    const fetchKategori = async () => {
      try {
        const { data, error } = await supabase
          .from("kategori")
          .select("*")
          .order("title", { ascending: true });

        if (error) throw error;
        setKategoriList(data || []);
      } catch (error) {
        console.error("Error fetching kategori:", error);
      }
    };

    fetchKategori();

    // Real-time subscription for kategori
    const kategoriChannel = supabase
      .channel("kategori_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kategori" },
        () => {
          fetchKategori();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kategoriChannel);
    };
  }, []);

  // Fetch Unit Pelayanan
  useEffect(() => {
    const fetchUnitPelayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("unit_pelayanan")
          .select("*")
          .order("title", { ascending: true });

        if (error) throw error;
        setUnitPelayananList(data || []);
      } catch (error) {
        console.error("Error fetching unit pelayanan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnitPelayanan();

    // Real-time subscription for unit_pelayanan
    const unitChannel = supabase
      .channel("unit_pelayanan_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "unit_pelayanan" },
        () => {
          fetchUnitPelayanan();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(unitChannel);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.is_anonymus) {
      if (!formData.nama.trim()) {
        newErrors.nama = "Nama wajib diisi";
      }
      if (!formData.no_hp.trim()) {
        newErrors.no_hp = "No HP wajib diisi";
      } else if (!/^[0-9]{10,15}$/.test(formData.no_hp)) {
        newErrors.no_hp = "No HP tidak valid (10-15 digit)";
      }
    }

    if (!formData.unit_pelayanan_id) {
      newErrors.unit_pelayanan_id = "Unit pelayanan wajib dipilih";
    }
    if (!formData.kategori_id) {
      newErrors.kategori_id = "Kategori wajib dipilih";
    }
    if (!formData.pesan.trim()) {
      newErrors.pesan = "Pesan wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        nama: formData.is_anonymus ? "Anonim" : formData.nama.trim(),
        no_hp: formData.is_anonymus ? "000000000000" : formData.no_hp.trim(),
        unit_pelayanan_id: formData.unit_pelayanan_id,
        kategori_id: formData.kategori_id,
        pesan: formData.pesan.trim(),
        rating: formData.rating > 0 ? formData.rating : null,
        is_anonymus: formData.is_anonymus,
        status: "unread",
        is_readed: false,
      };

      const { error } = await supabase
        .from("kritik_saran")
        .insert([dataToSubmit]);

      if (error) throw error;

      // Show success state
      setShowSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          nama: "",
          no_hp: "",
          unit_pelayanan_id: "",
          kategori_id: "",
          pesan: "",
          rating: 0,
          is_anonymus: false,
        });
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting kritik saran:", error);
      alert("Gagal mengirim kritik & saran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            {/* Banner Skeleton */}
            <div className="h-48 bg-gray-200 rounded-3xl mb-12"></div>

            {/* Form Container Skeleton */}
            <div className="mb-4 py-4">
              <div className="max-w-4xl mx-auto px-4 relative">
                {/* Blue Background */}
                <div className="absolute -bottom-4 left-0 right-0 bg-mariner-500 rounded-3xl h-1/2"></div>

                {/* White Form Container */}
                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12 mt-12">
                  {/* Title Skeleton */}
                  <div className="text-center mb-8">
                    <div className="h-6 w-24 bg-gray-200 rounded-full mx-auto mb-3"></div>
                    <div className="h-8 w-64 bg-gray-200 rounded-lg mx-auto"></div>
                  </div>

                  <div className="space-y-6">
                    {/* Anonymous Checkbox Skeleton */}
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      <div className="h-4 w-80 bg-gray-200 rounded"></div>
                    </div>

                    {/* Name and Phone Row Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                      </div>
                      <div>
                        <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>

                    {/* Unit and Category Row Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                      </div>
                      <div>
                        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                        <div className="h-12 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>

                    {/* Rating Skeleton */}
                    <div>
                      <div className="h-4 w-48 bg-gray-200 rounded mb-3"></div>
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="h-10 w-10 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>

                    {/* Message Skeleton */}
                    <div>
                      <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-32 bg-gray-200 rounded-xl"></div>
                    </div>

                    {/* Submit Button Skeleton */}
                    <div className="pt-4">
                      <div className="h-14 bg-gray-200 rounded-xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Banner */}
        <Banner
          title="Kritik & Saran"
          subtitle="Suara Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan"
        />

        <div className="mb-4 py-4 mt-12">
          <div className="max-w-4xl mx-auto px-4 relative">
            {/* Blue Background - Only half height */}
            <div className="absolute -bottom-4 left-0 right-0 bg-mariner-500 rounded-3xl h-1/2"></div>

            {/* White Form Container */}
            <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 md:p-12">
              {showSuccess ? (
                // Success State
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Terima Kasih!
                  </h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Kritik dan saran Anda telah berhasil terkirim. Kami akan
                    menindaklanjuti masukan Anda untuk meningkatkan kualitas
                    layanan kami.
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <Title
                      badge="Formulir"
                      title="Formulir Kritik & Saran"
                      badgeVariant="default"
                      align="center"
                    />
                  </div>

                  <div className="space-y-6">
                    {/* Anonymous Checkbox */}
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                      <input
                        type="checkbox"
                        id="is_anonymus"
                        name="is_anonymus"
                        checked={formData.is_anonymus}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="is_anonymus"
                        className="text-gray-700 font-medium cursor-pointer"
                      >
                        Kirim sebagai anonim (Nama dan No HP tidak diperlukan)
                      </label>
                    </div>

                    {/* Name and Phone Row */}
                    {!formData.is_anonymus && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="Nama Lengkap"
                          name="nama"
                          placeholder="Masukkan nama lengkap"
                          value={formData.nama}
                          onChange={handleInputChange}
                          error={errors.nama}
                          required
                          disabled={isSubmitting}
                        />
                        <Input
                          label="No HP"
                          name="no_hp"
                          type="tel"
                          placeholder="08123456789"
                          value={formData.no_hp}
                          onChange={handleInputChange}
                          error={errors.no_hp}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {/* Unit and Category Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Select
                        label="Unit Pelayanan"
                        placeholder="Pilih Unit Pelayanan"
                        value={formData.unit_pelayanan_id}
                        onChange={(value) =>
                          handleSelectChange("unit_pelayanan_id", value)
                        }
                        options={unitPelayananList.map((u) => ({
                          value: u.id,
                          label: u.title,
                        }))}
                        error={errors.unit_pelayanan_id}
                        required
                        disabled={isSubmitting}
                        searchable
                      />
                      <Select
                        label="Kategori"
                        placeholder="Pilih Kategori"
                        value={formData.kategori_id}
                        onChange={(value) =>
                          handleSelectChange("kategori_id", value)
                        }
                        options={kategoriList.map((k) => ({
                          value: k.id,
                          label: k.title,
                        }))}
                        error={errors.kategori_id}
                        required
                        disabled={isSubmitting}
                        searchable
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Rating Kepuasan (Opsional)
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(star)}
                            disabled={isSubmitting}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-10 w-10 cursor-pointer transition-colors ${
                                star <= formData.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300 hover:text-yellow-200"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <Textarea
                      label="Kritik & Saran"
                      name="pesan"
                      placeholder="Tuliskan kritik dan saran Anda di sini..."
                      value={formData.pesan}
                      onChange={handleInputChange}
                      error={errors.pesan}
                      required
                      rows={5}
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
                        {isSubmitting ? (
                          "Mengirim..."
                        ) : (
                          <>
                            Kirim Kritik & Saran
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KritikSaran;
