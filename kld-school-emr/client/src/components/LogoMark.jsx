import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import defaultLogo from '../assets/default-clinic-logo.svg';
import { cn } from '../utils/format';

export default function LogoMark({ className = 'h-11 w-11', showText = true, compact = false }) {
  const { settings, logoUrl } = useSettings();
  const [failed, setFailed] = useState(false);
  return <div className="flex min-w-0 items-center gap-3">
    <img src={failed ? defaultLogo : logoUrl} onError={() => setFailed(true)} alt={`${settings.clinic_name} logo`} className={cn('shrink-0 rounded-2xl object-contain', className)} />
    {showText && <div className="min-w-0">
      <div className={cn('truncate font-extrabold tracking-tight', compact ? 'text-sm' : 'text-base')}>{settings.clinic_name}</div>
      <div className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-kld-600 dark:text-accent">{settings.school_name}</div>
    </div>}
  </div>;
}
