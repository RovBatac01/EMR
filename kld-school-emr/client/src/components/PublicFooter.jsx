import { Link } from 'react-router-dom';
import { Clock3, Mail, MapPin, Phone } from 'lucide-react';
import LogoMark from './LogoMark';
import { useSettings } from '../context/SettingsContext';

export default function PublicFooter() {
  const { settings } = useSettings();
  return <footer id="contact" className="border-t border-emerald-950/10 bg-kld-950 text-white dark:border-slate-800">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-3"><LogoMark className="h-12 w-12"/><div><div className="text-lg font-black">{settings.clinic_name}</div><div className="text-sm text-white/60">{settings.school_name}</div></div></div>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/65">Confidential, coordinated school-clinic care for eligible students and employees. For emergencies, contact the clinic or appropriate emergency services immediately.</p>
      </div>
      <div>
        <h2 className="text-sm font-black uppercase tracking-[.16em] text-emerald-200">Contact</h2>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          {settings.clinic_address && <p className="flex gap-2"><MapPin className="mt-0.5 shrink-0" size={17}/><span>{settings.clinic_address}</span></p>}
          {settings.clinic_contact && <p className="flex gap-2"><Phone className="mt-0.5 shrink-0" size={17}/><span>{settings.clinic_contact}</span></p>}
          {settings.clinic_email && <p className="flex gap-2"><Mail className="mt-0.5 shrink-0" size={17}/><span>{settings.clinic_email}</span></p>}
          {settings.clinic_operating_info && <p className="flex gap-2"><Clock3 className="mt-0.5 shrink-0" size={17}/><span>{settings.clinic_operating_info}</span></p>}
        </div>
      </div>
      <div>
        <h2 className="text-sm font-black uppercase tracking-[.16em] text-emerald-200">Quick links</h2>
        <div className="mt-4 grid gap-2 text-sm font-semibold text-white/70">
          <Link className="hover:text-white" to="/announcements">Announcements & Promotions</Link>
          <Link className="hover:text-white" to="/login">Sign In</Link>
          <Link className="hover:text-white" to="/privacy">Privacy Policy</Link>
          <Link className="hover:text-white" to="/terms">Terms and Conditions</Link>
        </div>
      </div>
    </div>
    <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/45">© {new Date().getFullYear()} {settings.school_name}. Authorized school clinic use.</div>
  </footer>;
}
