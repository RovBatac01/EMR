import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Activity, Archive, BarChart3, Bell, CalendarClock, ClipboardCheck, ClipboardList, ClipboardPlus,
  FileEdit, FileText, History, LayoutDashboard, Mail, Megaphone, PackageCheck, PackagePlus,
  Pill, ScrollText, Settings, ShieldCheck, Stethoscope, Syringe, Tags, UserCheck, UserCog, UserPlus,
  Users, UsersRound
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';

export default function ClinicLayout() {
  const [open, setOpen] = useState(false);
  const { can } = useAuth();
  const items = useMemo(() => [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { heading: 'Patients & Clinic' },
    can('patients.read') && { to: '/patients', label: 'All Patients', icon: Users, end: true },
    can('patients.write') && { to: '/patients/new', label: 'Register Patient', icon: UserPlus },
    can('employees.manage') && { to: '/patients/employee-categories', label: 'Employee Categories', icon: UsersRound },
    can('visits.write') && { to: '/visits/new', label: 'Register Visit', icon: ClipboardPlus },
    can('visits.read') && { to: '/visits', label: 'Visit History', icon: History, end: true },
    can('consultations.read') && { to: '/consultations', label: 'Consultations', icon: Stethoscope },
    can('followups.manage') && { to: '/follow-ups', label: 'Follow-ups', icon: ClipboardCheck },
    { heading: 'Appointments & Queue' },
    can('appointments.read') && { to: '/appointments', label: 'Appointments', icon: CalendarClock, end: true },
    can('appointments.manage') && { to: '/appointments/schedules', label: 'Schedules & Slots', icon: ClipboardList },
    can('queue.manage') && { to: '/queue', label: 'Clinic Queue', icon: Activity },
    { heading: 'Medicines' },
    can('medicines.read') && { to: '/medicines', label: 'Inventory', icon: Pill, end: true },
    can('medicines.write') && { to: '/medicines/new', label: 'Add Medicine', icon: PackagePlus },
    can('medicines.write') && { to: '/medicines/categories', label: 'Medicine Categories', icon: Tags },
    (can('inventory.adjust.request') || can('inventory.count')) && { to: '/medicines/inventory-control', label: 'Inventory Control', icon: PackageCheck },
    can('medicines.issue') && { to: '/medicine-issuance/new', label: 'Issue Medicine', icon: Syringe },
    can('medicines.read') && { to: '/medicine-issuance', label: 'Issuance History', icon: History },
    { heading: 'Administration' },
    can('landing.manage') && { to: '/landing-content', label: 'Public Landing Page', icon: Megaphone },
    can('forms.manage') && { to: '/forms', label: 'Clinic Forms', icon: FileText },
    can('student_accounts.manage') && { to: '/student-accounts', label: 'Student Accounts', icon: UserCheck },
    can('patient_corrections.review') && { to: '/correction-requests', label: 'Correction Requests', icon: FileEdit },
    can('archives.read') && { to: '/archives', label: 'Archives', icon: Archive },
    can('policies.manage') && { to: '/policy-documents', label: 'Privacy & Terms', icon: ShieldCheck },
    can('staff.read') && { to: '/staff', label: 'Staff & Doctors', icon: UserCog },
    can('reports.read') && { to: '/reports', label: 'Reports', icon: BarChart3 },
    can('logs.read') && { to: '/activity-logs', label: 'Activity Logs', icon: ScrollText },
    can('email_logs.read') && { to: '/email-logs', label: 'Email Monitoring', icon: Mail },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    can('settings.read') && { to: '/settings', label: 'Settings', icon: Settings }
  ].filter(Boolean), [can]);

  return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
    <Sidebar items={items} open={open} onClose={() => setOpen(false)} portalLabel="Clinic Management"/>
    <div className="lg:pl-72">
      <Topbar onMenu={() => setOpen(true)} notificationPath="/notifications"/>
      <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet/></main>
    </div>
  </div>;
}
