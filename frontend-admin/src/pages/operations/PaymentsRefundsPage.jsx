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

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20';

const tabClass = (isActive) =>
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${isActive ? 'bg-forest text-white' : 'text-slate-600 hover:bg-sage-soft hover:text-forest'
  }`;

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Payment Audit & Exception Refunds
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit customer Stripe transactions, review cancellation exception appeals, and dispatch authorized refunds.
          </p>
        </div>
        <Button variant="outline" onClick={fetchTransactions} className="w-full shrink-0 sm:w-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh Records
        </Button>
      </div>

      {/* Tabs + Search */}
      {/* Tabs wrap instead of scrolling; search moves beside them only when everything fits */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 min-[1400px]:flex-row min-[1400px]:items-center min-[1400px]:justify-between">
        <div className="grid grid-cols-1 gap-1 rounded-[18px] border border-border bg-sand-head p-1 sm:flex sm:w-fit sm:flex-wrap sm:items-center sm:rounded-full">
          <button type="button" onClick={() => setTabFilter('review')} className={tabClass(tabFilter === 'review')}>
            <AlertTriangle className={`h-4 w-4 ${tabFilter === 'review' ? 'text-amber-600' : ''}`} />
            Pending Exception Reviews ({pendingReviews.length})
          </button>

          <button type="button" onClick={() => setTabFilter('refunded')} className={tabClass(tabFilter === 'refunded')}>
            <RotateCcw className="h-4 w-4" />
            Refunded Records ({refundedRecords.length})
          </button>

          <button type="button" onClick={() => setTabFilter('all')} className={tabClass(tabFilter === 'all')}>
            <CreditCard className="h-4 w-4" />
            All Platform Transactions ({bookings.length})
          </button>
        </div>

        <div className="relative w-full min-[1400px]:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Filter reference #, customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>Booking Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Tour Package</TableHead>
              <TableHead>Departure Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                  Loading payment and refund records...
                </TableCell>
              </TableRow>
            ) : displayedList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  {tabFilter === 'review'
                    ? 'No pending exception refund requests require support review.'
                    : 'No records found matching criteria.'}
                </TableCell>
              </TableRow>
            ) : (
              displayedList.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="whitespace-nowrap font-mono text-xs font-medium text-foreground">
                      {b.bookingReference}
                    </div>
                    <div className="mt-0.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      Stripe: {b.stripeSessionId ? `${b.stripeSessionId.substring(0, 14)}...` : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{b.customerName}</div>
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
                  <TableCell className="whitespace-nowrap text-right font-medium tabular-nums text-foreground">
                    {formatPHP(b.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        variant={
                          b.paymentStatus === 'Paid'
                            ? 'success'
                            : b.paymentStatus === 'Refunded'
                              ? 'secondary'
                              : b.paymentStatus === 'Failed'
                                ? 'destructive'
                                : 'warning'
                        }
                      >
                        {b.paymentStatus}
                      </Badge>
                      {b.cancellationRequested && b.bookingStatus !== 'Cancelled' && (
                        <Badge variant="warning">Exception Review</Badge>
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
                        className="h-8"
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
                        className="h-8 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        Issue Refund
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">No action needed</span>
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
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-red-600" />
              Process Exception Refund
            </DialogTitle>
            <DialogDescription>
              Dispatches a formal Stripe refund for{' '}
              <strong className="font-mono font-medium text-foreground">{selectedBookingForRefund?.bookingReference}</strong>.
            </DialogDescription>
          </DialogHeader>

          {refundResultMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{refundResultMsg}</span>
            </div>
          )}

          <dl className="space-y-2 rounded-md border border-border bg-slate-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Customer:</dt>
              <dd className="text-right font-medium text-foreground">{selectedBookingForRefund?.customerName}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Total Refund Amount:</dt>
              <dd className="text-right font-semibold tabular-nums text-foreground">{formatPHP(selectedBookingForRefund?.totalPrice)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Departure:</dt>
              <dd className="text-right tabular-nums text-slate-800">{selectedBookingForRefund?.departureDate}</dd>
            </div>
            {selectedBookingForRefund?.cancellationRequestReason && (
              <div className="border-t border-border pt-2">
                <dt className="text-muted-foreground">Customer Reason:</dt>
                <dd className="mt-0.5 text-slate-800">{selectedBookingForRefund.cancellationRequestReason}</dd>
              </div>
            )}
          </dl>

          <form onSubmit={handleProcessRefund} className="mt-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="refund-reason">Support Exception Reason *</Label>
              <textarea
                id="refund-reason"
                rows={3}
                placeholder="State justification for exception approval (e.g. Typhoon warning, medical emergency certificate provided)..."
                value={exceptionReason}
                onChange={(e) => setExceptionReason(e.target.value)}
                required
                className={`${fieldClass} resize-y`}
              />
            </div>

            <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              Upon confirmation, the booking status will be updated to <strong className="font-medium text-foreground">Cancelled</strong>, payment status to <strong className="font-medium text-foreground">Refunded</strong>, and all {selectedBookingForRefund?.numberOfTravelers} slot(s) will be returned to the departure inventory.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedBookingForRefund(null)}
                disabled={processingRefund}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={processingRefund}>
                {processingRefund ? 'Refunding in Stripe...' : 'Confirm & Process Refund'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};