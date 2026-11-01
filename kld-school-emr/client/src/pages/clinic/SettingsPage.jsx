import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Database, ImagePlus, KeyRound, MonitorCog, Moon, RotateCcw, Save, Server, Sun, UploadCloud } from 'lucide-react';
import { api } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/PageHeader';
import Alert from '../../components/Alert';

export default function SettingsPage() {
  const { settings: publicSettings, refresh, logoUrl } = useSettings();
  const { theme, setTheme } = useTheme();
  const { can, refreshUser } = useAuth();
  const [settings, setSettings] = useState(publicSettings);
  const [health, setHealth] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    Promise.allSettled([api.get('/settings'), api.get('/health')]).then(([settingsResponse, healthResponse]) => {
      if (settingsResponse.status === 'fulfilled') setSettings(settingsResponse.value.data.data);
      if (healthResponse.status === 'fulfilled') setHealth(healthResponse.value.data.data);
      else setHealth({ api: 'online', database: 'offline' });
    });
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const update = (key, value) => setSettings((current) => ({ ...current, [key]: value }));
  const saveSettings = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const payload = {
        school_name: settings.school_name || '', clinic_name: settings.clinic_name || '', clinic_contact: settings.clinic_contact || '',
        clinic_address: settings.clinic_address || '', clinic_operating_info: settings.clinic_operating_info || '', system_name: settings.system_name || '',
        timezone: settings.timezone || 'Asia/Manila', date_format: settings.date_format || 'MMM d, yyyy',
        near_expiry_days: Number(settings.near_expiry_days || 60), email_notifications_enabled: Boolean(settings.email_notifications_enabled)
      };
      await api.patch('/settings', { settings: payload });
      await refresh(); setMessage({ type: 'success', text: 'Clinic branding and system settings were saved.' });
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  };
  const uploadLogo = async () => {
    if (!logoFile) return;
    setBusy(true); setMessage(null);
    try {
      const data = new FormData(); data.append('logo', logoFile);
      await api.post('/settings/logo', data);
      setLogoFile(null); setPreview(''); await refresh(); setMessage({ type: 'success', text: 'Institutional logo uploaded successfully.' });
    } catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  };
  const resetLogo = async () => {
    if (!confirm('Restore the packaged default logo?')) return;
    setBusy(true);
    try { await api.delete('/settings/logo'); await refresh(); setMessage({ type: 'success', text: 'Default logo restored.' }); }
    catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  };
  const changePassword = async (event) => {
    event.preventDefault(); setMessage(null);
    if (password.newPassword !== password.confirm) { setMessage({ type: 'error', text: 'New password and confirmation do not match.' }); return; }
    setBusy(true);
    try { await api.post('/auth/change-password', { currentPassword: password.currentPassword, newPassword: password.newPassword }); setPassword({ currentPassword: '', newPassword: '', confirm: '' }); await refreshUser(); setMessage({ type: 'success', text: 'Password changed successfully.' }); }
    catch (error) { setMessage({ type: 'error', text: error.message }); }
    finally { setBusy(false); }
  };

  return <div><PageHeader title="Settings" subtitle="Configure the clinic identity, visual appearance, account security, and operational defaults."/>{message && <div className="mb-5"><Alert type={message.type} onClose={() => setMessage(null)}>{message.text}</Alert></div>}<div className="grid gap-6 xl:grid-cols-3"><div className="space-y-6 xl:col-span-2"><section className="surface p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-kld-50 p-2.5 text-kld-700 dark:bg-kld-500/10 dark:text-kld-300"><Building2/></div><div><h2 className="text-lg font-extrabold">Clinic Branding</h2><p className="text-sm text-slate-500">Changes are applied throughout the login screen, navigation, student portal, and browser title.</p></div></div><form className="mt-6 space-y-5" onSubmit={saveSettings}><div className="grid gap-4 sm:grid-cols-2"><div><label className="label">School Name</label><input className="input" value={settings.school_name || ''} onChange={(e) => update('school_name', e.target.value)} required/></div><div><label className="label">Clinic Name</label><input className="input" value={settings.clinic_name || ''} onChange={(e) => update('clinic_name', e.target.value)} required/></div><div><label className="label">System Name</label><input className="input" value={settings.system_name || ''} onChange={(e) => update('system_name', e.target.value)} required/></div><div><label className="label">Clinic Contact</label><input className="input" value={settings.clinic_contact || ''} onChange={(e) => update('clinic_contact', e.target.value)}/></div><div className="sm:col-span-2"><label className="label">Clinic Address</label><textarea className="input min-h-20" value={settings.clinic_address || ''} onChange={(e) => update('clinic_address', e.target.value)}/></div><div className="sm:col-span-2"><label className="label">Clinic Operating Information</label><textarea className="input min-h-24" value={settings.clinic_operating_info || ''} onChange={(e) => update('clinic_operating_info', e.target.value)} placeholder="Operating hours, emergency instructions, or contact guidance"/></div></div><div className="grid gap-4 sm:grid-cols-3"><div><label className="label">Timezone</label><input className="input" value={settings.timezone || 'Asia/Manila'} onChange={(e) => update('timezone', e.target.value)}/></div><div><label className="label">Date Format</label><input className="input" value={settings.date_format || 'MMM d, yyyy'} onChange={(e) => update('date_format', e.target.value)}/></div><div><label className="label">Near-Expiry Warning Days</label><input className="input" type="number" min="1" max="365" value={settings.near_expiry_days || 60} onChange={(e) => update('near_expiry_days', e.target.value)}/></div></div><label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-kld-600" checked={Boolean(settings.email_notifications_enabled)} onChange={(e) => update('email_notifications_enabled', e.target.checked)}/>Enable queued email notifications</label>{can('settings.manage') && <div className="flex justify-end"><button className="btn-primary" disabled={busy}><Save size={17}/>{busy ? 'Saving…' : 'Save Clinic Settings'}</button></div>}</form></section><section className="surface p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-accent/20 p-2.5 text-amber-700"><ImagePlus/></div><div><h2 className="text-lg font-extrabold">Institutional Logo</h2><p className="text-sm text-slate-500">PNG, JPG, or WebP. Maximum file size: 2 MB.</p></div></div><div className="mt-5 grid gap-5 sm:grid-cols-[160px_1fr]"><div className="flex h-40 items-center justify-center rounded-2xl border bg-slate-50 p-4 dark:bg-slate-950"><img src={preview || logoUrl} alt="Clinic logo preview" className="max-h-full max-w-full object-contain"/></div><div className="space-y-3"><label className="block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-kld-500 hover:bg-kld-50/50 dark:border-slate-700 dark:hover:bg-kld-500/5"><UploadCloud className="mx-auto mb-2 text-kld-600"/><span className="text-sm font-bold">Select a new logo</span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const file = e.target.files?.[0] || null; setLogoFile(file); if (preview) URL.revokeObjectURL(preview); setPreview(file ? URL.createObjectURL(file) : ''); }}/></label>{logoFile && <p className="text-sm text-slate-500">Selected: <strong>{logoFile.name}</strong></p>}<div className="flex flex-wrap gap-2">{can('settings.manage') && <button className="btn-primary" type="button" disabled={!logoFile || busy} onClick={uploadLogo}><UploadCloud size={17}/>Upload Logo</button>}{can('settings.manage') && <button className="btn-secondary" type="button" disabled={busy} onClick={resetLogo}><RotateCcw size={17}/>Restore Default</button>}</div></div></div></section><section className="surface p-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><KeyRound/></div><div><h2 className="text-lg font-extrabold">Change Password</h2><p className="text-sm text-slate-500">Use at least 10 characters with uppercase, lowercase, and a number.</p></div></div><form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-3"><div><label className="label">Current Password</label><input className="input" type="password" required value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })}/></div><div><label className="label">New Password</label><input className="input" type="password" required value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })}/></div><div><label className="label">Confirm New Password</label><input className="input" type="password" required value={password.confirm} onChange={(e) => setPassword({ ...password, confirm: e.target.value })}/></div><div className="sm:col-span-3 flex justify-end"><button className="btn-primary" disabled={busy}>Change Password</button></div></form></section></div><aside className="space-y-6"><section className="surface p-5"><h2 className="flex items-center gap-2 font-extrabold"><MonitorCog size={19}/>Appearance</h2><p className="mt-1 text-sm text-slate-500">Theme preference is stored in this browser.</p><div className="mt-4 grid gap-2">{[{value:'light',label:'Light Mode',icon:Sun},{value:'dark',label:'Dark Mode',icon:Moon},{value:'system',label:'System Default',icon:MonitorCog}].map((option) => <button key={option.value} className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-bold transition ${theme === option.value ? 'border-kld-500 bg-kld-50 text-kld-800 dark:bg-kld-500/10 dark:text-kld-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`} onClick={() => setTheme(option.value)}><option.icon size={18}/>{option.label}{theme === option.value && <CheckCircle2 className="ml-auto" size={17}/>}</button>)}</div></section><section className="surface p-5"><h2 className="font-extrabold">System Status</h2><div className="mt-4 space-y-3"><StatusRow icon={Server} label="Backend API" value={health?.api || 'checking'}/><StatusRow icon={Database} label="Database" value={health?.database || 'checking'}/><StatusRow icon={Database} label="Database Name" value={health?.databaseName || '—'} neutral/><StatusRow icon={MonitorCog} label="System Version" value={settings.system_version || '1.1.0'} neutral/></div>{health?.databaseVersion && <p className="mt-4 break-words text-xs text-slate-400">{health.databaseVersion}</p>}</section><section className="rounded-2xl border border-accent/50 bg-accent/10 p-5"><h2 className="font-extrabold text-slate-900 dark:text-white">Branding Requirement</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">The clinic name and institutional logo are database-driven. Authorized changes require no frontend rebuild.</p></section></aside></div></div>;
}

function StatusRow({ icon: Icon, label, value, neutral = false }) { const online = String(value).toLowerCase() === 'online'; return <div className="flex items-center gap-3 rounded-xl border p-3"><Icon size={18} className={neutral ? 'text-slate-500' : online ? 'text-emerald-600' : 'text-amber-600'}/><div className="min-w-0 flex-1"><div className="text-xs text-slate-500">{label}</div><div className="truncate text-sm font-extrabold capitalize">{value}</div></div>{!neutral && <span className={`h-2.5 w-2.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500'}`}/>}</div>; }
