import React from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { ROUTES } from '@/shared/constants/routes';

// Route guards (FE guideline 03 §5). The frontend guard is a UX concern only —
// the backend remains the real security boundary.

/** Wraps authenticated routes; redirects to /login and remembers returnTo. */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Don't redirect before bootstrap resolves (FE guideline 03 §8).
  if (isLoading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={ROUTES.PUBLIC.LOGIN} state={{ returnTo }} replace />;
  }

  return <Outlet />;
};

/** Wraps guest-only routes (login/register); redirects authenticated users away. */
export const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/projects/new" replace />;
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
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
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
