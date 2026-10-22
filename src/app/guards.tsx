import { Lock } from 'lucide-react';
import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getTargetHandoffUrl, redirectUserToPortal } from '@/app/providers';
import { tokenStore } from '@/services/api/tokenStore';
import { ChangePasswordPage } from '@/features/account/pages/ChangePasswordPage';
import { useEffect, useRef } from 'react';
import { ROUTES } from '@/shared/constants/routes';

// Route guards (FE guideline 03 §5). The frontend guard is a UX concern only —
// the backend remains the real security boundary.

/** Wraps authenticated routes; redirects to /login and remembers returnTo. */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Don't redirect before bootstrap resolves (FE guideline 03 §8).
  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={ROUTES.PUBLIC.LOGIN} state={{ returnTo }} replace />;
  }

  if (user?.mustChangePassword) {
    if (location.pathname !== '/account/security/password') return <Navigate to="/account/security/password" replace />;
    return <ChangePasswordPage />;
  }

  const targetHandoff = getTargetHandoffUrl(user);
  if (targetHandoff) {
    redirectUserToPortal(targetHandoff);
    return <RouteLoading />;
  }

  return <Outlet />;
};

/** Wraps guest-only routes (login/register); redirects authenticated users away. */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    if (user?.mustChangePassword) return <Navigate to="/account/security/password" replace />;
    const targetHandoff = getTargetHandoffUrl(user);
    if (targetHandoff) {
      redirectUserToPortal(targetHandoff);
      return <RouteLoading />;
    }
    const returnTo = (location.state as { returnTo?: string })?.returnTo;
    return <Navigate to={returnTo || ROUTES.DASHBOARD} replace />;
  }

  return <Outlet />;
};

function RouteLoading(): React.ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC]">
      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export interface RoleGuardProps {
  allowedRoles: string[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] p-4 text-center">
        <div className="text-gray-400 mb-4">
          <Lock className="w-16 h-16 text-slate-400 mx-auto" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6 max-w-md">You do not have the required permissions to view this page.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <Outlet />;
};

/** Remediation handoff from the staff portal. Credentials never enter a query log. */
export const PasswordCallbackPage = () => {
  const handled = useRef(false);
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token'), refreshToken = params.get('refresh_token');
    window.history.replaceState(null, '', '/auth/password-callback');
    if (accessToken && refreshToken) {
      void tokenStore.acceptTokens({ accessToken, refreshToken, mustChangePassword: true, hasPassword: params.get('has_password') !== 'false' })
        .then(() => window.location.replace('/account/security/password'))
        .catch(() => window.location.replace('/login'));
    } else window.location.replace('/login');
  }, []);
  return <RouteLoading />;
};
