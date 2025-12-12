// ============================================
// FILE: src/types/index.ts
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

export type BeritaStatus = 'active' | 'non_active' | 'draft';

export interface Berita {
  id: string;
  title: string;
  slug: string;
  description: string; // Markdown content
  category: string;
  thumbnail: string | null;
  status: BeritaStatus;
  author: string; // UUID of user
  created_at: string;
  updated_at: string;
}

export interface BeritaWithAuthor extends Berita {
  author_detail?: {
    id: string;
    nama: string;
    username: string;
    avatar: string | null;
  };
}

export interface BeritaFormData {
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnail: string;
  status: BeritaStatus;
}

export interface BeritaFilters {
  status?: BeritaStatus;
  category?: string;
  author?: string;
  search?: string;
}