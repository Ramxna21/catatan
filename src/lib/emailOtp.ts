/**
 * Layanan Verifikasi OTP Email untuk Pendaftaran Kenang
 * Mendukung EmailJS (jika diatur di .env) dan simulasi instan untuk pengembangan.
 */

export interface PendingRegistration {
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  otpCode: string;
  expiresAt: number;
}

const PENDING_REG_KEY = 'kenang.pendingRegistration.v1';

export function savePendingRegistration(data: PendingRegistration): void {
  try {
    sessionStorage.setItem(PENDING_REG_KEY, JSON.stringify(data));
  } catch {
    // fallback if sessionStorage unavailable
  }
}

export function getPendingRegistration(): PendingRegistration | null {
  try {
    const raw = sessionStorage.getItem(PENDING_REG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingRegistration;
  } catch {
    return null;
  }
}

export function clearPendingRegistration(): void {
  try {
    sessionStorage.removeItem(PENDING_REG_KEY);
  } catch {
    // ignore
  }
}

/**
 * Generate 6-digit random code
 */
export function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

export interface SendOtpResult {
  success: boolean;
  code: string;
  simulated: boolean;
  message: string;
}

/**
 * Kirim kode OTP ke alamat Gmail / email pengguna.
 * Jika VITE_EMAILJS_SERVICE_ID disetel di .env, panggil EmailJS REST API.
 * Jika belum, gunakan mode simulasi instan yang memunculkan OTP di layar.
 */
export async function sendOtpToEmail(email: string, name: string, otpCode: string): Promise<SendOtpResult> {
  const serviceId = (import.meta.env.VITE_EMAILJS_SERVICE_ID || '').trim();
  const templateId = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '').trim();
  const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '').trim();

  // Jika kredensial EmailJS tersedia, kirim email sungguhan
  if (serviceId && templateId && publicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: email,
            to_name: name,
            otp_code: otpCode,
            app_name: 'Kenang — Catatan Hati',
            valid_minutes: '15'
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          code: otpCode,
          simulated: false,
          message: `Kode OTP telah berhasil dikirim ke ${email}. Silakan cek kotak masuk atau folder spam Gmail Anda.`
        };
      }
    } catch (error) {
      console.warn('Gagal mengirim via EmailJS, beralih ke mode simulasi:', error);
    }
  }

  // Mode Simulasi (Real-time Preview) untuk pengujian langsung tanpa server
  return {
    success: true,
    code: otpCode,
    simulated: true,
    message: `[Simulasi Email]: Kode OTP Anda adalah ${otpCode}. Masukkan kode ini untuk menyelesaikan pendaftaran.`
  };
}

/**
 * Kirim kode OTP Reset Password via EmailJS menggunakan Template ID reset
 */
export async function sendResetOtpToEmail(
  email: string,
  otpCode: string,
  name?: string
): Promise<SendOtpResult> {
  const serviceId = (import.meta.env.VITE_EMAILJS_SERVICE_ID || '').trim();
  const templateId = (
    import.meta.env.VITE_EMAILJS_RESET_TEMPLATE_ID ||
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID ||
    ''
  ).trim();
  const publicKey = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '').trim();

  if (serviceId && templateId && publicKey) {
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: {
            to_email: email,
            to_name: name || 'Sahabat Kenang',
            otp_code: otpCode,
            app_name: 'Kenang — Catatan Hati',
            valid_minutes: '15'
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          code: otpCode,
          simulated: false,
          message: `Kode reset password telah dikirim ke ${email}. Silakan cek kotak masuk atau folder spam Gmail Anda.`
        };
      }
    } catch (error) {
      console.warn('Gagal mengirim via EmailJS reset template, beralih ke mode simulasi:', error);
    }
  }

  return {
    success: true,
    code: otpCode,
    simulated: true,
    message: `[Simulasi Email]: Kode OTP Reset Password Anda adalah ${otpCode}.`
  };
}
