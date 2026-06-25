import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await transporter.sendMail({
    from: `"Mailsnow" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Reset your Mailsnow password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#2563eb;">Reset your password</h2>
        <p>You requested a password reset for your Mailsnow account.</p>
        <p>Click the button below. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;">If you didn't request this, ignore this email. Your password won't change.</p>
        <p style="color:#888;font-size:12px;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });
}
