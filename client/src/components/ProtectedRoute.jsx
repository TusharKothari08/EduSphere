import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../auth/AuthProvider';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useSession();
  const location = useLocation();
  if (loading) return <div className="page-loading"><span className="spinner" /><p>Getting your workspace ready…</p></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'educator' ? '/educator' : '/dashboard'} replace />;
  return children || <Outlet />;
}
