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
  CreditCard,
  RefreshCw,
  Search,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Check,
  Calendar,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const PaymentsRefundsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabFilter, setTabFilter] = useState('review'); // 'review' | 'all' | 'refunded'
  const [search, setSearch] = useState('');

  // Refund Modal
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState(null);
  const [exceptionReason, setExceptionReason] = useState('Medical / Emergency documentation verified');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [refundResultMsg, setRefundResultMsg] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getAllBookings({ limit: 100 });
      setBookings(res.data || res || []);
    } catch (err) {
      console.error('[PaymentsRefundsPage] Error:', err);
      setError(err.message || 'Failed to load transaction records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatPHP = (val) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedBookingForRefund) return;

    try {
      setProcessingRefund(true);
      setRefundResultMsg('');
      const res = await adminApi.processExceptionRefund(
        selectedBookingForRefund.id,
        exceptionReason
      );
      setRefundResultMsg(
        'Exception refund successfully processed! Stripe refund dispatched and reserved seats released.'
      );
      setTimeout(() => {
        setSelectedBookingForRefund(null);
        setRefundResultMsg('');
        fetchTransactions();
      }, 1500);
    } catch (err) {
      console.error('[ProcessRefund] Error:', err);
      alert(err.message || 'Failed to process exception refund.');
    } finally {
      setProcessingRefund(false);
    }
  };

  // Filter lists
  const pendingReviews = bookings.filter(
    (b) => b.cancellationRequested && b.bookingStatus !== 'Cancelled'
  );

  const refundedRecords = bookings.filter(
    (b) => b.paymentStatus === 'Refunded' || b.bookingStatus === 'Cancelled'
  );

  const activePaid = bookings.filter(
    (b) => b.paymentStatus === 'Paid' && b.bookingStatus !== 'Cancelled'
  );

  const displayedList = (
    tabFilter === 'review'
      ? pendingReviews
      : tabFilter === 'refunded'
      ? refundedRecords
      : bookings
  ).filter((b) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      b.bookingReference?.toLowerCase().includes(term) ||
      b.customerName?.toLowerCase().includes(term) ||
      b.customerEmail?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Payment Audit & Exception Refunds
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit customer Stripe transactions, review cancellation exception appeals, and dispatch authorized refunds.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Records
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setTabFilter('review')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            tabFilter === 'review'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Pending Exception Reviews ({pendingReviews.length})
        </button>

        <button
          type="button"
          onClick={() => setTabFilter('refunded')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            tabFilter === 'refunded'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refunded Records ({refundedRecords.length})
        </button>

        <button
          type="button"
          onClick={() => setTabFilter('all')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
            tabFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          All Platform Transactions ({bookings.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Filter reference #, customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 text-sm bg-white"
        />
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
              <TableHead>Booking Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Tour Package</TableHead>
              <TableHead>Departure Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  Loading payment and refund records...
                </TableCell>
              </TableRow>
            ) : displayedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                  {tabFilter === 'review'
                    ? 'No pending exception refund requests require support review.'
                    : 'No records found matching criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              displayedList.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-mono font-bold text-slate-900 text-xs">
                      {b.bookingReference}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Stripe: {b.stripeSessionId ? `${b.stripeSessionId.substring(0, 14)}...` : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-sm">{b.customerName}</div>
                    <div className="text-xs text-slate-500">{b.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-800 font-medium">
                    {b.packageName}
                  </TableCell>
                  <TableCell className="text-sm text-slate-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {b.departureDate}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {formatPHP(b.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge
                        variant={
                          b.paymentStatus === 'Paid'
                            ? 'success'
                            : b.paymentStatus === 'Refunded'
                            ? 'destructive'
                            : 'warning'
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {b.paymentStatus}
                      </Badge>
                      {b.cancellationRequested && b.bookingStatus !== 'Cancelled' && (
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                          Exception Review
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.cancellationRequested && b.bookingStatus !== 'Cancelled' ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForRefund(b);
                          setExceptionReason('Approved cancellation appeal: documentation verified');
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs flex items-center gap-1 ml-auto shadow-xs"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Review & Refund
                      </Button>
                    ) : b.paymentStatus === 'Paid' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBookingForRefund(b);
                          setExceptionReason('Management approved manual refund');
                        }}
                        className="text-xs text-slate-600 hover:text-red-600 hover:border-red-200 ml-auto"
                      >
                        Issue Refund
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No action needed</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Exception Refund Modal Dialog */}
      <Dialog
        open={Boolean(selectedBookingForRefund)}
        onOpenChange={(open) => !open && setSelectedBookingForRefund(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Process Exception Refund
            </DialogTitle>
            <DialogDescription>
              Dispatches a formal Stripe refund for{' '}
              <strong>{selectedBookingForRefund?.bookingReference}</strong>.
            </DialogDescription>
          </DialogHeader>

          {refundResultMsg && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{refundResultMsg}</span>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900">{selectedBookingForRefund?.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Refund Amount:</span>
              <span className="font-bold text-emerald-700">{formatPHP(selectedBookingForRefund?.totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Departure:</span>
              <span className="font-medium text-slate-800">{selectedBookingForRefund?.departureDate}</span>
            </div>
            {selectedBookingForRefund?.cancellationRequestReason && (
              <div className="pt-1 border-t border-slate-200">
                <span className="text-slate-500">Customer Reason:</span>
                <p className="text-slate-800 italic mt-0.5">{selectedBookingForRefund.cancellationRequestReason}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleProcessRefund} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="refund-reason" className="text-xs font-semibold">
                Support Exception Reason *
              </Label>
              <textarea
                id="refund-reason"
                rows={3}
                placeholder="State justification for exception approval (e.g. Typhoon warning, medical emergency certificate provided)..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                required
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Upon confirmation, the booking status will be updated to <strong>Cancelled</strong>, payment status to <strong>Refunded</strong>, and all {selectedBookingForRefund?.numberOfTravelers} slot(s) will be returned to the departure inventory.
            </p>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBookingForRefund(null)}
                disabled={processingRefund}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={processingRefund}
              >
                {processingRefund ? 'Refunding in Stripe...' : 'Confirm & Process Refund'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
