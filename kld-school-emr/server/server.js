import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { checkDatabase } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { startEmailQueueWorker } from './jobs/emailQueueWorker.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import visitRoutes from './routes/visits.js';
import consultationRoutes from './routes/consultations.js';
import medicineRoutes from './routes/medicines.js';
import medicineIssuanceRoutes from './routes/medicineIssuance.js';
import staffRoutes from './routes/staff.js';
import reportRoutes from './routes/reports.js';
import activityLogRoutes from './routes/activityLogs.js';
import settingRoutes from './routes/settings.js';
import notificationRoutes from './routes/notifications.js';
import formRoutes from './routes/forms.js';
import studentAccountRoutes from './routes/studentAccounts.js';
import studentPortalRoutes from './routes/studentPortal.js';
import emailLogRoutes from './routes/emailLogs.js';
import publicLandingRoutes from './routes/publicLanding.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import queueRoutes from './routes/queue.js';
import followUpRoutes from './routes/followUps.js';
import inventoryControlRoutes from './routes/inventoryControl.js';
import patientCorrectionRoutes from './routes/patientCorrections.js';
import attachmentRoutes from './routes/attachments.js';
import policyRoutes from './routes/policies.js';
import archiveRoutes from './routes/archives.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(requestId);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false
}));
app.use(cors({
  origin(origin, callback) {
    const allowed = env.CLIENT_ORIGIN.split(',').map((value) => value.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(cookieParser());
const uploadRoot = path.resolve(__dirname, env.UPLOAD_DIR);
// Only explicitly public branding and landing-page assets are exposed directly.
// Medical attachments remain private and are streamed through the authenticated,
// audited /api/attachments/:id/download endpoint.
app.use('/uploads/branding', express.static(path.join(uploadRoot, 'branding'), { maxAge: '1d', fallthrough: false }));
app.use('/uploads/landing', express.static(path.join(uploadRoot, 'landing'), { maxAge: '1d', fallthrough: false }));

app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get('/api/health', async (_req, res) => {
  try {
    const database = await checkDatabase();
    res.json({ success: true, message: 'KLD School EMR API is healthy.', data: { api: 'online', database: 'online', databaseName: database.databaseName, databaseVersion: database.version, time: new Date().toISOString() } });
  } catch (error) {
    res.status(503).json({ success: false, message: 'The API is online, but the database is unavailable.', data: { api: 'online', database: 'offline' }, debug: env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

app.use('/api/public', publicLandingRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/inventory-control', inventoryControlRoutes);
app.use('/api/patient-corrections', patientCorrectionRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/archives', archiveRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/medicine-issuance', medicineIssuanceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/student-accounts', studentAccountRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/api/email-logs', emailLogRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, async () => {
  console.log(`KLD School EMR API running at http://localhost:${env.PORT}`);
  try {
    const database = await checkDatabase();
    console.log(`Connected to ${database.databaseName} (${database.version})`);
    startEmailQueueWorker();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Start MySQL in XAMPP and import database/schema.sql followed by database/seed.sql.');
  }
});

const shutdown = (signal) => {
  console.log(`${signal} received. Closing HTTP server.`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
