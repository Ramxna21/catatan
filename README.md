# 🌸 Kenang — Catatan Hati

Aplikasi diary digital yang personal untuk menyimpan kenangan, memantau mood, dan merawat kebiasaan menulis. Dibangun dengan React + TypeScript + Tailwind CSS, berjalan sepenuhnya di browser tanpa server.

## ✨ Fitur

### 📝 Menulis & membaca
- Editor catatan dengan **mood**, **tag**, dan pengaturan **pribadi/publik**
- **Pembaca catatan penuh** — klik kartu untuk membaca seluruh isi, lengkap dengan estimasi waktu baca dan jumlah kata
- **Autosave draft** per akun, dengan opsi memulihkan atau memulai draft baru
- Pintasan **Ctrl/Cmd + S** untuk menyimpan, penghitung kata/karakter, dan validasi form
- Pencarian instan berdasarkan judul, isi, atau tag (`#tag`)
- Filter lanjutan: mood, tag, tanggal, privasi, panjang isi, dan urutan

### 👤 Akun & Keamanan dengan OTP Gmail
- Registrasi akun aman dengan verifikasi **Kode OTP 6 Digit** ke alamat Gmail
- Dilengkapi timer hitung mundur kirim ulang OTP (60s) dan auto-focus digit
- Integrasi pengiriman email OTP via **EmailJS REST API** serta fallback simulasi instan di lingkungan pengembangan
- Login dan registrasi dengan **password yang di-hash** (PBKDF2-SHA-256, 120.000 iterasi)
- Data catatan, surat masa depan, draft, dan riwayat AI **terpisah per akun**
- Migrasi otomatis data versi lama saat pertama kali dibuka
- Sinkronisasi antar tab: catatan dan status login ikut memperbarui

### 💌 Surat Masa Depan (Kapsul Waktu)
- Tulis surat, doa, atau pesan untuk dirimu di masa depan (misal: 1 bulan, 3 bulan, 6 bulan, 1 tahun, atau tanggal kustom seperti 17 November)
- **Segel Kapsul Waktu**: Surat terkunci rapat dan isinya tidak bisa diintip sebelum waktu yang ditentukan tiba
- **Live Countdown Timer**: Penghitung mundur hari, jam, menit, dan detik yang berjalan real-time pada setiap kartu surat
- **Pengingat Kalender & Gmail**:
  - Tombol 1-klik untuk memasang jadwal di **Google Calendar** (otomatis memicu alarm & notifikasi Gmail)
  - Opsi download file pengingat kalender `.ics` untuk Apple Calendar, Outlook, dan aplikasi kalender lainnya
- Konversi otomatis menjadi catatan harian biasa begitu kapsul waktu berhasil dibuka

### 📊 Insight
- **Dashboard** dengan ringkasan total catatan, streak menulis, jumlah kata, dan mood favorit
- **Statistik** produktivitas menulis
- **Mood Analytics** untuk melihat pola emosi
- **Memory Timeline** per minggu/bulan/tahun
- **Smart Reminders** dengan notifikasi browser

### 🤖 AI Assistant (Google Gemini)
- Menggunakan model cerdas **Google Gemini 3.8 Flash** sebagai mesin default
- **Konfigurasi API Key Aman**: API Key dimuat melalui file `.env` (`VITE_GEMINI_API_KEY`) dan tidak dipajang secara terbuka di antarmuka
- **Ide siap pakai** — setiap saran ide punya tombol **“Tulis catatan ini”** yang langsung membuka editor dengan judul, isi pembuka, mood, dan tag terisi
- Memahami konteks catatan terbaru dan bisa menjadi teman curhat, editor, maupun writing coach
- Tiga gaya respons: Suportif, Kreatif, Analitis
- Pengaturan dan riwayat chat tersimpan lokal serta terpisah per akun

### 💾 Data & keamanan
- Backup/restore JSON dan export **JSON/TXT/CSV**
- Bagikan catatan publik sebagai teks atau gambar
- Undo hapus catatan lewat notifikasi
- Tema terang/gelap mengikuti preferensi sistem dan tersimpan otomatis
- Responsif di mobile, tablet, dan desktop

## 🚀 Menjalankan

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite (biasanya `http://localhost:5173`).

### Script

```bash
npm run dev        # Development server
npm run build      # Type-check + build produksi
npm run typecheck  # Type-check saja
npm run lint       # ESLint
npm run preview    # Preview hasil build
```

## 🤖 Menggunakan Asisten AI

**Mode Lokal (tanpa API key)** — langsung bisa dipakai:

1. Buka **AI Chat** dari header (atau menu di mobile).
2. Klik salah satu tombol cepat, mis. **“Beri aku ide menulis”**.
3. Pilih ide yang menarik lalu klik **“Tulis catatan ini”** — editor langsung terisi.
4. Kamu juga bisa menulis bebas: curhat, minta pertanyaan refleksi, saran judul, atau ringkasan pola catatan.

**Mode Online (opsional)**:

1. Buat API key di [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Anda bisa memasukkan API key dengan 2 cara:
   - **Lewat file `.env`**: Salin `.env.example` menjadi `.env`, lalu isi `VITE_GEMINI_API_KEY=AIzaSy...` (otomatis aktif untuk semua sesi).
   - **Lewat Pengaturan Aplikasi**: Buka **AI Chat** → ikon **Settings (⚙️)** → pilih **Online (AI)**, tempel API key, lalu klik Simpan.
3. Mulai chat, misalnya: *"Bantu aku mencari ide catatan tentang hari ini."*

Catatan: pada Mode Online, ringkasan catatan terbaru dikirim ke Google Gemini saat kamu mengirim pesan. Mode Lokal tidak mengirim data ke mana pun. Jangan gunakan Mode Online untuk catatan yang tidak ingin dibagikan ke pihak ketiga.

## 🔐 Model penyimpanan

Semua data berada di `localStorage` browser:

| Key | Isi |
| --- | --- |
| `kenang.accounts.v1` | Daftar akun (password berupa hash + salt) |
| `kenang.session.v1` | ID akun yang sedang login |
| `kenang.entries.v1:<userId>` | Catatan per akun |
| `kenang.futureLetters.v1:<userId>` | Surat masa depan (kapsul waktu) per akun |
| `kenang.draft.v1:<userId>` | Draft editor per akun |
| `kenang.darkMode.v1` | Preferensi tema |
| `kenang.aiSettings.v2:<userId>` | Mode, gaya bicara, model Gemini, dan API key per akun |
| `kenang.aiMessages.v2:<userId>` | Riwayat chat AI per akun |

Catatan **tidak dienkripsi**, hanya dilindungi oleh isolasi akun di browser. Siapa pun yang memiliki akses ke profil browser ini dapat membuka data. Gunakan **Backup** secara rutin dan hindari aplikasi ini untuk data yang sangat sensitif.

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + Lucide React
- Web Crypto API (PBKDF2) untuk hashing password
- Mesin asisten lokal berbasis aturan (tanpa server) + Google Gemini API opsional
- Browser LocalStorage

## 🎯 Untuk siapa?

- Individu yang suka journaling dan refleksi diri
- Pasangan yang ingin menyimpan kenangan bersama
- Penulis yang butuh ruang latihan dan teman brainstorming
- Siapa pun yang ingin melacak mood dan kebiasaan menulis

---

**Kenang** — tempat setiap rasa punya rumah. 💕

*Dibuat dengan cinta untuk setiap kisah yang berharga.*
