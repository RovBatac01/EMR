import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function ProtectedRoute({ roles, permissions, anyPermission = false, children }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen/>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace/>;
  if (user.mustChangePassword && location.pathname !== '/change-password') return <Navigate to="/change-password" replace/>;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'STUDENT' ? '/student' : '/dashboard'} replace/>;
  if (permissions?.length) {
    const authorized = anyPermission ? permissions.some((permission) => can(permission)) : permissions.every((permission) => can(permission));
    if (!authorized) return <Navigate to={user.role === 'STUDENT' ? '/student' : '/dashboard'} replace/>;
  }
  return children || <Outlet/>;
}
