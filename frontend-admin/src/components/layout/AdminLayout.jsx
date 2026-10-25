import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout = () => {
  // Mobile-only: controls the off-canvas sidebar below the lg breakpoint
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen font-sans text-foreground antialiased">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-[272px]">
        {/* Mobile / tablet top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-forest px-4 text-white lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="relative font-heading text-2xl leading-none">
            Lakbay
            <span className="absolute -right-2.5 bottom-1 h-1.5 w-1.5 rounded-full bg-terracotta" aria-hidden="true" />
          </span>
        </header>

        <main className="flex-1">
          <div className="page-shell mx-auto w-full max-w-[1240px] px-4 py-7 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
