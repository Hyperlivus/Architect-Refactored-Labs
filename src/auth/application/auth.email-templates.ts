import type { SendMailOptions } from '../../mail/mail.service.interface';

export const otpEmail = (to: string, otp: string): SendMailOptions => ({
  to,
  subject: 'Your verification code',
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Email Verification</h2>
      <p>Use the code below to verify your email address:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">${otp}</div>
      <p style="color:#888;font-size:13px">If you did not request this, ignore this email.</p>
    </div>
  `,
});
