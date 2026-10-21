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
} from 'lucide-react';

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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Departure Schedules & Slots
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Schedule future tour departures, assign certified guides, and monitor capacity utilization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Schedule Departure
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open (Available)</option>
            <option value="full">Full (Capacity Reached)</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchData}
          className="text-slate-500 hover:text-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tour Package</TableHead>
              <TableHead>Schedule Dates</TableHead>
              <TableHead>Capacity & Bookings</TableHead>
              <TableHead>Assigned Guide</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  Loading departure schedules...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-400">
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
                    <TableCell className="font-semibold text-slate-900">
                      <div>{pkg?.name || 'Tour Package'}</div>
                      <div className="text-xs text-slate-400 font-normal">
                        {pkg?.durationDays || 1} Days Trip
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      <div className="font-medium flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {dep.departureDate}
                      </div>
                      <div className="text-xs text-slate-400">
                        Until {dep.returnDate || dep.departureDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-600">
                          <span>{booked} / {capacity} Booked</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pct >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {guide ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{guide.fullName || guide.displayName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
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
                        className="capitalize text-xs font-semibold"
                      >
                        {dep.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(dep)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {dep.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCancellingDeparture(dep);
                              setCancelReason('');
                            }}
                            className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingDeparture ? 'Edit Departure Schedule' : 'Schedule New Departure'}
            </DialogTitle>
            <DialogDescription>
              Assign packages, dates, passenger capacity, and lead tour guide.
            </DialogDescription>
          </DialogHeader>

          {editingDeparture && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Capacity Safety Guard:</strong> Currently has{' '}
                <strong>{editingDeparture.bookedCount || 0} booked passenger(s)</strong>. Capacity cannot be reduced below this number.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dep-pkg" className="text-xs font-semibold">
                Tour Package *
              </Label>
              <select
                id="dep-pkg"
                value={formData.packageId}
                onChange={(e) => handlePackageChange(e.target.value)}
                disabled={Boolean(editingDeparture)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dep-date" className="text-xs font-semibold">
                  Departure Date *
                </Label>
                <Input
                  id="dep-date"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ret-date" className="text-xs font-semibold">
                  Return Date *
                </Label>
                <Input
                  id="ret-date"
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dep-cap" className="text-xs font-semibold">
                  Total Capacity *
                </Label>
                <Input
                  id="dep-cap"
                  type="number"
                  min={editingDeparture?.bookedCount || 1}
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dep-status" className="text-xs font-semibold">
                  Status
                </Label>
                <select
                  id="dep-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="open">Open</option>
                  <option value="full">Full</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dep-guide" className="text-xs font-semibold">
                Assigned Tour Guide
              </Label>
              <select
                id="dep-guide"
                value={formData.assignedGuideId}
                onChange={(e) => setFormData({ ...formData, assignedGuideId: e.target.value })}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- No Guide Assigned Yet --</option>
                {guides.map((g) => (
                  <option key={g.uid || g.id} value={g.uid || g.id}>
                    {g.fullName || g.displayName} ({g.email})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
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
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Cancel Departure Schedule
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the departure scheduled for{' '}
              <strong>{cancellingDeparture?.departureDate}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="cancel-reason" className="text-xs font-semibold">
              Cancellation Reason (Logged in activity logs)
            </Label>
            <textarea
              id="cancel-reason"
              rows={3}
              placeholder="e.g. Inclement weather advisory from PAGASA, operational maintenance..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setCancellingDeparture(null)}
              disabled={cancelling}
            >
              Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelDeparture}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
