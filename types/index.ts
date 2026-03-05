// types/index.ts

// ============================================
// USER TYPES
// ============================================
export type UserRole = "administrator" | "user";
export type UserStatus = "active" | "inactive";

export interface User {
  id: string;
  nama: string;
  username: string;
  password?: string;
  id_telegram?: string;
  email?: string;
  nomor_telepon?: string;
  role: UserRole;
  status_users: UserStatus;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  nama: string;
  username: string;
  password: string;
  confirmPassword: string;
  nomor_telepon?: string;
  id_telegram?: string;
  email?: string;
}

// ============================================
// LAYANAN UNGGULAN TYPES
// ============================================
export interface LayananUnggulan {
  id: string;
  icon: string;
  title: string;
  description: string;
  urutan: number;
  status: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
}

// ============================================
// KAMAR INAP TYPES
// ============================================
export type KamarInapStatus = "active" | "inactive";

export interface KamarInap {
  id: string;
  title: string;
  description: string;
  price: number;
  facilities: string[];
  is_recommended: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface KamarInapWithCreator extends KamarInap {
  created_by_user?: {
    id: string;
    nama: string;
    username: string;
    avatar?: string;
  };
  updated_by_user?: {
    id: string;
    nama: string;
    username: string;
    avatar?: string;
  };
}

export interface KamarInapFormData {
  title: string;
  description: string;
  price: string;
  facilities: string[];
  is_recommended: boolean;
  imageFile: File | null;
  imageDeleted: boolean;
  image: string;
}

export interface KamarInapFormErrors {
  title: string;
  description: string;
  price: string;
  facilities: string;
}

export type KamarInapSortField =
  | "title"
  | "price"
  | "is_recommended"
  | "created_at";
export type KamarInapSortOrder = "asc" | "desc";

// ============================================
// BERITA TYPES
// ============================================
export type BeritaStatus = "active" | "non_active" | "draft";

export interface Berita {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string | null;
  status: BeritaStatus;
  author: string;
  created_at: string;
  updated_at: string;
}

export interface BeritaWithAuthor extends Berita {
  author_detail?: {
    id: string;
    nama: string;
    username: string;
    avatar?: string;
  };
}

// ============================================
// PROMO TYPES
// ============================================
export type PromoStatus = "active" | "non_active";

export interface Promo {
  id: string;
  picture: string | null;
  title: string;
  description: string;
  status: PromoStatus;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface PromoWithCreator extends Promo {
  created_by_user?: {
    id: string;
    nama: string;
    username: string;
    avatar?: string;
  };
  updated_by_user?: {
    id: string;
    nama: string;
    username: string;
    avatar?: string;
  };
}

// ============================================
// POLI TYPES
// ============================================
export type PoliStatus = "active" | "inactive";

export interface Poli {
  id: string;
  nama_poli: string;
  icon: string;
  description: string;
  urutan: number;
  status: PoliStatus;
  created_at?: string;
  updated_at?: string;
}

export interface PoliFormData {
  nama_poli: string;
  icon: string;
  description: string;
  urutan: number;
  status: PoliStatus;
}

export interface PoliFormErrors {
  nama_poli: string;
  icon: string;
  description: string;
  urutan: string;
}

export type PoliSortField = "nama_poli" | "urutan" | "created_at";
export type PoliSortOrder = "asc" | "desc";

// ============================================
// DOKTER TYPES
// ============================================
export type DokterStatus = "active" | "inactive" | "cuti" | "libur";
export type HariType =
  | "Senin"
  | "Selasa"
  | "Rabu"
  | "Kamis"
  | "Jumat"
  | "Sabtu"
  | "Minggu";
export type JadwalType = "reguler" | "eksekutif";
export type SortField = "nama" | "poli" | "status" | "created_at";
export type SortOrder = "asc" | "desc";

export interface Dokter {
  id: string;
  nama: string;
  poli_id: string;
  profile: string | null;
  status: DokterStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface JadwalDokter {
  id: string;
  dokter_id: string;
  hari: HariType;
  jam_mulai: string;
  jam_selesai: string;
  tipe_jadwal: JadwalType;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface PendidikanDokter {
  id?: string;
  dokter_id?: string;
  tahun: string;
  institusi: string;
  deskripsi?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface OrganisasiDokter {
  id?: string;
  dokter_id?: string;
  tahun: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface PublikasiDokter {
  id?: string;
  dokter_id?: string;
  tahun: string;
  title: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

// ✅ Tipe data Pelatihan Dokter (sesuai tabel pelatihan_dokter)
export interface PelatihanDokter {
  id?: string;
  dokter_id?: string;
  tahun: string;
  institusi: string;
  deskripsi?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface DokterWithRelations extends Dokter {
  poli_detail?: Poli;
  jadwal?: JadwalDokter[];
  pendidikan?: PendidikanDokter[];
  organisasi?: OrganisasiDokter[];
  publikasi?: PublikasiDokter[];
  pelatihan?: PelatihanDokter[]; // ✅ BARU
  created_by_user?: User;
  updated_by_user?: User;
}

export interface JadwalFormData {
  id?: string;
  hari: HariType | "";
  jam_mulai: string;
  jam_selesai: string;
  tipe_jadwal: JadwalType;
  _temp_id: string;
}

export interface PendidikanFormData {
  id?: string;
  tahun: string;
  institusi: string;
  deskripsi: string;
  _temp_id: string;
}

export interface OrganisasiFormData {
  id?: string;
  tahun: string;
  title: string;
  _temp_id: string;
}

export interface PublikasiFormData {
  id?: string;
  tahun: string;
  title: string;
  _temp_id: string;
}

// ✅ Form data Pelatihan (sesuai tabel pelatihan_dokter)
export interface PelatihanFormData {
  id?: string;
  tahun: string;
  institusi: string;
  deskripsi: string;
  _temp_id: string;
}

export interface DokterFormData {
  nama: string;
  poli_id: string;
  profile: string;
  status: DokterStatus;
  profileFile: File | null;
  profileDeleted: boolean;
  jadwal: JadwalFormData[];
  pendidikan: PendidikanFormData[];
  organisasi: OrganisasiFormData[];
  publikasi: PublikasiFormData[];
  pelatihan: PelatihanFormData[]; // ✅ BARU
}

export interface DokterFormErrors {
  nama: string;
  poli_id: string;
  jadwal: string;
  pendidikan: string;
  organisasi: string;
  publikasi: string;
  pelatihan: string; // ✅ BARU
}

// ============================================
// KRITIK & SARAN TYPES
// ============================================
export type KritikSaranStatus = "read" | "unread";

export interface Kategori {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface UnitPelayanan {
  id: string;
  title: string;
  created_at?: string;
  updated_at?: string;
}

export interface KritikSaran {
  id: string;
  nama: string;
  no_hp: string;
  unit_pelayanan_id: string;
  pesan: string;
  status: KritikSaranStatus;
  rating: number | null;
  is_anonymus: boolean;
  is_readed: boolean;
  created_at: string;
  updated_at: string;
}

export interface KritikSaranWithRelations extends KritikSaran {
  unit_pelayanan?: UnitPelayanan;
}

export interface KritikSaranFormData {
  nama: string;
  no_hp: string;
  unit_pelayanan_id: string;
  pesan: string;
  rating: number | null;
  is_anonymus: boolean;
}

export interface KritikSaranFormErrors {
  nama: string;
  no_hp: string;
  unit_pelayanan_id: string;
  pesan: string;
  rating: string;
}

export type KritikSaranSortField =
  | "nama"
  | "unit_pelayanan"
  | "status"
  | "rating"
  | "created_at";
export type KritikSaranSortOrder = "asc" | "desc";

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
