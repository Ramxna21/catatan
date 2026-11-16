import React, { useState, useRef } from 'react';
import {
  Camera,
  Check,
  Heart,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  User,
  X
} from 'lucide-react';
import { User as UserType } from '../types';
import { AVATAR_PRESETS, compressImageFile } from '../lib/avatars';
import { updateUserProfile } from '../lib/auth';

interface ProfileModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateUser
}) => {
  const [name, setName] = useState(user.name);
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(user.avatar);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran foto maksimal 5 MB.');
      return;
    }

    setError('');
    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 256);
      setSelectedAvatar(compressedDataUrl);
      setSuccess('Foto berhasil dimuat! Klik Simpan Perubahan di bawah.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses gambar.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama panggilan tidak boleh kosong.');
      return;
    }

    try {
      const updated = updateUserProfile(user.id, {
        name: name.trim(),
        avatar: selectedAvatar
      });
      onUpdateUser(updated);
      onClose();
    } catch {
      setError('Gagal menyimpan profil.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative my-6 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-800 animate-scale-in sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between border-b border-gray-100 pb-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Profil & Avatar Pengguna
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih avatar warna-warni yang estetik atau unggah foto Anda sendiri.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Preview & Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-pink-50/70 p-4 dark:from-pink-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border border-pink-100 dark:border-pink-900/30">
            <div className="relative group shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl dark:border-gray-700 bg-pink-100 dark:bg-gray-700 flex items-center justify-center">
                {selectedAvatar ? (
                  <img
                    src={selectedAvatar}
                    alt={name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-pink-400" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-pink-600 text-white shadow-md hover:bg-pink-700 transition"
                title="Ganti foto dari file"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700 transition"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 text-pink-500" />
                      Upload Foto
                    </>
                  )}
                </button>

                {selectedAvatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(undefined);
                      setSuccess('');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hapus Foto
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Format JPG, PNG, atau WebP (maks 5MB). Otomatis di-crop persegi.
              </p>
            </div>
          </div>

          {/* Preset Avatars Grid */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              Pilih Avatar Karakter Berwarna:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 max-h-48 overflow-y-auto p-1 rounded-2xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedAvatar === preset.svgDataUri;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(preset.svgDataUri);
                      setError('');
                    }}
                    title={preset.label}
                    className={`relative flex flex-col items-center justify-center p-1 rounded-2xl transition hover:scale-110 active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-pink-500 bg-pink-100/50 dark:bg-pink-950/40'
                        : 'hover:bg-white dark:hover:bg-gray-800'
                    }`}
                  >
                    <img
                      src={preset.svgDataUri}
                      alt={preset.label}
                      className="h-11 w-11 rounded-full shadow-sm"
                    />
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-pink-600 text-white shadow">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Nama & Email */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="profile-name"
                className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400"
              >
                Nama Panggilan
              </label>
              <input
                id="profile-name"
                type="text"
                required
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                placeholder="Nama Anda"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Alamat Email (Akun)
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/80 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:from-pink-600 hover:to-purple-700 active:scale-95 transition"
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
