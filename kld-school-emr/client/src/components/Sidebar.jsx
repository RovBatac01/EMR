import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, LogOut, Moon, Sun, Monitor, ChevronRight } from 'lucide-react';
import LogoMark from './LogoMark';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../utils/format';

export default function Sidebar({ items, open, onClose, portalLabel }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const content = <div className="flex h-full flex-col bg-kld-950 text-white">
    <div className="flex h-20 items-center justify-between border-b border-white/10 px-4"><LogoMark className="h-11 w-11" compact/><button className="icon-button text-white lg:hidden" onClick={onClose}><X/></button></div>
    <div className="px-4 pt-4"><div className="rounded-xl bg-white/8 px-3 py-2 text-[11px] font-bold uppercase tracking-[.16em] text-accent">{portalLabel}</div></div>
    <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-4">
      {items.map((item) => item.heading ? <div key={item.heading} className="mb-1 mt-5 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/45">{item.heading}</div> : <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={({isActive})=>cn('group my-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',isActive?'bg-accent text-kld-950 shadow-glow':'text-white/75 hover:bg-white/8 hover:text-white')}><item.icon size={18}/><span className="flex-1">{item.label}</span><ChevronRight size={14} className="opacity-0 transition group-hover:opacity-60"/></NavLink>)}
    </nav>
    <div className="border-t border-white/10 p-3 safe-area-bottom">
      <div className="mb-2 rounded-xl bg-white/8 p-3"><div className="truncate text-sm font-bold">{user?.name||user?.username}</div><div className="truncate text-xs text-white/55">{user?.roleName}</div></div>
      <div className="grid grid-cols-2 gap-2"><button className="flex items-center justify-center gap-2 rounded-xl bg-white/8 px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/12" onClick={()=>setTheme(nextTheme)}><ThemeIcon size={16}/>{theme}</button><button className="flex items-center justify-center gap-2 rounded-xl bg-red-500/12 px-3 py-2.5 text-xs font-bold text-red-200 hover:bg-red-500/20" onClick={logout}><LogOut size={16}/>Logout</button></div>
    </div>
  </div>;
  return <><aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">{content}</aside><AnimatePresence>{open&&<><motion.button aria-label="Close navigation" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" onClick={onClose}/><motion.aside initial={{x:-320}} animate={{x:0}} exit={{x:-320}} transition={{type:'spring',damping:28,stiffness:260}} className="fixed inset-y-0 left-0 z-50 w-[86vw] max-w-72 lg:hidden">{content}</motion.aside></>}</AnimatePresence></>;
}
