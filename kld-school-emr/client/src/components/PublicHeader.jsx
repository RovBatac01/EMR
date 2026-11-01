import { useState } from 'react';
import {
  CalendarDays,
  LogIn,
  Menu,
  X
} from 'lucide-react';
import {
  Link,
  useLocation
} from 'react-router-dom';

import LogoMark from './LogoMark';
import { useSettings } from '../context/SettingsContext';

const links = [
  {
    label: 'Home',
    href: '/#home'
  },
  {
    label: 'Services',
    href: '/#services'
  },
  {
    label: 'Announcements',
    href: '/announcements'
  },
  {
    label: 'About Us',
    href: '/#about'
  },
  {
    label: 'Contact',
    href: '/#contact'
  }
];

export default function PublicHeader() {
  const [open, setOpen] = useState(false);

  const { settings } = useSettings();
  const location = useLocation();

  const close = () => {
    setOpen(false);
  };

  const renderNavLink = (item) => {
    const isHashLink = item.href.startsWith('/#');

    const linkClassName =
      'rounded-lg px-3 py-2 text-sm font-bold ' +
      'text-slate-600 transition ' +
      'hover:bg-emerald-50 hover:text-kld-700 ' +
      'focus:outline-none focus:ring-2 focus:ring-kld-600/30 ' +
      'dark:text-slate-300 dark:hover:bg-slate-800 ' +
      'dark:hover:text-emerald-300';

    /*
     * When already on the landing page, use a normal anchor
     * so the browser scrolls directly to the section.
     */
    if (location.pathname === '/' && isHashLink) {
      return (
        <a
          key={item.href}
          href={item.href.slice(1)}
          onClick={close}
          className={linkClassName}
        >
          {item.label}
        </a>
      );
    }

    /*
     * When visiting another page, return to the landing page
     * before navigating to the requested section.
     */
    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={close}
        className={linkClassName}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Clinic branding */}
        <Link
          to="/"
          onClick={close}
          className="flex min-w-0 items-center gap-3"
          aria-label={`${settings.clinic_name || 'School Clinic'} home`}
        >
          {/*
           * showText={false} prevents LogoMark from displaying
           * another copy of the clinic and school names.
           */}
          <LogoMark
            className="h-11 w-11 shrink-0"
            showText={false}
          />

          <div className="min-w-0">
            <div className="truncate text-sm font-black text-kld-800 dark:text-white sm:text-base">
              {settings.clinic_name || 'School Clinic'}
            </div>

            <div className="hidden max-w-[230px] truncate text-xs font-semibold text-slate-500 dark:text-slate-400 sm:block">
              {settings.school_name || 'School'}
            </div>
          </div>
        </Link>

        {/* Desktop navigation */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Public navigation"
        >
          {links.map(renderNavLink)}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            className="btn-secondary"
            to="/login"
          >
            <LogIn size={17} />
            Sign In
          </Link>

          <Link
            className="btn-primary"
            to="/student/appointments"
          >
            <CalendarDays size={17} />
            Book Appointment
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="icon-button sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="public-mobile-navigation"
          onClick={() => {
            setOpen((currentValue) => !currentValue);
          }}
        >
          {open ? (
            <X aria-hidden="true" />
          ) : (
            <Menu aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile navigation */}
      {open && (
        <div
          id="public-mobile-navigation"
          className="border-t border-emerald-950/10 bg-white px-4 py-4 shadow-lg dark:border-slate-800 dark:bg-slate-950 sm:hidden"
        >
          <nav
            className="grid gap-1"
            aria-label="Mobile public navigation"
          >
            {links.map(renderNavLink)}
          </nav>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              className="btn-secondary"
              to="/login"
              onClick={close}
            >
              <LogIn size={17} />
              Sign In
            </Link>

            <Link
              className="btn-primary"
              to="/student/appointments"
              onClick={close}
            >
              <CalendarDays size={17} />
              Book
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}