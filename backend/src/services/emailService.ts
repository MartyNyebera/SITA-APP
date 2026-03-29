import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendOTPEmail(to: string, otp: string, name: string): Promise<void> {
  await transporter.sendMail({
    from: `"SITA Rides" <${process.env.SMTP_EMAIL}>`,
    to,
    subject: "Your SITA Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <div style="background: #F47920; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛺 SITA</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 4px 0 0;">Tricycle Ride-Hailing</p>
        </div>
        <div style="background: #fff; padding: 32px; border: 1px solid #f0f0f0; border-radius: 0 0 12px 12px;">
          <p style="color: #333; font-size: 16px;">Kumusta, <strong>${name}</strong>!</p>
          <p style="color: #555; font-size: 14px;">Ito ang iyong verification code:</p>
          <div style="background: #fff7f0; border: 2px dashed #F47920; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #F47920;">${otp}</span>
          </div>
          <p style="color: #888; font-size: 13px; text-align: center;">
            Ang code na ito ay mag-e-expire sa <strong>10 minuto</strong>.<br/>
            Huwag ibahagi ito sa sinuman.
          </p>
          <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 24px 0;" />
          <p style="color: #aaa; font-size: 12px; text-align: center;">
            © 2026 SITA Rides · Kung hindi ikaw ang nag-sign up, balewalain ang email na ito.
          </p>
        </div>
      </div>
    `,
  });
}
