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
  Search,
  RefreshCw,
  Ticket,
  Calendar,
  User,
  CreditCard,
  MessageSquare,
  AlertCircle,
  Eye,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20';

const sectionLabel = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

export const BookingsManagePage = () => {
  const [bookings, setBookings] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [rescheduleOnlyFilter, setRescheduleOnlyFilter] = useState(false);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [moderatingReschedule, setModeratingReschedule] = useState(false);

  // Form in modal
  const [newInternalNote, setNewInternalNote] = useState('');
  const [rescheduleDepId, setRescheduleDepId] = useState('');
  const [editBookingStatus, setEditBookingStatus] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getAllBookings({
        bookingStatus: bookingStatusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
      });
      setBookings(res.data || res || []);
    } catch (err) {
      console.error('[BookingsManagePage] Error:', err);
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [bookingStatusFilter, paymentStatusFilter]);

  const formatPHP = (val) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const openBookingModal = async (booking) => {
    setSelectedBooking(booking);
    setEditBookingStatus(booking.bookingStatus || 'Confirmed');
    setEditPaymentStatus(booking.paymentStatus || 'Paid');
    setRescheduleDepId('');
    setNewInternalNote('');

    try {
      setLoadingDetails(true);
      const [detailRes, depRes] = await Promise.all([
        adminApi.getBookingById(booking.id),
        adminApi.getDepartures({ packageId: booking.packageId }).catch(() => ({ data: [] })),
      ]);
      setBookingDetails(detailRes.data || detailRes);
      // Filter departures to open future ones
      const openDeps = (depRes.data || depRes || []).filter(
        (d) => d.id !== booking.departureId && d.status === 'open'
      );
      setDepartures(openDeps);
    } catch (err) {
      console.error('[BookingDetails] Error:', err);
      setBookingDetails(booking);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveSupportUpdates = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    try {
      setUpdating(true);
      const payload = {
        bookingStatus: editBookingStatus,
        paymentStatus: editPaymentStatus,
      };

      if (newInternalNote.trim()) {
        payload.internalNotes = newInternalNote.trim();
      }

      if (rescheduleDepId) {
        payload.rescheduleDepartureId = rescheduleDepId;
      }

      await adminApi.supportUpdateBooking(selectedBooking.id, payload);
      alert('Booking record updated successfully.');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error('[UpdateBooking] Error:', err);
      alert(err.message || 'Failed to update booking.');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveReschedule = async (bookingId) => {
    if (!window.confirm('Approve this reschedule request? Seats will be atomically reallocated between departures.')) {
      return;
    }
    try {
      setModeratingReschedule(true);
      await adminApi.approveReschedule(bookingId);
      alert('Reschedule request approved successfully! Schedule updated and customer notified.');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error('Approve reschedule error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to approve reschedule request.');
    } finally {
      setModeratingReschedule(false);
    }
  };

  const handleRejectReschedule = async (bookingId) => {
    const reason = window.prompt(
      'Enter explanation for declining reschedule request (sent to traveler):',
      'Unable to accommodate departure change due to guide or boat capacity constraints.'
    );
    if (reason === null) return;

    try {
      setModeratingReschedule(true);
      await adminApi.rejectReschedule(bookingId, reason);
      alert('Reschedule request rejected and customer notified.');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      console.error('Reject reschedule error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to reject reschedule request.');
    } finally {
      setModeratingReschedule(false);
    }
  };

  const pendingRescheduleCount = bookings.filter((b) => b.rescheduleRequest?.status === 'pending').length;

  const filtered = bookings.filter((b) => {
    if (rescheduleOnlyFilter && b.rescheduleRequest?.status !== 'pending') {
      return false;
    }
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      b.bookingReference?.toLowerCase().includes(term) ||
      b.customerName?.toLowerCase().includes(term) ||
      b.customerEmail?.toLowerCase().includes(term) ||
      b.packageName?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Bookings & Reservations Hub
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search customer reservations, audit payment statuses, reschedule departures, and manage support logs.
          </p>
        </div>
        <Button variant="outline" onClick={fetchBookings} className="w-full shrink-0 sm:w-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh Bookings
        </Button>
      </div>

      {/* Filter Bar */}
      {/* One row on desktop: search grows, filters keep a fixed width */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative w-full min-w-0 lg:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search ref #, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:shrink-0 lg:flex-nowrap lg:items-center">
          <select
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value)}
            className={`${fieldClass} h-10 lg:w-48`}
          >
            <option value="">All Booking Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className={`${fieldClass} h-10 lg:w-48`}
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="Failed">Failed</option>
          </select>

          <button
            type="button"
            onClick={() => setRescheduleOnlyFilter(!rescheduleOnlyFilter)}
            aria-pressed={rescheduleOnlyFilter}
            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3.5 sm:col-span-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${rescheduleOnlyFilter
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-input bg-card text-slate-700 hover:bg-slate-50'
              }`}
          >
            <Clock className="h-4 w-4" />
            <span>Reschedule Requests</span>
            {pendingRescheduleCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${rescheduleOnlyFilter ? 'bg-amber-200 text-amber-900' : 'bg-amber-100 text-amber-800'
                  }`}
              >
                {pendingRescheduleCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead>Reference & Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead className="text-right">Travelers & Total</TableHead>
              <TableHead>Statuses</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                  Loading customer reservations...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No reservations found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="whitespace-nowrap font-mono text-xs font-medium text-foreground">
                      {b.bookingReference}
                    </div>
                    <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                      {(b.createdAt || '').substring(0, 10)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {b.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground">{b.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {b.packageName}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 whitespace-nowrap tabular-nums text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {b.departureDate}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="whitespace-nowrap font-medium tabular-nums text-foreground">
                      {formatPHP(b.totalPrice)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {b.numberOfTravelers} guest{b.numberOfTravelers === 1 ? '' : 's'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant={
                          b.bookingStatus === 'Confirmed'
                            ? 'success'
                            : b.bookingStatus === 'Pending'
                              ? 'warning'
                              : b.bookingStatus === 'Completed'
                                ? 'info'
                                : 'destructive'
                        }
                      >
                        {b.bookingStatus}
                      </Badge>
                      <Badge
                        variant={
                          b.paymentStatus === 'Paid'
                            ? 'outline'
                            : b.paymentStatus === 'Refunded'
                              ? 'secondary'
                              : b.paymentStatus === 'Failed'
                                ? 'destructive'
                                : 'warning'
                        }
                      >
                        Pay: {b.paymentStatus}
                      </Badge>
                      {b.cancellationRequested && b.bookingStatus !== 'Cancelled' && (
                        <Badge variant="destructive">Review Req.</Badge>
                      )}
                      {b.rescheduleRequest?.status === 'pending' && (
                        <Badge variant="warning">Reschedule Req.</Badge>
                      )}
                      {b.rescheduleRequest?.status === 'approved' && (
                        <Badge variant="outline" className="text-slate-500">
                          Rescheduled
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openBookingModal(b)}
                      className="h-8"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Booking Details & Support Hub Modal */}
      <Dialog
        open={Boolean(selectedBooking)}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Booking <span className="font-mono">{selectedBooking?.bookingReference}</span>
            </DialogTitle>
            <DialogDescription className="break-all">
              Created on {(selectedBooking?.createdAt || '').substring(0, 10)} &bull; Customer UID: {selectedBooking?.customerId}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
              Loading complete booking dossier...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cancellation Exception Request Alert */}
              {bookingDetails?.cancellationRequested && (
                <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Customer Requested Cancellation Review
                  </div>
                  <div>
                    <strong className="font-medium">Customer Reason:</strong> {bookingDetails.cancellationRequestReason || 'No reason specified'}
                  </div>
                  <div className="text-xs text-amber-800">
                    Window: Departed in {bookingDetails.cancellationDaysRemaining} day(s), cutoff was {bookingDetails.cancellationCutoffDays} days. Exception review required.
                  </div>
                </div>
              )}

              {/* Reschedule Request Review Card */}
              {bookingDetails?.rescheduleRequest?.status === 'pending' && (
                <div className="space-y-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-medium text-amber-900">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      Customer Requested Departure Reschedule
                    </div>
                    <Badge variant="warning">Pending Action</Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-amber-200 bg-amber-200 sm:grid-cols-2">
                    <div className="bg-card p-3">
                      <span className={`block ${sectionLabel}`}>
                        Current Departure
                      </span>
                      <p className="mt-1 font-medium tabular-nums text-foreground">
                        {bookingDetails.departureDate} ({bookingDetails.departureTime || '07:00 AM'})
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={bookingDetails.meetingPoint}>
                        {bookingDetails.meetingPoint || 'Port Terminal'}
                      </p>
                    </div>
                    <div className="bg-card p-3">
                      <span className="block text-xs font-medium uppercase tracking-wide text-emerald-700">
                        Requested Target Departure
                      </span>
                      <p className="mt-1 font-medium tabular-nums text-foreground">
                        {bookingDetails.rescheduleRequest.targetDepartureDate} ({bookingDetails.rescheduleRequest.targetDepartureTime || '07:00 AM'})
                      </p>
                      <p className="truncate text-xs text-muted-foreground" title={bookingDetails.rescheduleRequest.targetMeetingPoint}>
                        {bookingDetails.rescheduleRequest.targetMeetingPoint || 'Port Terminal'}
                      </p>
                    </div>
                  </div>

                  {bookingDetails.rescheduleRequest.reason && (
                    <div className="rounded-md border border-amber-200 bg-card px-3 py-2.5 text-slate-700">
                      <span className="font-medium text-foreground">Traveler Reason: </span>
                      <span>"{bookingDetails.rescheduleRequest.reason}"</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span
                      className={`text-xs font-medium ${bookingDetails.rescheduleRequest.withinCutoff
                          ? 'text-emerald-700'
                          : 'text-amber-800'
                        }`}
                    >
                      Policy Window:{' '}
                      {bookingDetails.rescheduleRequest.withinCutoff
                        ? 'Submitted within standard modification window'
                        : `Submitted past ${bookingDetails.rescheduleRequest.cutoffDays || 7}-day cutoff (${bookingDetails.rescheduleRequest.daysRemaining} days left)`}
                    </span>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={moderatingReschedule}
                        onClick={() => handleRejectReschedule(selectedBooking.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Reject Request
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={moderatingReschedule}
                        onClick={() => handleApproveReschedule(selectedBooking.id)}
                      >
                        {moderatingReschedule ? 'Processing...' : 'Approve Reschedule'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer and Trip Grid */}
              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
                <div className="bg-card p-4">
                  <h4 className={`mb-3 ${sectionLabel}`}>
                    Customer Information
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Name:</dt>{' '}
                      <dd className="text-right font-medium text-foreground">{bookingDetails?.customerName}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Email:</dt>{' '}
                      <dd className="break-all text-right font-medium text-foreground">{bookingDetails?.customerEmail}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Phone:</dt>{' '}
                      <dd className="text-right font-medium tabular-nums text-foreground">{bookingDetails?.customerPhone || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="shrink-0 text-muted-foreground">Special Notes:</dt>{' '}
                      <dd className="text-right text-slate-700">{bookingDetails?.specialRequests || 'None'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-card p-4">
                  <h4 className={`mb-3 ${sectionLabel}`}>
                    Tour & Financial
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="shrink-0 text-muted-foreground">Tour Package:</dt>{' '}
                      <dd className="text-right font-medium text-foreground">{bookingDetails?.packageName}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Departure Date:</dt>{' '}
                      <dd className="text-right font-medium tabular-nums text-foreground">{bookingDetails?.departureDate}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Travelers:</dt>{' '}
                      <dd className="text-right font-medium text-foreground">{bookingDetails?.numberOfTravelers} guest(s)</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-border pt-2">
                      <dt className="text-muted-foreground">Total Price:</dt>{' '}
                      <dd className="text-right text-base font-semibold tabular-nums text-foreground">{formatPHP(bookingDetails?.totalPrice)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Traveler Manifest List */}
              {bookingDetails?.travelerManifest && bookingDetails.travelerManifest.length > 0 && (
                <div className="space-y-2">
                  <h4 className={sectionLabel}>
                    Traveler Manifest
                  </h4>
                  <ul className="divide-y divide-border rounded-md border border-border">
                    {bookingDetails.travelerManifest.map((t, idx) => (
                      <li
                        key={idx}
                        className="flex flex-col gap-1.5 px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <span className="font-medium text-foreground">
                            {idx + 1}. {t.fullName || 'Traveler'}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            ({t.relationship || 'Traveler'})
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t.dietaryOrMedicalNotes ? (
                            <Badge variant="warning">
                              Diet: {t.dietaryOrMedicalNotes}
                            </Badge>
                          ) : (
                            'No dietary notes'
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Support Staff Internal Notes Timeline */}
              <div className="space-y-2">
                <h4 className={sectionLabel}>
                  Internal Support Notes Timeline
                </h4>
                {(!bookingDetails?.internalNotes || bookingDetails.internalNotes.length === 0) ? (
                  <div className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm text-muted-foreground">
                    No internal support notes logged yet.
                  </div>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                    {bookingDetails.internalNotes.map((n, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-slate-700">
                            {n.authorName || 'Staff'}
                          </span>
                          <span className="tabular-nums">{(n.timestamp || '').substring(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p className="text-slate-800">{n.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Support Action Form: Status, Reschedule, Add Note */}
              <form onSubmit={handleSaveSupportUpdates} className="space-y-5 border-t border-border pt-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Booking Status</Label>
                    <select
                      value={editBookingStatus}
                      onChange={(e) => setEditBookingStatus(e.target.value)}
                      className={`${fieldClass} h-10`}
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Payment Status</Label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value)}
                      className={`${fieldClass} h-10`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Refunded">Refunded</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* Reschedule departure */}
                {departures.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400" />
                      Reschedule to New Departure Date
                    </Label>
                    <select
                      value={rescheduleDepId}
                      onChange={(e) => setRescheduleDepId(e.target.value)}
                      className={`${fieldClass} h-10`}
                    >
                      <option value="">-- Keep Current Departure ({bookingDetails?.departureDate}) --</option>
                      {departures.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.departureDate} (Available slots: {d.capacity - (d.bookedCount || 0)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Append note */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    Append Internal Note
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Log conversation with customer, special handling, or approval remarks..."
                    value={newInternalNote}
                    onChange={(e) => setNewInternalNote(e.target.value)}
                    className={`${fieldClass} resize-y`}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Close
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? 'Saving Changes...' : 'Save Support Changes'}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};