import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${config.frontendUrl}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"Tradly" <${config.smtp.user}>`,
    to: email,
    subject: 'Verify your email address',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #000; font-size: 24px;">Welcome to Tradly</h1>
        <p style="color: #333; line-height: 1.6;">Click the button below to verify your email address.</p>
        <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Verify Email</a>
        <p style="color: #666; margin-top: 24px;">Or copy this link: <a href="${url}">${url}</a></p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const url = `${config.frontendUrl}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"Tradly" <${config.smtp.user}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #000; font-size: 24px;">Reset Password</h1>
        <p style="color: #333; line-height: 1.6;">Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${url}" style="display: inline-block; background: #000; color: #fff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        <p style="color: #666; margin-top: 24px;">If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};
