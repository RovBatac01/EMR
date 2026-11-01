import { useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import LogoMark from '../../components/LogoMark';
import Alert from '../../components/Alert';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { settings } = useSettings();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      const refreshed = await refreshUser();
      navigate(refreshed?.role === 'STUDENT' ? '/student' : '/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return <main className="mesh-bg flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
    <section className="w-full max-w-lg rounded-3xl border border-white/60 bg-white/95 p-6 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:p-8">
      <LogoMark className="h-14 w-14"/>
      <div className="mt-7 flex items-start gap-3">
        <div className="rounded-2xl bg-kld-50 p-3 text-kld-700 dark:bg-kld-500/10 dark:text-kld-300"><ShieldCheck/></div>
        <div><h1 className="text-2xl font-extrabold tracking-tight">Create a new password</h1><p className="mt-1 text-sm leading-6 text-slate-500">{user?.mustChangePassword ? 'Your administrator issued a temporary password. Change it before accessing medical records.' : 'Update your account password securely.'}</p></div>
      </div>
      {error && <div className="mt-5"><Alert>{error}</Alert></div>}
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <div><label className="label">Current Password</label><input className="input" type={show ? 'text' : 'password'} autoComplete="current-password" required value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}/></div>
        <div><label className="label">New Password</label><input className="input" type={show ? 'text' : 'password'} autoComplete="new-password" minLength="10" required value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })}/></div>
        <div><label className="label">Confirm New Password</label><input className="input" type={show ? 'text' : 'password'} autoComplete="new-password" minLength="10" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}/></div>
        <button type="button" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-kld-700" onClick={() => setShow((value) => !value)}>{show ? <EyeOff size={17}/> : <Eye size={17}/>} {show ? 'Hide passwords' : 'Show passwords'}</button>
        <button className="btn-primary w-full py-3" disabled={busy}><KeyRound size={18}/>{busy ? 'Changing password…' : 'Change Password and Continue'}</button>
      </form>
      <p className="mt-5 text-center text-xs leading-5 text-slate-400">Use at least 10 characters with uppercase and lowercase letters and a number. {settings.clinic_name}</p>
    </section>
  </main>;
}
