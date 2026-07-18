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
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#f4f2ed;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ed;">
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
                  <tr>
                    <td style="background-color:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="text-align:center;padding-bottom:24px;border-bottom:1px solid #f0ede8;">
                            <span style="font-size:14px;letter-spacing:4px;text-transform:uppercase;color:#b8a88a;">
                              <span style="color:#c8963e;">&#x229b;</span> Verto3D
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:32px 0 8px;text-align:center;">
                            <h1 style="margin:0;font-size:22px;font-weight:600;color:#1a1a1a;letter-spacing:-0.3px;">
                              Reset Your Password
                            </h1>
                            <p style="margin:8px 0 0;font-size:15px;color:#6b6b6b;line-height:1.5;">
                              Use the OTP below to reset your Verto3D admin account password.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:28px 0;text-align:center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                              <tr>
                                <td style="background-color:#f4f2ed;border-radius:12px;padding:24px 40px;">
                                  <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#1a1a1a;font-variant-numeric:tabular-nums;">${otp}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 0 24px;text-align:center;">
                            <p style="margin:0;font-size:13px;color:#999;">
                              This OTP is valid for <strong style="color:#6b6b6b;">10 minutes</strong>.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px 0 0;border-top:1px solid #f0ede8;text-align:center;">
                            <p style="margin:0;font-size:12px;color:#b0b0b0;line-height:1.5;">
                              If you did not request this password reset, you can safely ignore this email.
                            </p>
                            <p style="margin:12px 0 0;font-size:11px;color:#c8c8c8;">
                              Verto3D &middot; 3D Printing Solutions
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 0 0;text-align:center;">
                      <p style="margin:0;font-size:11px;color:#c0c0c0;">
                        Verto3D Admin &middot; <span style="color:#c8963e;">&#x229b;</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
};

module.exports = { sendOtpEmail };
