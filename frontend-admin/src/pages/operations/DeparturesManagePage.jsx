import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/table';
import {
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  AlertTriangle,
  UserCheck,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  ShieldAlert,
} from 'lucide-react';

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

export const DeparturesManagePage = () => {
  const [departures, setDepartures] = useState([]);
  const [packages, setPackages] = useState([]);
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeparture, setEditingDeparture] = useState(null);
  const [saving, setSaving] = useState(false);

  const [cancellingDeparture, setCancellingDeparture] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    packageId: '',
    departureDate: '',
    returnDate: '',
    departureTime: '07:00 AM',
    meetingPoint: '',
    bookingDeadlineHours: 24,
    capacity: 15,
    assignedGuideId: '',
    status: 'open',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [depsRes, pkgsRes, guidesRes] = await Promise.all([
        adminApi.getDepartures(),
        adminApi.getPackages(),
        adminApi.getUsers({ role: 'guide' }).catch(() => ({ data: [] })),
      ]);

      setDepartures(depsRes.data || depsRes || []);
      setPackages(pkgsRes.data || pkgsRes || []);
      setGuides(guidesRes.data || guidesRes || []);
    } catch (err) {
      console.error('[DeparturesManagePage] Error:', err);
      setError(err.message || 'Failed to load departure schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingDeparture(null);
    const firstPkg = packages[0];
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const depStr = today.toISOString().split('T')[0];

    let retStr = depStr;
    if (firstPkg) {
      const retDate = new Date(today);
      retDate.setDate(retDate.getDate() + (firstPkg.durationDays - 1));
      retStr = retDate.toISOString().split('T')[0];
    }

    setFormData({
      packageId: firstPkg?.id || '',
      departureDate: depStr,
      returnDate: retStr,
      departureTime: '07:00 AM',
      meetingPoint: firstPkg?.locationName ? `${firstPkg.locationName} Main Pier / Terminal` : '',
      bookingDeadlineHours: 24,
      capacity: 15,
      assignedGuideId: '',
      status: 'open',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dep) => {
    setEditingDeparture(dep);
    setFormData({
      packageId: dep.packageId || '',
      departureDate: dep.departureDate || '',
      returnDate: dep.returnDate || '',
      departureTime: dep.departureTime || '07:00 AM',
      meetingPoint: dep.meetingPoint || '',
      bookingDeadlineHours: dep.bookingDeadlineHours !== undefined ? Number(dep.bookingDeadlineHours) : 24,
      capacity: dep.capacity || 15,
      assignedGuideId: dep.assignedGuideId || '',
      status: dep.status || 'open',
    });
    setIsModalOpen(true);
  };

  // Auto-calculate return date when package or departure date changes
  const handlePackageChange = (pkgId) => {
    const pkg = packages.find((p) => p.id === pkgId);
    let retDate = formData.returnDate;
    if (pkg && formData.departureDate) {
      const d = new Date(formData.departureDate);
      d.setDate(d.getDate() + (pkg.durationDays - 1));
      retDate = d.toISOString().split('T')[0];
    }
    setFormData({ ...formData, packageId: pkgId, returnDate: retDate });
  };

  const handleDateChange = (depDate) => {
    const pkg = packages.find((p) => p.id === formData.packageId);
    let retDate = depDate;
    if (pkg && depDate) {
      const d = new Date(depDate);
      d.setDate(d.getDate() + (pkg.durationDays - 1));
      retDate = d.toISOString().split('T')[0];
    }
    setFormData({ ...formData, departureDate: depDate, returnDate: retDate });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Capacity validation guard
    if (editingDeparture && Number(formData.capacity) < (editingDeparture.bookedCount || 0)) {
      alert(
        `Cannot reduce capacity to ${formData.capacity}. There are already ${editingDeparture.bookedCount} booked travelers.`
      );
      return;
    }

    try {
      setSaving(true);
      const payload = {
        packageId: formData.packageId,
        departureDate: formData.departureDate,
        returnDate: formData.returnDate,
        departureTime: formData.departureTime || '07:00 AM',
        meetingPoint: formData.meetingPoint || '',
        bookingDeadlineHours: Number(formData.bookingDeadlineHours) || 24,
        capacity: Number(formData.capacity),
        assignedGuideId: formData.assignedGuideId || null,
        status: formData.status,
      };

      if (editingDeparture) {
        await adminApi.updateDeparture(editingDeparture.id, payload);
      } else {
        await adminApi.createDeparture(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('[SaveDeparture] Error:', err);
      alert(err.message || 'Failed to save departure schedule.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDeparture = async () => {
    if (!cancellingDeparture) return;
    try {
      setCancelling(true);
      await adminApi.cancelDeparture(cancellingDeparture.id, cancelReason || 'Operational rescheduling');
      setCancellingDeparture(null);
      setCancelReason('');
      fetchData();
    } catch (err) {
      console.error('[CancelDeparture] Error:', err);
      alert(err.message || 'Failed to cancel departure.');
    } finally {
      setCancelling(false);
    }
  };

  const filtered = departures.filter((dep) => {
    const matchesStatus = !statusFilter || dep.status === statusFilter;
    const matchesPackage = !packageFilter || dep.packageId === packageFilter;
    return matchesStatus && matchesPackage;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Departure Schedules & Slots
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule future tour departures, assign certified guides, and monitor capacity utilization.
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full shrink-0 sm:w-auto">
          <Plus className="h-4 w-4" />
          Schedule Departure
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
        <select
          value={packageFilter}
          onChange={(e) => setPackageFilter(e.target.value)}
          className={`${fieldClass} h-10 sm:w-64`}
        >
          <option value="">All Tour Packages</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${fieldClass} h-10 sm:w-56`}
        >
          <option value="">All Statuses</option>
          <option value="open">Open (Available)</option>
          <option value="full">Full (Capacity Reached)</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>

        <Button
          variant="outline"
          size="icon"
          onClick={fetchData}
          className="h-10 w-full text-slate-500 sm:ml-auto sm:w-10"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Fixed layout + sized columns: the table always fits its card, no sideways scrolling */}
        <Table className="table-fixed [&_td]:px-3 [&_th]:px-3 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:last-child]:pr-4 [&_th]:whitespace-normal [&_th]:leading-tight">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[23%]">Tour Package</TableHead>
              <TableHead className="w-[14%]">Schedule & Assembly</TableHead>
              <TableHead className="w-[18%]">Meeting Point & Cutoff</TableHead>
              <TableHead className="w-[14%]">Capacity & Bookings</TableHead>
              <TableHead className="w-[11%]">Assigned Guide</TableHead>
              <TableHead className="w-[104px]">Status</TableHead>
              <TableHead className="w-[88px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                  Loading departure schedules...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No departure dates found matching filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((dep) => {
                const pkg = packages.find((p) => p.id === dep.packageId) || dep.package;
                const guide = guides.find((g) => g.uid === dep.assignedGuideId || g.id === dep.assignedGuideId);
                const booked = dep.bookedCount || 0;
                const capacity = dep.capacity || 15;
                const pct = Math.min(100, Math.round((booked / capacity) * 100));

                return (
                  <TableRow key={dep.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{pkg?.name || 'Tour Package'}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {pkg?.durationDays || 1} Days Trip
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 whitespace-nowrap font-medium tabular-nums text-slate-800">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {dep.departureDate}
                      </div>
                      <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        Until {dep.returnDate || dep.departureDate}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-slate-600">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {dep.departureTime || '07:00 AM'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-0 items-start gap-1.5 text-slate-700" title={dep.meetingPoint}>
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{dep.meetingPoint || 'Designated Harbor / Terminal'}</span>
                      </div>
                      <div className="mt-1.5">
                        {dep.isDeadlinePassed ? (
                          <Badge variant="destructive" className="whitespace-normal">Cutoff Passed (Rule D)</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Cutoff: {dep.bookingDeadlineHours !== undefined ? dep.bookingDeadlineHours : 24}h prior
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full max-w-40 space-y-1.5">
                        <div className="flex justify-between text-xs tabular-nums text-slate-600">
                          <span>{booked} / {capacity} Booked</span>
                          <span className="font-medium text-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${pct >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {guide ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{guide.fullName || guide.displayName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          dep.status === 'open'
                            ? 'success'
                            : dep.status === 'full'
                              ? 'warning'
                              : dep.status === 'completed'
                                ? 'info'
                                : 'destructive'
                        }
                        className="capitalize"
                      >
                        {dep.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(dep)}
                          className="h-8 w-8 text-slate-500 hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {dep.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCancellingDeparture(dep);
                              setCancelReason('');
                            }}
                            className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Cancel Departure"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDeparture ? 'Edit Departure Schedule' : 'Schedule New Departure'}
            </DialogTitle>
            <DialogDescription>
              Assign packages, dates, passenger capacity, and lead tour guide.
            </DialogDescription>
          </DialogHeader>

          {editingDeparture && (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong className="font-medium">Capacity Safety Guard:</strong> Currently has{' '}
                <strong className="font-medium">{editingDeparture.bookedCount || 0} booked passenger(s)</strong>. Capacity cannot be reduced below this number.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="dep-pkg">Tour Package *</Label>
              <select
                id="dep-pkg"
                value={formData.packageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                disabled={Boolean(editingDeparture)}
                className={`${fieldClass} h-10`}
                required
              >
                <option value="">Select Package</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dep-date">Departure Date *</Label>
                <Input
                  id="dep-date"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ret-date">Return Date *</Label>
                <Input
                  id="ret-date"
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dep-time">Assembly / Departure Time *</Label>
                <Input
                  id="dep-time"
                  type="text"
                  placeholder="e.g. 06:30 AM"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  className="tabular-nums"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dep-deadline">Booking Cutoff (Rule D) *</Label>
                <select
                  id="dep-deadline"
                  value={formData.bookingDeadlineHours}
                  onChange={(e) => setFormData({ ...formData, bookingDeadlineHours: Number(e.target.value) })}
                  className={`${fieldClass} h-10`}
                >
                  <option value={12}>12 Hours Before</option>
                  <option value={24}>24 Hours Before (Standard)</option>
                  <option value={48}>48 Hours Before (2 Days)</option>
                  <option value={72}>72 Hours Before (3 Days)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-meeting">Meeting Point & Landmark *</Label>
              <Input
                id="dep-meeting"
                type="text"
                placeholder="e.g. El Nido Port Terminal Gate 2 or Hotel Lobby"
                value={formData.meetingPoint}
                onChange={(e) => setFormData({ ...formData, meetingPoint: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Printed on confirmed customer booking vouchers and receipts.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dep-cap">Total Capacity *</Label>
                <Input
                  id="dep-cap"
                  type="number"
                  min={editingDeparture?.bookedCount || 1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="tabular-nums"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dep-status">Status</Label>
                <select
                  id="dep-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`${fieldClass} h-10`}
                >
                  <option value="open">Open</option>
                  <option value="full">Full</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-guide">Assigned Tour Guide</Label>
              <select
                id="dep-guide"
                value={formData.assignedGuideId}
                onChange={(e) => setFormData({ ...formData, assignedGuideId: e.target.value })}
                className={`${fieldClass} h-10`}
              >
                <option value="">-- No Guide Assigned Yet --</option>
                {guides.map((g) => (
                  <option key={g.uid || g.id} value={g.uid || g.id}>
                    {g.fullName || g.displayName} ({g.email})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingDeparture ? 'Update Schedule' : 'Schedule Departure'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Departure Confirmation Modal */}
      <Dialog
        open={Boolean(cancellingDeparture)}
        onOpenChange={(open) => !open && setCancellingDeparture(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Cancel Departure Schedule
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the departure scheduled for{' '}
              <strong className="font-medium text-foreground">{cancellingDeparture?.departureDate}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Cancellation Reason (Logged in activity logs)</Label>
            <textarea
              id="cancel-reason"
              rows={3}
              placeholder="e.g. Inclement weather advisory from PAGASA, operational maintenance..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancellingDeparture(null)}
              disabled={cancelling}
            >
              Back
            </Button>
            <Button variant="destructive" onClick={handleCancelDeparture} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};