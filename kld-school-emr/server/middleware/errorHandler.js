import multer from 'multer';
import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: error.message });
  }
  if (error instanceof ZodError) {
    return res.status(422).json({ success: false, message: 'Validation failed.', details: error.flatten() });
  }
  if (error?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'A record with the same unique value already exists.' });
  }
  if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ success: false, message: 'This record is still used by another part of the system.' });
  }
  const status = error.statusCode || 500;
  const response = {
    success: false,
    message: status >= 500 ? 'The server could not complete the request.' : error.message
  };
  if (error.details) response.details = error.details;
  if (process.env.NODE_ENV !== 'production' && status >= 500) response.debug = error.message;
  return res.status(status).json(response);
}
