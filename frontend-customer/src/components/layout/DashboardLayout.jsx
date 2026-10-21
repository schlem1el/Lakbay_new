import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Compass,
  Calendar,
  User,
  Users,
  Bell,
  LogOut,
  Menu,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Button } from '../ui/button';

export const DashboardLayout = () => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { label: 'Overview', path: '/dashboard', icon: Compass, exact: true },
    { label: 'My Bookings', path: '/dashboard/bookings', icon: Calendar },
    { label: 'Co-Travelers', path: '/dashboard/co-travelers', icon: Users },
    { label: 'Profile & Security', path: '/dashboard/profile', icon: User },
    { label: 'Notifications', path: '/dashboard/notifications', icon: Bell },
  ];

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between border-b border-slate-200 bg-white p-4 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Compass className="h-5 w-5" />
          </div>
          <span className="font-bold text-slate-900 font-heading">Customer Portal</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 md:top-20 z-40 h-[calc(100vh-80px)] w-64 border-r border-slate-200 bg-white p-5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* User Profile Snippet */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
              {(profile?.fullName || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-slate-900 text-sm truncate">
                {profile?.fullName || 'Traveler'}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(item)
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${isActive(item) ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive(item) && <ChevronRight className="h-4 w-4 text-emerald-600" />}
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <Link to="/packages" className="block">
            <Button variant="outline" className="w-full text-xs font-semibold justify-start text-emerald-700">
              <Compass className="h-4 w-4 mr-2" />
              Book Another Tour
            </Button>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
