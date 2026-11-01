import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import ClinicLayout from './layouts/ClinicLayout';
import StudentLayout from './layouts/StudentLayout';
import LoadingScreen from './components/LoadingScreen';

const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const PublicQueuePage = lazy(() => import('./pages/public/PublicQueuePage'));
const AnnouncementsPage = lazy(() => import('./pages/public/AnnouncementsPage'));
const AnnouncementDetailPage = lazy(() => import('./pages/public/AnnouncementDetailPage'));
const PolicyDocumentPage = lazy(() => import('./pages/public/PolicyDocumentPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const StudentActivationPage = lazy(() => import('./pages/auth/StudentActivationPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ChangePasswordPage = lazy(() => import('./pages/auth/ChangePasswordPage'));
const DashboardPage = lazy(() => import('./pages/clinic/DashboardPage'));
const PatientsPage = lazy(() => import('./pages/clinic/PatientsPage'));
const PatientFormPage = lazy(() => import('./pages/clinic/PatientFormPage'));
const PatientProfilePage = lazy(() => import('./pages/clinic/PatientProfilePage'));
const EmployeeCategoriesPage = lazy(() => import('./pages/clinic/EmployeeCategoriesPage'));
const VisitsPage = lazy(() => import('./pages/clinic/VisitsPage'));
const VisitFormPage = lazy(() => import('./pages/clinic/VisitFormPage'));
const VisitDetailPage = lazy(() => import('./pages/clinic/VisitDetailPage'));
const ConsultationsPage = lazy(() => import('./pages/clinic/ConsultationsPage'));
const ConsultationFormPage = lazy(() => import('./pages/clinic/ConsultationFormPage'));
const ConsultationDetailPage = lazy(() => import('./pages/clinic/ConsultationDetailPage'));
const AppointmentsPage = lazy(() => import('./pages/clinic/AppointmentsPage'));
const AppointmentSchedulesPage = lazy(() => import('./pages/clinic/AppointmentSchedulesPage'));
const QueuePage = lazy(() => import('./pages/clinic/QueuePage'));
const FollowUpsPage = lazy(() => import('./pages/clinic/FollowUpsPage'));
const MedicinesPage = lazy(() => import('./pages/clinic/MedicinesPage'));
const MedicineFormPage = lazy(() => import('./pages/clinic/MedicineFormPage'));
const MedicineDetailPage = lazy(() => import('./pages/clinic/MedicineDetailPage'));
const MedicineCategoriesPage = lazy(() => import('./pages/clinic/MedicineCategoriesPage'));
const InventoryControlPage = lazy(() => import('./pages/clinic/InventoryControlPage'));
const MedicineIssuancePage = lazy(() => import('./pages/clinic/MedicineIssuancePage'));
const IssuanceHistoryPage = lazy(() => import('./pages/clinic/IssuanceHistoryPage'));
const IssuanceDetailPage = lazy(() => import('./pages/clinic/IssuanceDetailPage'));
const StaffPage = lazy(() => import('./pages/clinic/StaffPage'));
const ReportsPage = lazy(() => import('./pages/clinic/ReportsPage'));
const ActivityLogsPage = lazy(() => import('./pages/clinic/ActivityLogsPage'));
const SettingsPage = lazy(() => import('./pages/clinic/SettingsPage'));
const StudentAccountsPage = lazy(() => import('./pages/clinic/StudentAccountsPage'));
const FormsPage = lazy(() => import('./pages/clinic/FormsPage'));
const EmailLogsPage = lazy(() => import('./pages/clinic/EmailLogsPage'));
const NotificationsPage = lazy(() => import('./pages/clinic/NotificationsPage'));
const LandingContentPage = lazy(() => import('./pages/admin/LandingContentPage'));
const CorrectionRequestsPage = lazy(() => import('./pages/clinic/CorrectionRequestsPage'));
const ArchivesPage = lazy(() => import('./pages/clinic/ArchivesPage'));
const PolicyManagementPage = lazy(() => import('./pages/admin/PolicyManagementPage'));
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage'));
const MyProfilePage = lazy(() => import('./pages/student/MyProfilePage'));
const MyVisitsPage = lazy(() => import('./pages/student/MyVisitsPage'));
const MyConsultationsPage = lazy(() => import('./pages/student/MyConsultationsPage'));
const MyMedicinesPage = lazy(() => import('./pages/student/MyMedicinesPage'));
const MyFormsPage = lazy(() => import('./pages/student/MyFormsPage'));
const MyAppointmentsPage = lazy(() => import('./pages/student/MyAppointmentsPage'));
const MyNotificationsPage = lazy(() => import('./pages/student/MyNotificationsPage'));
const MyAccountPage = lazy(() => import('./pages/student/MyAccountPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const clinicRoles = ['SUPER_ADMIN', 'CLINIC_ADMIN', 'CLINIC_STAFF', 'DOCTOR', 'VIEWER'];

export default function App() {
  return <Suspense fallback={<LoadingScreen/>}><Routes>
    <Route path="/" element={<LandingPage/>}/>
    <Route path="/queue/public" element={<PublicQueuePage/>}/>
    <Route path="/announcements" element={<AnnouncementsPage/>}/>
    <Route path="/announcements/:id" element={<AnnouncementDetailPage/>}/>
    <Route path="/privacy" element={<PolicyDocumentPage type="privacy"/>}/>
    <Route path="/terms" element={<PolicyDocumentPage type="terms"/>}/>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/activate-student" element={<StudentActivationPage/>}/>
    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
    <Route element={<ProtectedRoute roles={[...clinicRoles, 'STUDENT']}/>}>
      <Route path="/change-password" element={<ChangePasswordPage/>}/>
    </Route>

    <Route element={<ProtectedRoute roles={clinicRoles}/> }>
      <Route element={<ClinicLayout/>}>
        <Route path="/dashboard" element={<DashboardPage/>}/>
        <Route path="/patients" element={<PatientsPage/>}/>
        <Route path="/patients/new" element={<PatientFormPage/>}/>
        <Route path="/patients/employee-categories" element={<EmployeeCategoriesPage/>}/>
        <Route path="/patients/:id" element={<PatientProfilePage/>}/>
        <Route path="/patients/:id/edit" element={<PatientFormPage/>}/>
        <Route path="/visits" element={<VisitsPage/>}/>
        <Route path="/visits/new" element={<VisitFormPage/>}/>
        <Route path="/visits/:id" element={<VisitDetailPage/>}/>
        <Route path="/visits/:id/edit" element={<VisitFormPage/>}/>
        <Route path="/consultations" element={<ConsultationsPage/>}/>
        <Route path="/consultations/new" element={<ConsultationFormPage/>}/>
        <Route path="/consultations/:id" element={<ConsultationDetailPage/>}/>
        <Route path="/consultations/:id/edit" element={<ConsultationFormPage/>}/>
        <Route path="/appointments" element={<AppointmentsPage/>}/>
        <Route path="/appointments/schedules" element={<AppointmentSchedulesPage/>}/>
        <Route path="/queue" element={<QueuePage/>}/>
        <Route path="/follow-ups" element={<FollowUpsPage/>}/>
        <Route path="/medicines" element={<MedicinesPage/>}/>
        <Route path="/medicines/new" element={<MedicineFormPage/>}/>
        <Route path="/medicines/categories" element={<MedicineCategoriesPage/>}/>
        <Route path="/medicines/inventory-control" element={<InventoryControlPage/>}/>
        <Route path="/medicines/:id" element={<MedicineDetailPage/>}/>
        <Route path="/medicines/:id/edit" element={<MedicineFormPage/>}/>
        <Route path="/medicine-issuance" element={<IssuanceHistoryPage/>}/>
        <Route path="/medicine-issuance/new" element={<MedicineIssuancePage/>}/>
        <Route path="/medicine-issuance/:id" element={<IssuanceDetailPage/>}/>
        <Route path="/staff" element={<StaffPage/>}/>
        <Route path="/reports" element={<ReportsPage/>}/>
        <Route path="/activity-logs" element={<ActivityLogsPage/>}/>
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="/student-accounts" element={<StudentAccountsPage/>}/>
        <Route path="/forms" element={<FormsPage/>}/>
        <Route path="/email-logs" element={<EmailLogsPage/>}/>
        <Route path="/notifications" element={<NotificationsPage/>}/>
        <Route path="/landing-content" element={<ProtectedRoute permissions={['landing.manage']}><LandingContentPage/></ProtectedRoute>}/>
        <Route path="/correction-requests" element={<CorrectionRequestsPage/>}/>
        <Route path="/archives" element={<ProtectedRoute permissions={['archives.read']}><ArchivesPage/></ProtectedRoute>}/>
        <Route path="/policy-documents" element={<ProtectedRoute permissions={['policies.manage']}><PolicyManagementPage/></ProtectedRoute>}/>
      </Route>
    </Route>

    <Route element={<ProtectedRoute roles={['STUDENT']}/> }>
      <Route element={<StudentLayout/>}>
        <Route path="/student" element={<StudentDashboardPage/>}/>
        <Route path="/student/profile" element={<MyProfilePage/>}/>
        <Route path="/student/appointments" element={<MyAppointmentsPage/>}/>
        <Route path="/student/visits" element={<MyVisitsPage/>}/>
        <Route path="/student/consultations" element={<MyConsultationsPage/>}/>
        <Route path="/student/medicines" element={<MyMedicinesPage/>}/>
        <Route path="/student/forms" element={<MyFormsPage/>}/>
        <Route path="/student/notifications" element={<MyNotificationsPage/>}/>
        <Route path="/student/account" element={<MyAccountPage/>}/>
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage/>}/>
  </Routes></Suspense>;
}
