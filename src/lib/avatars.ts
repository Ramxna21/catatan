/**
 * Koleksi Preset Avatar Berwarna & Utilitas Foto Profil Kenang
 */

export interface AvatarPreset {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  svgDataUri: string;
}

function makeSvgAvatar(emoji: string, bg1: string, bg2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
  </defs>
  <circle cx="50" cy="50" r="50" fill="url(#grad)" />
  <text x="50" y="62" font-size="52" text-anchor="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', sans-serif">${emoji}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'cat',
    label: 'Kucing Manja',
    emoji: '🐱',
    gradient: 'from-amber-400 to-orange-500',
    svgDataUri: makeSvgAvatar('🐱', '#fbbf24', '#f97316')
  },
  {
    id: 'bunny',
    label: 'Kelinci Ceria',
    emoji: '🐰',
    gradient: 'from-pink-400 to-rose-500',
    svgDataUri: makeSvgAvatar('🐰', '#f472b6', '#f43f5e')
  },
  {
    id: 'fox',
    label: 'Rubah Pintar',
    emoji: '🦊',
    gradient: 'from-orange-400 to-red-500',
    svgDataUri: makeSvgAvatar('🦊', '#fb923c', '#ef4444')
  },
  {
    id: 'panda',
    label: 'Panda Tenang',
    emoji: '🐼',
    gradient: 'from-emerald-400 to-teal-600',
    svgDataUri: makeSvgAvatar('🐼', '#34d399', '#0d9488')
  },
  {
    id: 'bear',
    label: 'Beruang Hangat',
    emoji: '🐻',
    gradient: 'from-amber-500 to-yellow-700',
    svgDataUri: makeSvgAvatar('🐻', '#f59e0b', '#b45309')
  },
  {
    id: 'puppy',
    label: 'Anjing Setia',
    emoji: '🐶',
    gradient: 'from-sky-400 to-blue-600',
    svgDataUri: makeSvgAvatar('🐶', '#38bdf8', '#2563eb')
  },
  {
    id: 'sakura',
    label: 'Bunga Sakura',
    emoji: '🌸',
    gradient: 'from-pink-300 to-purple-500',
    svgDataUri: makeSvgAvatar('🌸', '#f9a8d4', '#a855f7')
  },
  {
    id: 'sunflower',
    label: 'Bunga Matahari',
    emoji: '🌻',
    gradient: 'from-yellow-400 to-amber-600',
    svgDataUri: makeSvgAvatar('🌻', '#facc15', '#d97706')
  },
  {
    id: 'butterfly',
    label: 'Kupu-kupu Mimpi',
    emoji: '🦋',
    gradient: 'from-indigo-400 to-purple-600',
    svgDataUri: makeSvgAvatar('🦋', '#818cf8', '#9333ea')
  },
  {
    id: 'rainbow',
    label: 'Pelangi Harapan',
    emoji: '🌈',
    gradient: 'from-cyan-400 to-pink-500',
    svgDataUri: makeSvgAvatar('🌈', '#22d3ee', '#ec4899')
  },
  {
    id: 'star',
    label: 'Bintang Berkilau',
    emoji: '✨',
    gradient: 'from-purple-500 to-indigo-700',
    svgDataUri: makeSvgAvatar('✨', '#a855f7', '#4338ca')
  },
  {
    id: 'coffee',
    label: 'Kopi Hangat',
    emoji: '☕',
    gradient: 'from-stone-500 to-amber-900',
    svgDataUri: makeSvgAvatar('☕', '#78716c', '#78350f')
  },
  {
    id: 'music',
    label: 'Melodi Hati',
    emoji: '🎵',
    gradient: 'from-fuchsia-500 to-pink-600',
    svgDataUri: makeSvgAvatar('🎵', '#d946ef', '#db2777')
  },
  {
    id: 'art',
    label: 'Jiwa Seni',
    emoji: '🎨',
    gradient: 'from-rose-400 to-orange-500',
    svgDataUri: makeSvgAvatar('🎨', '#fb7185', '#f97316')
  },
  {
    id: 'leaf',
    label: 'Daun Sejuk',
    emoji: '🌿',
    gradient: 'from-lime-400 to-emerald-600',
    svgDataUri: makeSvgAvatar('🌿', '#a3e635', '#059669')
  },
  {
    id: 'rocket',
    label: 'Penjelajah Bintang',
    emoji: '🚀',
    gradient: 'from-violet-600 to-slate-900',
    svgDataUri: makeSvgAvatar('🚀', '#7c3aed', '#0f172a')
  }
];

/**
 * Kompres dan ubah foto upload menjadi data URL persegi yang pas dan hemat penyimpanan
 */
export function compressImageFile(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan gambar.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.width;
          const height = img.height;

          // Ambil crop persegi dari tengah
          const size = Math.min(width, height);
          const startX = (width - size) / 2;
          const startY = (height - size) / 2;

          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, startX, startY, size, size, 0, 0, maxSize, maxSize);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Gagal memuat file gambar.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}
