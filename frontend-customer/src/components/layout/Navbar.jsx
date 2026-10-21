import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Sheet, SheetHeader, SheetTitle } from '../ui/sheet';
import {
  Compass,
  MapPin,
  Calendar,
  User,
  LogOut,
  Menu,
  Bell,
  Sparkles,
  Building2,
} from 'lucide-react';

export const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Destinations', path: '/destinations' },
    { name: 'Tour Packages', path: '/packages' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-102">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Compass className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900 font-heading">
              Lakbay<span className="text-emerald-600">.ph</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 -mt-1">
              Philippine Tours
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-semibold transition-colors relative py-1 ${
                isActive(link.path)
                  ? 'text-emerald-600'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              {link.name}
              {isActive(link.path) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-emerald-600" />
              )}
            </Link>
          ))}
        </nav>

        {/* Authentication Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-3 pr-4 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                  {(profile?.fullName || user.email || 'U')[0].toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{profile?.fullName || 'My Account'}</span>
              </button>

              {/* Account Dropdown Menu */}
              {accountMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setAccountMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {profile?.fullName || 'Traveler'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Compass className="h-4 w-4 text-emerald-600" />
                        My Dashboard
                      </Link>
                      <Link
                        to="/dashboard/bookings"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Calendar className="h-4 w-4 text-emerald-600" />
                        My Bookings
                      </Link>
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <User className="h-4 w-4 text-emerald-600" />
                        Profile & Co-Travelers
                      </Link>
                      <Link
                        to="/dashboard/notifications"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Bell className="h-4 w-4 text-emerald-600" />
                        Notifications
                      </Link>
                      <Link
                        to="/become-operator"
                        onClick={() => setAccountMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                      >
                        <Building2 className="h-4 w-4 text-emerald-600" />
                        Become an Operator
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setAccountMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" className="font-semibold text-slate-700">
                  Log in
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold shadow-md shadow-emerald-500/20">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Drawer Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div>
          <SheetHeader onClose={() => setMobileOpen(false)}>
            <SheetTitle>Lakbay Navigation</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-1 mt-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold transition-colors ${
                  isActive(link.path)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            {user ? (
              <div className="space-y-2">
                <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Customer Portal
                </p>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Compass className="h-4 w-4 text-emerald-600" />
                  My Dashboard
                </Link>
                <Link
                  to="/dashboard/bookings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  My Bookings
                </Link>
                <Link
                  to="/dashboard/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <User className="h-4 w-4 text-emerald-600" />
                  My Profile
                </Link>
                <Link
                  to="/become-operator"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  Become an Operator
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Sheet>
    </header>
  );
};
