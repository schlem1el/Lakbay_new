import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  TrendingUp,
  DollarSign,
  Users,
  Ticket,
  Calendar,
  Package,
  MapPin,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardOverviewPage = () => {
  const { role, profile, user } = useStaffAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const response =
        role === 'operator'
          ? await adminApi.getOperatorDashboardMetrics()
          : await adminApi.getDashboardMetrics();
      setData(response.data || response);
    } catch (err) {
      console.error('[DashboardOverviewPage] Metrics error:', err);
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [role]);

  const formatPHP = (amount) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        <span className="text-sm text-muted-foreground">
          Aggregating platform revenue and operations data...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-red-200 bg-red-50 px-6 py-8 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-red-100">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-red-800">Failed to Load Dashboard</h3>
        <p className="mt-1 text-sm text-red-700">{error}</p>
        <Button onClick={fetchMetrics} variant="outline" className="mt-5 w-full border-red-200 sm:w-auto">
          Retry Loading
        </Button>
      </div>
    );
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {role === 'operator'
              ? `${profile?.agencyName || 'Tour Operator'} Dashboard`
              : 'Operations & Financial Overview'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === 'operator'
              ? 'Performance summary for your accredited tour packages, active departures, and traveler reservations.'
              : 'Real-time Philippine travel booking volume, verified revenue, and departure schedules.'}
          </p>
        </div>
        <Button variant="outline" onClick={fetchMetrics} className="w-full shrink-0 sm:w-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh Metrics
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Collected Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 sm:pb-2">
            <CardTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Verified Revenue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
              <span className="text-sm font-semibold">₱</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
              {formatPHP(summary.collectedRevenue || summary.totalRevenue || 0)}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Excludes unpaid and cancelled bookings
            </p>
          </CardContent>
        </Card>

        {/* Total Bookings / Booked Travelers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 sm:pb-2">
            <CardTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {role === 'operator' ? 'Booked Travelers' : 'Total Reservations'}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sky-50 text-sky-700">
              <Ticket className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
              {role === 'operator'
                ? summary.totalBookedTravelers || 0
                : summary.totalBookings || 0}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {role === 'operator' ? (
                <span>On your active departures</span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {summary.confirmedBookings || 0} Confirmed
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {summary.pendingBookings || 0} Pending
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Open Departures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 sm:pb-2">
            <CardTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Active Departures
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50 text-violet-700">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
              {summary.upcomingDeparturesCount || summary.activeDeparturesCount || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Available future departure dates
            </p>
          </CardContent>
        </Card>

        {/* Registered Customers / Tour Packages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 sm:pb-2">
            <CardTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {role === 'operator' ? 'Agency Tour Packages' : 'Registered Travelers'}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-700">
              {role === 'operator' ? <Package className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
              {role === 'operator'
                ? summary.totalPackages || 0
                : summary.totalCustomers || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {role === 'operator'
                ? `${summary.approvalBreakdown?.approved || 0} approved, ${summary.approvalBreakdown?.pending || 0} pending`
                : 'Verified platform traveler profiles'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown and Top Packages Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Breakdown</CardTitle>
            <CardDescription>
              Current operational distribution of customer reservations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(charts.bookingStatusBreakdown || []).map((item) => {
                const total = summary.totalBookings || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.status} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{item.status}</span>
                      <span className="tabular-nums text-muted-foreground">
                        <span className="font-medium text-foreground">{item.count}</span> ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          item.status === 'Confirmed'
                            ? 'bg-emerald-500'
                            : item.status === 'Pending'
                            ? 'bg-amber-400'
                            : item.status === 'Completed'
                            ? 'bg-sky-500'
                            : 'bg-red-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Tour Packages */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Most Popular Tour Packages</CardTitle>
              <CardDescription>
                Ranked by total booked passenger headcount
              </CardDescription>
            </div>
            <Link
              to="/catalog/packages"
              className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View Packages <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {(!charts.topPackages || charts.topPackages.length === 0) ? (
              <div className="rounded-md border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                No booking records found for popularity ranking.
              </div>
            ) : (
              <ol className="divide-y divide-border rounded-md border border-border">
                {charts.topPackages.map((pkg, idx) => (
                  <li
                    key={pkg.name}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold tabular-nums text-slate-600">
                        {idx + 1}
                      </span>
                      <span className="truncate text-sm font-medium text-foreground">
                        {pkg.name}
                      </span>
                    </div>
                    <Badge variant="secondary" className="shrink-0 tabular-nums">
                      {pkg.travelers} traveler{pkg.travelers === 1 ? '' : 's'}
                    </Badge>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Catalog Quick Stats */}
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Catalog Inventory Summary
        </h3>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
          <div className="bg-card p-4">
            <span className="text-xs text-muted-foreground">Destinations</span>
            <div className="mt-1 font-heading text-[2rem] font-normal leading-none tabular-nums text-foreground">
              {summary.totalDestinations || 0}
            </div>
          </div>
          <div className="bg-card p-4">
            <span className="text-xs text-muted-foreground">Tour Packages</span>
            <div className="mt-1 font-heading text-[2rem] font-normal leading-none tabular-nums text-foreground">
              {summary.totalPackages || 0}
            </div>
          </div>
          <div className="bg-card p-4">
            <span className="text-xs text-muted-foreground">Completed Tours</span>
            <div className="mt-1 font-heading text-[2rem] font-normal leading-none tabular-nums text-foreground">
              {summary.completedBookings || 0}
            </div>
          </div>
          <div className="bg-card p-4">
            <span className="text-xs text-muted-foreground">Cancelled Bookings</span>
            <div className="mt-1 font-heading text-[2rem] font-normal leading-none tabular-nums text-foreground">
              {summary.cancelledBookings || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
