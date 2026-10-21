import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../contexts/StaffAuthContext';
import { Button } from '../components/ui/button';

export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, role, loading, logout } = useStaffAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Verifying staff credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not in allowedRoles (admins always allowed everywhere)
  if (allowedRoles.length > 0 && !allowedRoles.includes(role) && role !== 'admin') {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center px-4">
        <div className="mb-4 rounded-full bg-red-100 p-4 text-red-600">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">403 - Permission Denied</h2>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Your staff role (<strong>{role}</strong>) does not have access to view or manage this section.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button onClick={logout} variant="destructive">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return children;
};
