import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Bell, CalendarDays, FileText, History, LayoutDashboard, Pill, Settings, Stethoscope, UserRound } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const items = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/profile', label: 'My Medical Profile', icon: UserRound },
  { to: '/student/appointments', label: 'My Appointments', icon: CalendarDays },
  { to: '/student/visits', label: 'My Clinic Visits', icon: History },
  { to: '/student/consultations', label: 'Consultation Results', icon: Stethoscope },
  { to: '/student/medicines', label: 'My Medicines', icon: Pill },
  { to: '/student/forms', label: 'My Forms', icon: FileText },
  { to: '/student/notifications', label: 'Notifications', icon: Bell },
  { to: '/student/account', label: 'Account Settings', icon: Settings }
];

export default function StudentLayout() {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <Sidebar items={items} open={open} onClose={() => setOpen(false)} portalLabel="Student Clinic Portal"/>
    <div className="lg:pl-72">
      <Topbar onMenu={() => setOpen(true)} notificationPath="/student/notifications" showSearch={false}/>
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet/></main>
    </div>
  </div>;
}
