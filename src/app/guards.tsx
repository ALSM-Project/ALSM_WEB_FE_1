import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  if (isLoading) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    const returnTo = (location.state as { returnTo?: string })?.returnTo;
    return <Navigate to={returnTo || ROUTES.PROJECTS.SCREENS('proj-acme')} replace />;
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
