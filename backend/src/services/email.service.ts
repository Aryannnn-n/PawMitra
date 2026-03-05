import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDING_GMAIL as string,
    pass: process.env.MAIL_PASSWORD as string, // Gmail App Password
  },
});

// ── Send OTP email ───────────────────────────────────────────────────────────
export const sendOtpEmail = async (
  toEmail: string,
  otp: string,
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"PawMitra" <${process.env.EMAIL_SENDING_GMAIL}>`,
      to: toEmail,
      subject: 'Your PawMitra Email Verification Code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #eee;border-radius:8px;">
          <h2 style="color:#f97316;">🐾 PawMitra Email Verification</h2>
          <p>Use the code below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#fff7ed;border-radius:6px;color:#ea580c;">
            ${otp}
          </div>
          <p style="color:#888;font-size:12px;margin-top:16px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err);
    return false;
  }
};

// ── Generate a random 6-digit OTP ────────────────────────────────────────────
export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();
