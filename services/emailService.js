const nodemailer = require("nodemailer");
const env = require("../config/env");

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const sendOtpEmail = async (to, otp) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn("SMTP not configured — skipping email send");
    return;
  }

  await transporter.sendMail({
    from: `"Verto3D Admin" <${env.SMTP_USER}>`,
    to,
    subject: "Your OTP — Verto3D Admin Password Reset",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">Password Reset OTP</h2>
        <p style="color:#555;">Use the OTP below to reset your Verto3D admin account password.</p>
        <div style="margin:24px 0;text-align:center;">
          <span style="display:inline-block;padding:16px 32px;background:#f5f5f5;border-radius:12px;font-size:32px;font-weight:700;letter-spacing:8px;color:#1a1a2e;">${otp}</span>
        </div>
        <p style="color:#999;font-size:12px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendOtpEmail };
