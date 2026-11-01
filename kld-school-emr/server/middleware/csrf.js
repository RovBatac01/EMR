import { randomToken, timingSafeEqual } from '../utils/security.js';
import { AppError } from '../utils/http.js';
import { isProduction } from '../config/env.js';

export function issueCsrfToken(_req, res) {
  const token = randomToken(24);
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/'
  });
  res.json({ success: true, message: 'CSRF token issued.', data: { token } });
}

export function requireCsrf(req, _res, next) {
  const cookieToken = req.cookies?.['XSRF-TOKEN'];
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || !timingSafeEqual(cookieToken, headerToken)) {
    return next(new AppError(403, 'Your security token is missing or expired. Refresh the page and try again.'));
  }
  return next();
}
