import { User } from '../types';
import {
  LEGACY_STORAGE_KEYS,
  STORAGE_KEYS,
  readJSON,
  safeGet,
  safeRemove,
  safeSet,
  writeJSON
} from './storage';

interface StoredAccount extends User {
  passwordHash?: string;
  salt?: string;
}

export type AuthErrorCode =
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'NAME_REQUIRED'
  | 'CRYPTO_UNAVAILABLE'
  | 'STORAGE_FAILED';

export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

const PBKDF2_ITERATIONS = 120_000;
const GUEST_ID = 'guest_kenang';

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  EMAIL_EXISTS: 'Email sudah terdaftar. Silakan masuk dengan akun tersebut.',
  INVALID_CREDENTIALS: 'Email atau password salah. Silakan coba lagi.',
  INVALID_EMAIL: 'Format email belum benar.',
  WEAK_PASSWORD: 'Password minimal 6 karakter.',
  NAME_REQUIRED: 'Nama panggilan wajib diisi.',
  CRYPTO_UNAVAILABLE: 'Browser ini tidak mendukung penyimpanan password yang aman.',
  STORAGE_FAILED: 'Penyimpanan browser penuh atau tidak dapat diakses.'
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readAccounts(): StoredAccount[] {
  const accounts = readJSON<StoredAccount[]>(STORAGE_KEYS.accounts, []);
  if (!Array.isArray(accounts)) return [];
  return accounts.filter(
    (account): account is StoredAccount =>
      !!account &&
      typeof account === 'object' &&
      typeof account.id === 'string' &&
      typeof account.email === 'string'
  );
}

function writeAccounts(accounts: StoredAccount[]): void {
  if (!writeJSON(STORAGE_KEYS.accounts, accounts)) {
    throw new AuthError('STORAGE_FAILED', AUTH_ERROR_MESSAGES.STORAGE_FAILED);
  }
}

function toPublicUser(account: StoredAccount): User {
  return {
    id: account.id,
    email: account.email,
    name: account.name,
    avatar: account.avatar,
    provider: account.provider,
    createdAt: account.createdAt
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function createSalt(): string {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytesToHex(bytes);
}

/**
 * Fallback hash untuk browser tanpa WebCrypto (mis. konteks non-HTTPS).
 * Bukan pengganti PBKDF2, tetapi tetap jauh lebih baik daripada menyimpan
 * password dalam bentuk teks biasa.
 */
function fallbackHash(password: string, salt: string): string {
  let hash = 2166136261;
  const input = `${salt}:${password}`;
  for (let round = 0; round < 5_000; round += 1) {
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
  }
  return `fallback:${(hash >>> 0).toString(16)}`;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    return fallbackHash(password, salt);
  }

  const encoder = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const saltBytes = new Uint8Array(
    (salt.match(/.{1,2}/g) ?? []).map((byte) => parseInt(byte, 16))
  );

  const bits = await globalThis.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(bits));
}

function createId(prefix: string): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function setSession(userId: string): void {
  safeSet(STORAGE_KEYS.session, userId);
}

export function clearSession(): void {
  safeRemove(STORAGE_KEYS.session);
}

function migrateLegacyUser(accounts: StoredAccount[]): StoredAccount | null {
  if (accounts.length > 0) return null;

  const legacy = readJSON<Partial<User> | null>(LEGACY_STORAGE_KEYS.user, null);
  if (!legacy || typeof legacy.id !== 'string' || typeof legacy.email !== 'string') {
    return null;
  }

  const account: StoredAccount = {
    id: legacy.id,
    email: legacy.email,
    name: legacy.name || legacy.email.split('@')[0],
    avatar: legacy.avatar,
    provider: legacy.provider === 'google' ? 'google' : 'email',
    createdAt: legacy.createdAt || new Date().toISOString()
  };

  writeAccounts(accounts.concat(account));
  safeRemove(LEGACY_STORAGE_KEYS.user);
  setSession(account.id);
  return account;
}

export function getCurrentUser(): User | null {
  const accounts = readAccounts();
  const migrated = migrateLegacyUser(accounts);
  if (migrated) return toPublicUser(migrated);

  const sessionId = safeGet(STORAGE_KEYS.session);
  if (!sessionId) return null;

  const account = accounts.find((item) => item.id === sessionId);
  if (!account) {
    clearSession();
    return null;
  }
  return toPublicUser(account);
}

export async function prepareRegistration(
  name: string,
  email: string,
  password: string
): Promise<{ name: string; email: string; passwordHash: string; salt: string }> {
  const cleanName = name.trim();
  const cleanEmail = normalizeEmail(email);

  if (!cleanName) throw new AuthError('NAME_REQUIRED', AUTH_ERROR_MESSAGES.NAME_REQUIRED);
  if (!isValidEmail(cleanEmail)) {
    throw new AuthError('INVALID_EMAIL', AUTH_ERROR_MESSAGES.INVALID_EMAIL);
  }
  if (password.length < 6) {
    throw new AuthError('WEAK_PASSWORD', AUTH_ERROR_MESSAGES.WEAK_PASSWORD);
  }

  const accounts = readAccounts();
  if (accounts.some((account) => account.email === cleanEmail)) {
    throw new AuthError('EMAIL_EXISTS', AUTH_ERROR_MESSAGES.EMAIL_EXISTS);
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(password, salt);

  return { name: cleanName, email: cleanEmail, passwordHash, salt };
}

export function completeRegistrationWithHash(
  name: string,
  email: string,
  passwordHash: string,
  salt: string
): User {
  const cleanEmail = normalizeEmail(email);
  const accounts = readAccounts();
  if (accounts.some((account) => account.email === cleanEmail)) {
    throw new AuthError('EMAIL_EXISTS', AUTH_ERROR_MESSAGES.EMAIL_EXISTS);
  }

  const account: StoredAccount = {
    id: createId('usr'),
    email: cleanEmail,
    name: name.trim(),
    provider: 'email',
    createdAt: new Date().toISOString(),
    passwordHash,
    salt
  };

  writeAccounts(accounts.concat(account));
  setSession(account.id);
  return toPublicUser(account);
}

export async function registerAccount(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const prep = await prepareRegistration(name, email, password);
  return completeRegistrationWithHash(prep.name, prep.email, prep.passwordHash, prep.salt);
}

export async function loginWithPassword(email: string, password: string): Promise<User> {
  const cleanEmail = normalizeEmail(email);
  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === cleanEmail);

  if (!account) {
    throw new AuthError('INVALID_CREDENTIALS', AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Akun lama (migrasi localStorage versi 1) belum punya password.
  // Password yang dimasukkan saat login pertama kali akan dipakai untuk mengamankan akun.
  if (!account.passwordHash || !account.salt) {
    if (account.id === GUEST_ID) {
      throw new AuthError('INVALID_CREDENTIALS', AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
    }
    const salt = createSalt();
    const passwordHash = await hashPassword(password, salt);
    const upgraded: StoredAccount = { ...account, salt, passwordHash };
    writeAccounts(accounts.map((item) => (item.id === account.id ? upgraded : item)));
    setSession(upgraded.id);
    return toPublicUser(upgraded);
  }

  const hash = await hashPassword(password, account.salt);
  if (hash !== account.passwordHash) {
    throw new AuthError('INVALID_CREDENTIALS', AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  setSession(account.id);
  return toPublicUser(account);
}

export function loginAsGuest(): User {
  const accounts = readAccounts();
  let account = accounts.find((item) => item.id === GUEST_ID);

  if (!account) {
    account = {
      id: GUEST_ID,
      email: 'tamu@kenang.local',
      name: 'Tamu Kenang',
      provider: 'google',
      createdAt: new Date().toISOString()
    };
    writeAccounts(accounts.concat(account));
  }

  setSession(account.id);
  return toPublicUser(account);
}

export function logout(): void {
  clearSession();
}

/**
 * Perbarui profil pengguna (nama atau foto avatar)
 */
export function updateUserProfile(
  userId: string,
  updates: { name?: string; avatar?: string }
): User {
  const accounts = readAccounts();
  const account = accounts.find((item) => item.id === userId);
  if (!account) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  const updated: StoredAccount = {
    ...account,
    name: updates.name ? updates.name.trim() : account.name,
    avatar: updates.avatar !== undefined ? updates.avatar : account.avatar
  };

  writeAccounts(accounts.map((item) => (item.id === userId ? updated : item)));
  return toPublicUser(updated);
}

/**
 * Cek apakah email terdaftar untuk alur reset password
 */
export function checkAccountExists(email: string): boolean {
  const cleanEmail = normalizeEmail(email);
  const accounts = readAccounts();
  return accounts.some((account) => account.email === cleanEmail);
}

/**
 * Reset password dengan hash baru dan login otomatis
 */
export async function resetPasswordWithHash(email: string, newPassword: string): Promise<User> {
  const cleanEmail = normalizeEmail(email);
  const accounts = readAccounts();
  const account = accounts.find((item) => item.email === cleanEmail);

  if (!account) {
    throw new AuthError('INVALID_CREDENTIALS', 'Akun dengan email ini tidak ditemukan.');
  }

  if (newPassword.length < 6) {
    throw new AuthError('WEAK_PASSWORD', AUTH_ERROR_MESSAGES.WEAK_PASSWORD);
  }

  const salt = createSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  const updated: StoredAccount = { ...account, salt, passwordHash };

  writeAccounts(accounts.map((item) => (item.id === account.id ? updated : item)));
  setSession(updated.id);
  return toPublicUser(updated);
}
