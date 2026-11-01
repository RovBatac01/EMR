import process from 'node:process';

const base = (process.env.API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const identifier = process.env.SMOKE_USER || 'admin';
const password = process.env.SMOKE_PASSWORD || 'Demo@12345';

function parseCookies(headers) {
  const values = typeof headers.getSetCookie === 'function'
    ? headers.getSetCookie()
    : [headers.get('set-cookie')].filter(Boolean);
  return values.map((value) => value.split(';', 1)[0]).filter(Boolean);
}

function mergeCookies(...groups) {
  const map = new Map();
  for (const group of groups.flat()) {
    const [name, ...value] = group.split('=');
    if (name) map.set(name.trim(), value.join('='));
  }
  return [...map.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
}

async function request(path, options = {}, cookies = '') {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookies ? { Cookie: cookies } : {}),
      ...options.headers
    },
    redirect: 'manual'
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} returned ${response.status}: ${typeof body === 'string' ? body : body?.message || JSON.stringify(body)}`);
  }
  return { response, body, cookies: parseCookies(response.headers) };
}

try {
  const health = await request('/health');
  console.log(`PASS  API health: ${health.body?.data?.api}; database: ${health.body?.data?.database}`);

  const csrf = await request('/auth/csrf');
  const csrfToken = csrf.body?.data?.token;
  if (!csrfToken) throw new Error('CSRF endpoint did not return a token.');
  let cookies = mergeCookies(csrf.cookies);
  console.log('PASS  CSRF token and cookie');

  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ identifier, password, remember: false })
  }, cookies);
  cookies = mergeCookies(cookies.split('; '), login.cookies);
  console.log(`PASS  Login as ${login.body?.data?.user?.username || identifier}`);

  const me = await request('/auth/me', {}, cookies);
  console.log(`PASS  Authenticated profile: ${me.body?.data?.user?.role}`);

  const dashboard = await request('/reports/dashboard', {}, cookies);
  if (!dashboard.body?.data) throw new Error('Dashboard response has no data object.');
  console.log('PASS  Dashboard REST API');

  const logoutCsrf = await request('/auth/csrf', {}, cookies);
  cookies = mergeCookies(cookies.split('; '), logoutCsrf.cookies);
  await request('/auth/logout', {
    method: 'POST',
    headers: { 'X-CSRF-Token': logoutCsrf.body?.data?.token },
    body: JSON.stringify({})
  }, cookies);
  console.log('PASS  Logout and session revocation');
  console.log('\nLive smoke test completed successfully.');
} catch (error) {
  console.error(`FAIL  ${error.message}`);
  console.error(`\nConfirm the API is running at ${base}, MySQL is running, and schema.sql plus seed.sql were imported.`);
  process.exit(1);
}
