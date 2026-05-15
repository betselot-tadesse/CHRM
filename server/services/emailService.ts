import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      console.log('EmailService: SMTP transporter initialized');
    } else {
      console.warn('EmailService: SMTP configuration missing. Email functionality will be disabled.');
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      console.warn('EmailService: Cannot send email, transporter not initialized');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Human Resources MS" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log('Email sent: %s', info.messageId);
      return info;
    } catch (error) {
      console.error('EmailService: Error sending email', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
