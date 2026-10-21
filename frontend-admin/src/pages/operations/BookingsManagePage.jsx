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
} from 'lucide-react';

export const BookingsManagePage = () => {
  const [bookings, setBookings] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updating, setUpdating] = useState(false);

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

  const filtered = bookings.filter((b) => {
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bookings & Reservations Hub
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Search customer reservations, audit payment statuses, reschedule departures, and manage support logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBookings}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Bookings
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search ref #, name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={bookingStatusFilter}
            onChange={(e) => setBookingStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference & Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Travelers & Total</TableHead>
              <TableHead>Statuses</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  Loading customer reservations...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                  No reservations found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {b.bookingReference}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {(b.createdAt || '').substring(0, 10)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-sm">
                      {b.customerName}
                    </div>
                    <div className="text-xs text-slate-500">{b.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-800">
                    {b.packageName}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {b.departureDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-slate-900 text-sm">
                      {formatPHP(b.totalPrice)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {b.numberOfTravelers} guest{b.numberOfTravelers === 1 ? '' : 's'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
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
                        className="text-[10px] px-1.5 py-0"
                      >
                        {b.bookingStatus}
                      </Badge>
                      <Badge
                        variant={
                          b.paymentStatus === 'Paid'
                            ? 'outline'
                            : b.paymentStatus === 'Refunded'
                            ? 'secondary'
                            : 'warning'
                        }
                        className="text-[10px] px-1.5 py-0 font-medium"
                      >
                        Pay: {b.paymentStatus}
                      </Badge>
                      {b.cancellationRequested && b.bookingStatus !== 'Cancelled' && (
                        <Badge variant="destructive" className="text-[9px] px-1 py-0">
                          Review Req.
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openBookingModal(b)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 flex items-center gap-1 ml-auto"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-emerald-600" />
                  Booking {selectedBooking?.bookingReference}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Created on {(selectedBooking?.createdAt || '').substring(0, 10)} &bull; Customer UID: {selectedBooking?.customerId}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {loadingDetails ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
              Loading complete booking dossier...
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {/* Cancellation Exception Request Alert */}
              {bookingDetails?.cancellationRequested && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    Customer Requested Cancellation Review
                  </div>
                  <div>
                    <strong>Customer Reason:</strong> {bookingDetails.cancellationRequestReason || 'No reason specified'}
                  </div>
                  <div className="text-[11px] text-amber-700">
                    Window: Departed in {bookingDetails.cancellationDaysRemaining} day(s), cutoff was {bookingDetails.cancellationCutoffDays} days. Exception review required.
                  </div>
                </div>
              )}

              {/* Customer and Trip Grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Customer Information
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-500">Name:</span>{' '}
                      <span className="font-semibold text-slate-900">{bookingDetails?.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Email:</span>{' '}
                      <span className="font-semibold text-slate-900">{bookingDetails?.customerEmail}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>{' '}
                      <span className="font-semibold text-slate-900">{bookingDetails?.customerPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Special Notes:</span>{' '}
                      <span className="text-slate-800">{bookingDetails?.specialRequests || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Tour & Financial
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-500">Tour Package:</span>{' '}
                      <span className="font-semibold text-slate-900">{bookingDetails?.packageName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Departure Date:</span>{' '}
                      <span className="font-semibold text-slate-900">{bookingDetails?.departureDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Travelers:</span>{' '}
                      <span className="font-semibold text-slate-900">{bookingDetails?.numberOfTravelers} guest(s)</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Price:</span>{' '}
                      <span className="font-bold text-emerald-700 text-sm">{formatPHP(bookingDetails?.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Traveler Manifest List */}
              {bookingDetails?.travelerManifest && bookingDetails.travelerManifest.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Traveler Manifest
                  </h4>
                  <div className="space-y-1.5">
                    {bookingDetails.travelerManifest.map((t, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            {idx + 1}. {t.fullName || 'Traveler'}
                          </span>
                          <span className="ml-2 text-slate-400">
                            ({t.relationship || 'Traveler'})
                          </span>
                        </div>
                        <div className="text-slate-500">
                          {t.dietaryOrMedicalNotes ? (
                            <Badge variant="outline" className="text-[10px]">
                              Diet: {t.dietaryOrMedicalNotes}
                            </Badge>
                          ) : (
                            'No dietary notes'
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Support Staff Internal Notes Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Internal Support Notes Timeline
                </h4>
                {(!bookingDetails?.internalNotes || bookingDetails.internalNotes.length === 0) ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                    No internal support notes logged yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {bookingDetails.internalNotes.map((n, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                          <span className="font-semibold text-slate-600">
                            {n.authorName || 'Staff'}
                          </span>
                          <span>{(n.timestamp || '').substring(0, 16).replace('T', ' ')}</span>
                        </div>
                        <p className="text-slate-800">{n.note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Support Action Form: Status, Reschedule, Add Note */}
              <form onSubmit={handleSaveSupportUpdates} className="space-y-4 pt-3 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Booking Status</Label>
                    <select
                      value={editBookingStatus}
                      onChange={(e) => setEditBookingStatus(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Pending">Pending</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Payment Status</Label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-blue-600" />
                      Reschedule to New Departure Date
                    </Label>
                    <select
                      value={rescheduleDepId}
                      onChange={(e) => setRescheduleDepId(e.target.value)}
                      className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
                    Append Internal Note
                  </Label>
                  <textarea
                    rows={2}
                    placeholder="Log conversation with customer, special handling, or approval remarks..."
                    value={newInternalNote}
                    onChange={(e) => setNewInternalNote(e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedBooking(null)}
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    disabled={updating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
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
