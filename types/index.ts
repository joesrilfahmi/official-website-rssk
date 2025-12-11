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