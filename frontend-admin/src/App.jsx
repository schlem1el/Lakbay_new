import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { StaffAuthProvider } from './contexts/StaffAuthContext';
import { AdminRoutes } from './routes/AdminRoutes';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StaffAuthProvider>
        <AdminRoutes />
      </StaffAuthProvider>
    </BrowserRouter>
  );
}
