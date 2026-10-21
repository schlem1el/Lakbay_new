import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import {
  LayoutDashboard,
  MapPin,
  Package,
  Calendar,
  Ticket,
  CreditCard,
  Compass,
  Users,
  FileSpreadsheet,
  LogOut,
  ChevronsUpDown,
  Settings,
  Star,
  Building2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export const AdminSidebar = () => {
  const { user, role, profile, logout } = useStaffAuth();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setIsAccountOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsAccountOpen(false);
      }
    };
    if (isAccountOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountOpen]);

  const navigationSections = [
    {
      title: 'Analytics & Overview',
      items: [
        {
          name: 'Dashboard',
          to: '/dashboard',
          icon: LayoutDashboard,
          roles: ['admin', 'coordinator', 'support', 'operator'],
        },
      ],
    },
    {
      title: 'Catalog Management',
      items: [
        {
          name: 'Destinations',
          to: '/catalog/destinations',
          icon: MapPin,
          roles: ['admin', 'coordinator'],
        },
        {
          name: 'Tour Packages',
          to: '/catalog/packages',
          icon: Package,
          roles: ['admin', 'coordinator', 'operator'],
        },
        {
          name: 'Promotions',
          to: '/catalog/promotions',
          icon: Sparkles,
          roles: ['admin', 'coordinator'],
        },
      ],
    },
    {
      title: 'Tour Operations',
      items: [
        {
          name: 'Departures',
          to: '/operations/departures',
          icon: Calendar,
          roles: ['admin', 'coordinator', 'operator'],
        },
        {
          name: 'Bookings Hub',
          to: '/operations/bookings',
          icon: Ticket,
          roles: ['admin', 'support', 'coordinator', 'operator'],
        },
        {
          name: 'Refunds & Payments',
          to: '/operations/payments-refunds',
          icon: CreditCard,
          roles: ['admin', 'support'],
        },
        {
          name: 'Guide Manifest',
          to: '/operations/guide-manifest',
          icon: Compass,
          roles: ['admin', 'guide', 'operator'],
        },
        {
          name: 'Customer Reviews',
          to: '/operations/reviews',
          icon: Star,
          roles: ['admin', 'support', 'coordinator', 'guide', 'operator'],
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          name: 'Tour Operators',
          to: '/administration/operators',
          icon: Building2,
          roles: ['admin'],
        },
        {
          name: 'Users & Staff IAM',
          to: '/administration/staff-customers',
          icon: Users,
          roles: ['admin'],
        },
        {
          name: 'Financial Reports',
          to: '/administration/reports',
          icon: FileSpreadsheet,
          roles: ['admin'],
        },
      ],
    },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-lg shadow-sm">
            L
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Lakbay</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {navigationSections.map((section) => {
          // Filter items based on user role
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(role || '')
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </h3>
              <div className="mt-2 space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Footer with Clickable Dropdown for Sign Out */}
      <div className="relative border-t border-slate-200 p-3" ref={accountRef}>
        {/* Dropdown Menu */}
        {isAccountOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg ring-1 ring-black/5 z-50">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.fullName || 'Staff User'}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {profile?.email || user?.email}
              </p>
              <div className="mt-2">
                <Badge
                  variant={
                    role === 'admin'
                      ? 'destructive'
                      : role === 'coordinator'
                      ? 'info'
                      : role === 'guide'
                      ? 'success'
                      : 'secondary'
                  }
                  className="capitalize text-[10px] font-bold px-1.5 py-0.5"
                >
                  {role || 'Staff'}
                </Badge>
              </div>
            </div>
            <div className="my-1 border-t border-slate-100" />
            <Link
              to="/settings"
              onClick={() => setIsAccountOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <Settings className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>Account Settings</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setIsAccountOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsAccountOpen((prev) => !prev)}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-xl p-2 text-left transition-colors',
            isAccountOpen ? 'bg-slate-100' : 'hover:bg-slate-50'
          )}
          aria-expanded={isAccountOpen}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm border border-emerald-200">
              {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {profile?.fullName || 'Staff User'}
              </p>
              <p className="text-[11px] text-slate-500 truncate capitalize">
                {role || 'Staff'}
              </p>
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </div>
    </aside>
  );
};
