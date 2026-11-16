import React, { useState, useEffect, useRef } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  User,
  X
} from 'lucide-react';
import { AuthModalProps } from '../types';
import {
  AUTH_ERROR_MESSAGES,
  AuthError,
  checkAccountExists,
  completeRegistrationWithHash,
  loginWithPassword,
  prepareRegistration,
  resetPasswordWithHash
} from '../lib/auth';
import {
  PendingRegistration,
  clearPendingRegistration,
  generateOtpCode,
  getPendingRegistration,
  savePendingRegistration,
  sendOtpToEmail,
  sendResetOtpToEmail
} from '../lib/emailOtp';

type AuthMode = 'login' | 'register' | 'forgot_request' | 'forgot_verify';

interface PendingReset {
  email: string;
  otpCode: string;
  expiresAt: number;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset Password Fields
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetConfirmVal, setResetConfirmVal] = useState('');
  const [pendingReset, setPendingReset] = useState<PendingReset | null>(null);

  // OTP Fields
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [pendingReg, setPendingReg] = useState<PendingRegistration | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown untuk kirim ulang OTP (Registrasi & Reset)
  useEffect(() => {
    const isOtpStep = (mode === 'register' && step === 'otp') || mode === 'forgot_verify';
    if (!isOtpStep || otpCountdown <= 0) return;
    const interval = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, step, otpCountdown]);

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setStep('form');
    setError('');
    setSuccessNotice('');
    setPassword('');
    setConfirmPassword('');
    setResetPasswordVal('');
    setResetConfirmVal('');
    setOtpDigits(['', '', '', '', '', '']);
    setSimulatedCode(null);
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessNotice('');

    if (mode === 'register' && password !== confirmPassword) {
      setError('Konfirmasi password belum cocok.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const user = await loginWithPassword(email, password);
        onAuthenticated(user);
      } else if (mode === 'register') {
        // Mode Register: Siapkan hash dan kirim OTP
        const prep = await prepareRegistration(name, email, password);
        const code = generateOtpCode();

        const pendingData: PendingRegistration = {
          name: prep.name,
          email: prep.email,
          passwordHash: prep.passwordHash,
          salt: prep.salt,
          otpCode: code,
          expiresAt: Date.now() + 15 * 60 * 1000 // 15 menit
        };

        savePendingRegistration(pendingData);
        setPendingReg(pendingData);

        const emailResult = await sendOtpToEmail(prep.email, prep.name, code);
        setOtpInfoMessage(emailResult.message);
        if (emailResult.simulated) {
          setSimulatedCode(code);
        } else {
          setSimulatedCode(null);
        }

        setStep('otp');
        setOtpCountdown(60);
        setOtpDigits(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      }
    } catch (err) {
      if (err instanceof AuthError) {
        setError(AUTH_ERROR_MESSAGES[err.code]);
      } else {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logika verifikasi kode OTP terpusat (Registrasi)
  const verifyOtpCode = async (codeToVerify: string) => {
    setError('');

    const currentPending = pendingReg || getPendingRegistration();
    const fullCode = codeToVerify.trim();

    if (fullCode.length !== 6) {
      setError('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    if (!currentPending) {
      setError('Sesi pendaftaran telah kedaluwarsa. Silakan ulangi.');
      setStep('form');
      return;
    }

    if (Date.now() > currentPending.expiresAt) {
      setError('Kode OTP telah kedaluwarsa (berlaku 15 menit). Silakan klik kirim ulang.');
      return;
    }

    const expectedCode = String(currentPending.otpCode || '').trim();
    if (!expectedCode || fullCode !== expectedCode) {
      setError('Kode OTP salah! Kode tidak sesuai dengan yang dikirim ke Gmail.');
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      return;
    }

    // Kode valid -> Selesaikan pendaftaran dan langsung masuk otomatis!
    setIsLoading(true);
    try {
      const user = completeRegistrationWithHash(
        currentPending.name,
        currentPending.email,
        currentPending.passwordHash,
        currentPending.salt
      );
      clearPendingRegistration();
      setPendingReg(null);
      onAuthenticated(user);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(AUTH_ERROR_MESSAGES[err.code]);
      } else {
        setError('Gagal menyelesaikan pendaftaran.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOtpCode(otpDigits.join(''));
  };

  // Handle Request Kirim OTP Reset Password
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Masukkan alamat email terdaftar Anda.');
      return;
    }

    if (!checkAccountExists(cleanEmail)) {
      setError('Akun dengan email ini belum terdaftar di Kenang.');
      return;
    }

    setIsLoading(true);
    try {
      const code = generateOtpCode();
      const resetData: PendingReset = {
        email: cleanEmail,
        otpCode: code,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 menit
      };

      setPendingReset(resetData);
      try {
        sessionStorage.setItem('kenang.pendingReset.v1', JSON.stringify(resetData));
      } catch {}

      const res = await sendResetOtpToEmail(cleanEmail, code);
      setOtpInfoMessage(res.message);
      if (res.simulated) {
        setSimulatedCode(code);
      } else {
        setSimulatedCode(null);
      }

      setMode('forgot_verify');
      setOtpCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setResetPasswordVal('');
      setResetConfirmVal('');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
    } catch {
      setError('Gagal mengirim kode reset password. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Verifikasi OTP & Simpan Password Baru
  const handleForgotVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    let currentReset = pendingReset;
    if (!currentReset) {
      try {
        const raw = sessionStorage.getItem('kenang.pendingReset.v1');
        if (raw) currentReset = JSON.parse(raw);
      } catch {}
    }

    if (!currentReset) {
      setError('Sesi reset password telah kedaluwarsa. Silakan ulangi pendaftaran/permintaan.');
      setMode('forgot_request');
      return;
    }

    if (Date.now() > currentReset.expiresAt) {
      setError('Kode OTP telah kedaluwarsa (berlaku 15 menit). Silakan minta kode baru.');
      return;
    }

    const fullCode = otpDigits.join('').trim();
    if (fullCode.length !== 6) {
      setError('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    if (fullCode !== String(currentReset.otpCode).trim()) {
      setError('Kode OTP salah! Periksa kembali kode reset di Gmail Anda.');
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
      return;
    }

    if (resetPasswordVal.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    if (resetPasswordVal !== resetConfirmVal) {
      setError('Konfirmasi password baru belum cocok.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await resetPasswordWithHash(currentReset.email, resetPasswordVal);
      try {
        sessionStorage.removeItem('kenang.pendingReset.v1');
      } catch {}
      setPendingReset(null);
      onAuthenticated(user);
    } catch (err) {
      if (err instanceof AuthError) {
        setError(AUTH_ERROR_MESSAGES[err.code]);
      } else {
        setError('Gagal mereset password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Event Paste (Copas langsung 6 digit)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const clean = pasted.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;

    const chars = clean.split('');
    const nextDigits = ['', '', '', '', '', ''];
    chars.forEach((c, i) => {
      nextDigits[i] = c;
    });
    setOtpDigits(nextDigits);

    const focusIndex = Math.min(chars.length - 1, 5);
    otpInputRefs.current[focusIndex]?.focus();

    // Jika 6 digit lengkap:
    if (clean.length === 6) {
      if (mode === 'register') {
        verifyOtpCode(clean);
      }
    }
  };

  // Handle Input per Digit OTP
  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '');

    // Jika user paste kode panjang melalui onChange
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split('');
      const nextDigits = ['', '', '', '', '', ''];
      chars.forEach((c, i) => {
        nextDigits[i] = c;
      });
      setOtpDigits(nextDigits);
      const nextFocus = Math.min(chars.length - 1, 5);
      otpInputRefs.current[nextFocus]?.focus();

      // Copas otomatis masuk jika registrasi valid!
      if (chars.length === 6 && mode === 'register') {
        verifyOtpCode(clean.slice(0, 6));
      }
      return;
    }

    const nextDigits = [...otpDigits];
    nextDigits[index] = clean.slice(-1);
    setOtpDigits(nextDigits);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (clean && index === 5 && mode === 'register') {
      const full = [...nextDigits.slice(0, 5), clean.slice(-1)].join('');
      if (full.length === 6) {
        verifyOtpCode(full);
      }
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    setError('');
    setIsLoading(true);

    try {
      const newCode = generateOtpCode();

      if (mode === 'register') {
        const currentPending = pendingReg || getPendingRegistration();
        if (!currentPending) return;

        const updated: PendingRegistration = {
          ...currentPending,
          otpCode: newCode,
          expiresAt: Date.now() + 15 * 60 * 1000 // 15 menit
        };

        savePendingRegistration(updated);
        setPendingReg(updated);

        const emailResult = await sendOtpToEmail(updated.email, updated.name, newCode);
        setOtpInfoMessage(emailResult.message);
        if (emailResult.simulated) setSimulatedCode(newCode);
      } else if (mode === 'forgot_verify') {
        let currentReset = pendingReset;
        if (!currentReset) {
          try {
            const raw = sessionStorage.getItem('kenang.pendingReset.v1');
            if (raw) currentReset = JSON.parse(raw);
          } catch {}
        }
        if (!currentReset) return;

        const updated: PendingReset = {
          ...currentReset,
          otpCode: newCode,
          expiresAt: Date.now() + 15 * 60 * 1000
        };
        setPendingReset(updated);
        try {
          sessionStorage.setItem('kenang.pendingReset.v1', JSON.stringify(updated));
        } catch {}

        const res = await sendResetOtpToEmail(updated.email, newCode);
        setOtpInfoMessage(res.message);
        if (res.simulated) setSimulatedCode(newCode);
      }

      setOtpCountdown(60);
      setSuccessNotice('Kode OTP baru telah dikirimkan ke Gmail!');
    } catch {
      setError('Gagal mengirim ulang OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillSimulatedOtp = () => {
    if (simulatedCode) {
      const chars = simulatedCode.split('');
      setOtpDigits(chars);
      if (mode === 'register') {
        verifyOtpCode(simulatedCode);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative my-4 w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-gray-800 animate-scale-in sm:p-8">
        {/* Top Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg text-white">
              {mode === 'forgot_request' || mode === 'forgot_verify' ? (
                <KeyRound className="h-6 w-6" />
              ) : step === 'otp' ? (
                <KeyRound className="h-6 w-6" />
              ) : (
                <Heart className="h-6 w-6 fill-current" />
              )}
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                {mode === 'forgot_request'
                  ? 'Reset Password'
                  : mode === 'forgot_verify'
                  ? 'Buat Password Baru'
                  : step === 'otp'
                  ? 'Verifikasi OTP Gmail'
                  : mode === 'login'
                  ? 'Selamat datang kembali'
                  : 'Buat akun Kenang'}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {mode === 'forgot_request'
                  ? 'Masukkan email untuk menerima kode reset.'
                  : mode === 'forgot_verify'
                  ? `Kode 6 digit dikirim ke ${email}`
                  : step === 'otp'
                  ? `Kode 6 digit dikirim ke ${email}`
                  : mode === 'login'
                  ? 'Masuk untuk melanjutkan cerita Anda.'
                  : 'Daftar dengan verifikasi OTP ke Gmail.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher (Hanya saat step === 'form' pada login/register) */}
        {(mode === 'login' || (mode === 'register' && step === 'form')) && (
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'login'
                  ? 'bg-white text-pink-600 shadow-sm dark:bg-gray-800 dark:text-pink-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                mode === 'register'
                  ? 'bg-white text-pink-600 shadow-sm dark:bg-gray-800 dark:text-pink-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Daftar
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 animate-slide-up"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successNotice && (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300 animate-slide-up">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* CASE 1: LUPA PASSWORD (REQUEST EMAIL)                    */}
        {/* ======================================================== */}
        {mode === 'forgot_request' ? (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <div>
              <label htmlFor="auth-forgot-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alamat Email Gmail Terdaftar
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="auth-forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="contoh@gmail.com"
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 font-semibold text-white shadow-lg transition hover:from-pink-600 hover:to-purple-700 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Mengirim Kode...
                </>
              ) : (
                'Kirim Kode Reset ke Gmail ✉️'
              )}
            </button>

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Masuk
            </button>
          </form>
        ) : mode === 'forgot_verify' ? (
          /* ======================================================== */
          /* CASE 2: LUPA PASSWORD (VERIFIKASI OTP & PASSWORD BARU)   */
          /* ======================================================== */
          <form onSubmit={handleForgotVerify} className="space-y-5">
            <div className="rounded-2xl bg-pink-50/60 p-3 text-center dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40">
              <span className="text-xs text-gray-500 dark:text-gray-400">Kode reset password dikirim ke:</span>
              <p className="font-bold text-gray-900 dark:text-white text-sm">{email}</p>
              {otpInfoMessage && (
                <p className="text-[11px] text-pink-700 dark:text-pink-300 mt-1 leading-relaxed">{otpInfoMessage}</p>
              )}
            </div>

            {simulatedCode && (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                <span>Kode Reset OTP: <strong>{simulatedCode}</strong></span>
                <button
                  type="button"
                  onClick={handleFillSimulatedOtp}
                  className="rounded-lg bg-amber-200/80 px-2 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-300"
                >
                  Isi Kode
                </button>
              </div>
            )}

            {/* 6 Digit Inputs */}
            <div>
              <span className="block text-center text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Masukkan 6 Digit Kode OTP:
              </span>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`h-11 w-10 sm:h-12 sm:w-11 rounded-xl border text-center text-xl font-bold text-gray-900 transition focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white ${
                      error
                        ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-400'
                        : 'border-gray-300 focus:border-pink-500 focus:ring-pink-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Countdown & Resend */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              {otpCountdown > 0 ? (
                <span>Kirim ulang kode dalam <strong className="text-pink-600">{otpCountdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 font-semibold text-pink-600 hover:text-pink-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Kirim Ulang Kode OTP
                </button>
              )}
            </div>

            {/* Input Password Baru */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Password Baru (Min. 6 Karakter)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-10 text-sm text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={resetConfirmVal}
                  onChange={(e) => setResetConfirmVal(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-9 pr-4 text-sm text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6 || !resetPasswordVal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 font-semibold text-white shadow-lg transition hover:from-pink-600 hover:to-purple-700 active:scale-95 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Menyimpan Password...
                  </>
                ) : (
                  'Reset Password & Masuk 🎉'
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode('forgot_request')}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Ganti Email
              </button>
            </div>
          </form>
        ) : step === 'form' ? (
          /* ======================================================== */
          /* CASE 3: STEP 1 - LOGIN / REGISTER FORM                   */
          /* ======================================================== */
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nama panggilan
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                    maxLength={40}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Nama Anda"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email {mode === 'register' && '(Gmail)'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="contoh@gmail.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_request');
                      setError('');
                      setSuccessNotice('');
                    }}
                    className="text-xs font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400 hover:underline"
                  >
                    Lupa password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={6}
                  className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-12 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder={mode === 'login' ? 'Masukkan password' : 'Min. 6 karakter'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label htmlFor="auth-confirm" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Konfirmasi password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="auth-confirm"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-gray-300 py-3 pl-10 pr-4 text-gray-900 transition focus:border-transparent focus:ring-2 focus:ring-pink-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="Ulangi password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:from-pink-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : mode === 'login' ? (
                'Masuk'
              ) : (
                'Daftar & Kirim OTP ke Gmail ✉️'
              )}
            </button>

            {mode === 'login' && (
              <div className="text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot_request');
                    setError('');
                    setSuccessNotice('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400 hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Lupa password? Klik di sini
                </button>
              </div>
            )}
          </form>
        ) : (
          /* ======================================================== */
          /* CASE 4: STEP 2 - VERIFIKASI OTP REGISTRASI               */
          /* ======================================================== */
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="rounded-2xl bg-pink-50/60 p-4 text-center dark:bg-pink-950/30 border border-pink-100 dark:border-pink-900/40">
              <span className="text-xs text-gray-500 dark:text-gray-400">Kode verifikasi telah dikirim ke:</span>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5 text-sm">{email}</p>
              {otpInfoMessage && (
                <p className="text-[11px] text-pink-700 dark:text-pink-300 mt-1.5 leading-relaxed">{otpInfoMessage}</p>
              )}
            </div>

            {/* Simulated OTP Helper Banner */}
            {simulatedCode && (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>
                    Kode OTP: <strong>{simulatedCode}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleFillSimulatedOtp}
                  className="rounded-lg bg-amber-200/80 px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100"
                >
                  Isi Otomatis
                </button>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div>
              <span className="block text-center text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3">
                Masukkan 6 Digit Kode OTP:
              </span>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    onPaste={handlePaste}
                    className={`h-12 w-11 rounded-xl border text-center text-xl font-bold text-gray-900 transition focus:outline-none focus:ring-2 sm:h-14 sm:w-12 dark:bg-gray-700 dark:text-white ${
                      error
                        ? 'border-red-400 bg-red-50/30 focus:border-red-500 focus:ring-red-400 dark:border-red-500 dark:bg-red-950/20'
                        : 'border-gray-300 focus:border-pink-500 focus:ring-pink-400 dark:border-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Direct Error Warning Banner right below input boxes */}
              {error && (
                <div
                  role="alert"
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-xs font-medium text-red-700 animate-slide-up dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Countdown & Resend */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              {otpCountdown > 0 ? (
                <span>
                  Kirim ulang kode dalam <strong className="text-pink-600">{otpCountdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 font-semibold text-pink-600 hover:text-pink-700 dark:text-pink-400"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Kirim Ulang Kode OTP
                </button>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 py-3 font-semibold text-white shadow-lg transition hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Verifikasi & Masuk 🎉'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Ubah Data Pendaftaran
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs leading-relaxed text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {step === 'otp' || mode === 'forgot_verify'
              ? 'Kode OTP berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.'
              : 'Akun dan catatan disimpan di browser ini. Password di-hash dan diverifikasi aman.'}
          </span>
        </div>

        {step === 'form' && (mode === 'login' || mode === 'register') && (
          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-pink-600 transition hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
            >
              {mode === 'login' ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
