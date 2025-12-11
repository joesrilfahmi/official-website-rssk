// ============================================
// FILE: src/lib/auth.ts
// Authentication helper functions
// ============================================

import { supabase } from './supabase/client';
import { LoginCredentials, RegisterData, User } from '@/types';
import bcrypt from 'bcryptjs';

/**
 * Login user with username and password
 */
export async function login(credentials: LoginCredentials): Promise<User | null> {
  try {
    // Fetch user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', credentials.username)
      .single();

    if (error || !user) {
      throw new Error('Username atau password salah');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Username atau password salah');
    }

    // Check if user is active
    if (user.status_users !== 'active') {
      throw new Error('Akun Anda tidak aktif');
    }

    // Store user in localStorage
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    }

    return userWithoutPassword;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Register new user
 */
export async function register(data: RegisterData): Promise<User> {
  try {
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', data.username)
      .single();

    if (existingUser) {
      throw new Error('Username sudah digunakan');
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('email')
        .eq('email', data.email)
        .single();

      if (existingEmail) {
        throw new Error('Email sudah digunakan');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Prepare user data
    const userData = {
      nama: data.nama,
      username: data.username,
      password: hashedPassword,
      email: data.email || null,
      nomor_telepon: data.nomor_telepon || null,
      id_telegram: data.id_telegram || null,
      role: 'user', // Default role is always 'user'
      status_users: 'inactive', // Default status is 'inactive'
    };

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(error.message || 'Gagal membuat akun');
    }

    return newUser;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}

/**
 * Logout user
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

/**
 * Get current logged in user
 */
export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}