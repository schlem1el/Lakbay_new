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
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import coronLagoon from '../../assets/coron-lagoon.jpg';

export const AdminSidebar = ({ isOpen = false, onClose }) => {
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
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-forest-deep/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col bg-forest text-sidebar-foreground transition-transform duration-300 ease-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header — lagoon photo fading into the forest panel */}
        <div className="relative h-[132px] shrink-0 overflow-hidden">
          <img
            src={coronLagoon}
            alt="Coron lagoon"
            className="absolute inset-0 h-full w-full object-cover object-[center_60%]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-forest/30 via-forest/70 to-forest"
            aria-hidden="true"
          />
          <div className="relative flex h-full items-end justify-between px-6 pb-4">
            <div>
              <span className="relative font-heading text-[2.4rem] leading-none text-white">
                Lakbay
                <span
                  className="absolute -right-3 bottom-1.5 h-2 w-2 rounded-full bg-terracotta ring-4 ring-terracotta/25"
                  aria-hidden="true"
                />
              </span>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                Tour Operations
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-[12px] text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label="Main" className="scrollbar-dark flex-1 space-y-6 overflow-y-auto px-3 pb-5 pt-4">
          {navigationSections.map((section) => {
            // Filter items based on user role
            const visibleItems = section.items.filter((item) =>
              item.roles.includes(role || '')
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                <h3 className="px-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  {section.title}
                </h3>
                <div className="mt-2 space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] transition-colors',
                            isActive
                              ? 'bg-white/[0.09] font-bold text-white'
                              : 'font-medium text-white/70 hover:bg-white/[0.05] hover:text-white'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span
                                className="absolute -left-3 inset-y-1.5 w-[3px] rounded-r-full bg-terracotta"
                                aria-hidden="true"
                              />
                            )}
                            <Icon
                              className={cn(
                                'h-[18px] w-[18px] shrink-0',
                                isActive ? 'text-white' : 'text-white/55 group-hover:text-white/80'
                              )}
                            />
                            <span>{item.name}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Account Footer with Clickable Dropdown for Sign Out */}
        <div className="relative border-t border-white/10 p-3" ref={accountRef}>
          {/* Dropdown Menu */}
          {isAccountOpen && (
            <div className="absolute bottom-full left-3 right-3 z-50 mb-2 rounded-2xl border border-border bg-card p-1.5 text-foreground shadow-pop">
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-bold text-foreground">
                  {profile?.fullName || 'Staff User'}
                </p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
                    className="capitalize"
                  >
                    {role || 'Staff'}
                  </Badge>
                </div>
              </div>
              <div className="my-1 border-t border-border" />
              <Link
                to="/settings"
                onClick={() => {
                  setIsAccountOpen(false);
                  if (onClose) onClose();
                }}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-sage-soft hover:text-forest"
              >
                <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Account Settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsAccountOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium text-status-bad transition-colors hover:bg-[#F6E3E0] cursor-pointer"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Trigger Button */}
          <button
            type="button"
            onClick={() => setIsAccountOpen((prev) => !prev)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-[12px] p-2 text-left transition-colors cursor-pointer',
              isAccountOpen ? 'bg-white/[0.09]' : 'hover:bg-white/[0.05]'
            )}
            aria-expanded={isAccountOpen}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-sm font-bold text-forest">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {profile?.fullName || 'Staff User'}
                </p>
                <p className="truncate text-xs capitalize text-white/50">
                  {role || 'Staff'}
                </p>
              </div>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/40" />
          </button>
        </div>
      </aside>
    </>
  );
};
