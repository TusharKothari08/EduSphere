import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSession } from '../auth/AuthProvider';

export default function ProtectedRoute({ role, allowedRoles, children }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-violet-200 border-t-violet-600" />
        <p className="text-sm font-medium text-slate-500">Getting your workspace ready…</p>
      </div>
    );
  }

  if (!user) {
    const fullPath = location.pathname + (location.search || '');
    return <Navigate to="/login" replace state={{ from: fullPath }} />;
  }

  const roles = allowedRoles || (role ? [role] : null);

  if (roles && !roles.includes(user.role)) {
    const destination =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'educator'
        ? '/educator'
        : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children || <Outlet />;
}
