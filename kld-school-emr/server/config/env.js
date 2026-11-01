import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_NAME: z.string().default('kld_school_emr'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_TIMEZONE: z.string().default('+08:00'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('8h'),
  REMEMBER_JWT_EXPIRES_IN: z.string().default('30d'),
  COOKIE_NAME: z.string().default('kld_emr_session'),
  UPLOAD_DIR: z.string().default('uploads'),
  EMAIL_MODE: z.enum(['smtp', 'log']).default('log'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.string().transform((value) => value === 'true').default('false'),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_FROM: z.string().default('KLD Clinic <clinic@localhost>'),
  APP_URL: z.string().default('http://localhost:5173'),
  EMAIL_WORKER_INTERVAL_MS: z.coerce.number().int().positive().default(15000)
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
