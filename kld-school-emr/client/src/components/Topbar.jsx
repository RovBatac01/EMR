import { useEffect, useState } from 'react';
import { Menu, Bell, Search, Moon, Sun, Monitor } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export default function Topbar({ onMenu, notificationPath, showSearch = true }) {
  const [unread,setUnread]=useState(0);const [query,setQuery]=useState('');const navigate=useNavigate();const {theme,setTheme}=useTheme();const {settings}=useSettings();
  useEffect(()=>{api.get('/notifications').then(({data})=>setUnread(data.data?.unread||0)).catch(()=>{});},[]);
  const next=theme==='light'?'dark':theme==='dark'?'system':'light';const ThemeIcon=theme==='light'?Sun:theme==='dark'?Moon:Monitor;
  const submit=(e)=>{e.preventDefault();if(query.trim())navigate(`/patients?search=${encodeURIComponent(query.trim())}`);};
  return <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
    <div className="flex h-18 items-center gap-3 px-4 py-3 sm:px-6 lg:px-8"><button className="icon-button lg:hidden" onClick={onMenu}><Menu/></button>{showSearch&&<form onSubmit={submit} className="relative hidden max-w-xl flex-1 md:block"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className="input bg-slate-50 pl-9 dark:bg-slate-900" placeholder="Search student ID or name…" value={query} onChange={e=>setQuery(e.target.value)}/></form>}<div className="ml-auto flex items-center gap-1"><button className="icon-button" title={`Theme: ${theme}`} onClick={()=>setTheme(next)}><ThemeIcon size={19}/></button><Link className="icon-button relative" to={notificationPath}><Bell size={20}/>{unread>0&&<span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-extrabold leading-4 text-white">{Math.min(unread,99)}</span>}</Link><div className="ml-2 hidden text-right sm:block"><div className="text-sm font-extrabold text-slate-900 dark:text-white">{settings.system_name}</div><div className="text-xs text-slate-500 dark:text-slate-400">Secure clinic workspace</div></div></div></div>
  </header>;
}
