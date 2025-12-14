// types/index.ts

// ============================================
// USER TYPES
// ============================================
export type UserRole = 'administrator' | 'user';
export type UserStatus = 'active' | 'inactive';

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
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// ============================================
// KAMAR INAP TYPES
// ============================================
export interface KamarInap {
  id: string;
  title: string;
  description: string;
  price: number;
  facilities: string[];
  is_recommended: boolean;
  urutan: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// BERITA TYPES
// ============================================
export type BeritaStatus = 'active' | 'non_active' | 'draft';

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
export type PromoStatus = 'active' | 'non_active';

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
export interface Poli {
  id: string;
  nama_poli: string;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

// ============================================
// DOKTER TYPES
// ============================================
export type DokterStatus = 'active' | 'inactive' | 'cuti' | 'libur';
export type HariType = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
export type SortField = 'nama' | 'poli' | 'status' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface Dokter {
  id: string;
  gelar_depan: string | null;
  nama: string;
  gelar_belakang: string | null;
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
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface DokterWithRelations extends Dokter {
  poli_detail?: Poli;
  jadwal?: JadwalDokter[];
  created_by_user?: User;
  updated_by_user?: User;
}

export interface JadwalFormData {
  id?: string;
  hari: HariType | '';
  jam_mulai: string;
  jam_selesai: string;
  _temp_id: string;
}

export interface DokterFormData {
  gelar_depan: string;
  nama: string;
  gelar_belakang: string;
  poli_id: string;
  profile: string;
  status: DokterStatus;
  profileFile: File | null;
  profileDeleted: boolean;
  jadwal: JadwalFormData[];
}

export interface DokterFormErrors {
  nama: string;
  poli_id: string;
  jadwal: string;
}

// ============================================
// KRITIK & SARAN TYPES
// ============================================
export type KritikSaranStatus = 'read' | 'unread';

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
  kategori_id: string;
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
  kategori?: Kategori;
}

export interface KritikSaranFormData {
  nama: string;
  no_hp: string;
  unit_pelayanan_id: string;
  kategori_id: string;
  pesan: string;
  rating: number | null;
  is_anonymus: boolean;
}

export interface KritikSaranFormErrors {
  nama: string;
  no_hp: string;
  unit_pelayanan_id: string;
  kategori_id: string;
  pesan: string;
  rating: string;
}

export type KritikSaranSortField = 'nama' | 'kategori' | 'unit_pelayanan' | 'status' | 'rating' | 'created_at';
export type KritikSaranSortOrder = 'asc' | 'desc';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}