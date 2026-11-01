import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, apiOrigin } from '../services/api';
import defaultLogo from '../assets/default-clinic-logo.svg';

const SettingsContext = createContext(null);
const defaults = {
  school_name: 'Kolehiyo ng Lungsod ng Dasmariñas',
  clinic_name: 'KLD School Clinic',
  system_name: 'KLD School EMR',
  clinic_contact: '', clinic_address: '', clinic_operating_info: '',
  institutional_logo: '/assets/default-clinic-logo.svg', system_version: '1.2.0'
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/settings/public');
      setSettings((current) => ({ ...current, ...(data.data || {}) }));
    } catch {
      setSettings((current) => current);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { document.title = settings.system_name || settings.clinic_name || 'KLD School EMR'; }, [settings]);
  const logoUrl = useMemo(() => {
    const value = settings.institutional_logo;
    if (!value || value === '/assets/default-clinic-logo.svg') return defaultLogo;
    if (value.startsWith('http')) return value;
    return `${apiOrigin}${value}`;
  }, [settings.institutional_logo]);
  return <SettingsContext.Provider value={{ settings, setSettings, loading, refresh, logoUrl }}>{children}</SettingsContext.Provider>;
}
export const useSettings = () => useContext(SettingsContext);
