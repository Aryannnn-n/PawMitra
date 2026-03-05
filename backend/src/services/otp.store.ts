// Simple in-memory OTP store (email → { otp, expiresAt })

interface OtpEntry {
  otp: string;
  expiresAt: number; // Unix ms timestamp
}

const otpStore = new Map<string, OtpEntry>();

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ── Save OTP for an email ────────────────────────────────────────────────────
export const saveOtp = (email: string, otp: string): void => {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
};

// ── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtp = (email: string, otp: string): boolean => {
  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return false;
  }
  return entry.otp === otp;
};

// ── Delete OTP after successful registration ─────────────────────────────────
export const deleteOtp = (email: string): void => {
  otpStore.delete(email.toLowerCase());
};

// ── Mark email as verified (optional verified flag) ──────────────────────────
const verifiedEmails = new Set<string>();

export const markEmailVerified = (email: string): void => {
  verifiedEmails.add(email.toLowerCase());
};

export const isEmailVerified = (email: string): boolean =>
  verifiedEmails.has(email.toLowerCase());

export const clearVerifiedEmail = (email: string): void => {
  verifiedEmails.delete(email.toLowerCase());
};
