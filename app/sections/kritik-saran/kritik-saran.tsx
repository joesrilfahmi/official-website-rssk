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

interface UnitPelayanan {
  id: string;
  title: string;
}

const KritikSaran = () => {
  const [unitPelayananList, setUnitPelayananList] = useState<UnitPelayanan[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    nama: "",
    no_hp: "",
    unit_pelayanan_id: "",
    pesan: "",
    rating: 0,
    is_anonymus: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchUnitPelayanan = async () => {
      try {
        const { data, error } = await supabase
          .from("unit_pelayanan")
          .select("*")
          .order("title", { ascending: true });
        if (error) throw error;
        setUnitPelayananList(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUnitPelayanan();
    const channel = supabase
      .channel("unit_pelayanan_public")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "unit_pelayanan" },
        () => fetchUnitPelayanan(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.is_anonymus) {
      if (!formData.nama.trim()) newErrors.nama = "Nama wajib diisi";
      if (!formData.no_hp.trim()) newErrors.no_hp = "No HP wajib diisi";
      else if (!/^[0-9]{10,15}$/.test(formData.no_hp))
        newErrors.no_hp = "No HP tidak valid (10-15 digit)";
    }
    if (!formData.unit_pelayanan_id)
      newErrors.unit_pelayanan_id = "Unit pelayanan wajib dipilih";
    if (!formData.pesan.trim()) newErrors.pesan = "Pesan wajib diisi";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("kritik_saran").insert([
        {
          nama: formData.is_anonymus ? "Anonim" : formData.nama.trim(),
          no_hp: formData.is_anonymus ? "000000000000" : formData.no_hp.trim(),
          unit_pelayanan_id: formData.unit_pelayanan_id,
          pesan: formData.pesan.trim(),
          rating: formData.rating > 0 ? formData.rating : null,
          is_anonymus: formData.is_anonymus,
          status: "unread",
          is_readed: false,
        },
      ]);
      if (error) throw error;
      setShowSuccess(true);
      setTimeout(() => {
        setFormData({
          nama: "",
          no_hp: "",
          unit_pelayanan_id: "",
          pesan: "",
          rating: 0,
          is_anonymus: false,
        });
        setShowSuccess(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      alert("Gagal mengirim kritik & saran. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Banner
          title="Kritik & Saran"
          subtitle="Suara Anda sangat berarti bagi kami untuk terus meningkatkan kualitas layanan"
        />

        <div className="mt-12 max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl ring-1 ring-gray-100 shadow-sm overflow-hidden">
            <div className="p-7 sm:p-10">
              {/* Loading */}
              {loading && (
                <div className="animate-pulse space-y-6">
                  <div className="h-5 w-20 bg-gray-100 rounded-full mx-auto" />
                  <div className="h-8 w-56 bg-gray-100 rounded mx-auto" />
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded-xl" />
                  ))}
                  <div className="h-28 bg-gray-100 rounded-xl" />
                  <div className="h-12 bg-gray-100 rounded-xl" />
                </div>
              )}

              {/* Success */}
              {!loading && showSuccess && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-greenfresh-50 rounded-full mb-6 ring-4 ring-greenfresh-100">
                    <CheckCircle className="w-10 h-10 text-greenfresh-500" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-800 mb-2">
                    Terima Kasih!
                  </h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
                    Kritik dan saran Anda telah berhasil terkirim. Kami akan
                    menindaklanjuti masukan Anda.
                  </p>
                </div>
              )}

              {/* Form */}
              {!loading && !showSuccess && (
                <>
                  <div className="text-center mb-8">
                    <Title
                      badge="Formulir"
                      title="Formulir Kritik & Saran"
                      badgeVariant="default"
                      align="center"
                    />
                  </div>

                  <div className="space-y-5">
                    {/* Anonymous toggle */}
                    <label
                      htmlFor="is_anonymus"
                      className="flex items-center gap-3 p-4 bg-mariner-50 rounded-xl cursor-pointer ring-1 ring-mariner-100 hover:ring-mariner-300 transition-all"
                    >
                      <input
                        type="checkbox"
                        id="is_anonymus"
                        name="is_anonymus"
                        checked={formData.is_anonymus}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded text-mariner-600 focus:ring-mariner-400 shrink-0"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Kirim sebagai anonim{" "}
                        <span className="text-gray-400 font-normal">
                          (nama & nomor HP tidak diperlukan)
                        </span>
                      </span>
                    </label>

                    {/* Name + phone */}
                    {!formData.is_anonymus && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                    {/* Unit pelayanan */}
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

                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Rating Kepuasan{" "}
                        <span className="text-gray-400 font-normal">
                          (opsional)
                        </span>
                      </label>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                rating: p.rating === star ? 0 : star,
                              }))
                            }
                            disabled={isSubmitting}
                            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              className={`w-9 h-9 transition-colors ${star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 hover:text-yellow-200"}`}
                            />
                          </button>
                        ))}
                        {formData.rating > 0 && (
                          <span className="ml-2 self-center text-sm text-gray-400">
                            {
                              [
                                "",
                                "Sangat Buruk",
                                "Buruk",
                                "Cukup",
                                "Baik",
                                "Sangat Baik",
                              ][formData.rating]
                            }
                          </span>
                        )}
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

                    {/* Submit */}
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full justify-center bg-mariner-500 hover:bg-mariner-600"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        "Mengirim..."
                      ) : (
                        <>
                          Kirim Kritik & Saran{" "}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
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
