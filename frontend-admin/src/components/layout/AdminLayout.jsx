import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <AdminSidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
