import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
  Star,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  Flag,
  Trash2,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

const tabClass = (isActive) =>
  `inline-flex shrink-0 items-center rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
    isActive ? 'bg-forest text-white' : 'text-slate-600 hover:bg-sage-soft hover:text-forest'
  }`;

export const ReviewsModeratePage = () => {
  const { role } = useStaffAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'approved' | 'hidden' | 'flagged'

  // Delete Dialog State
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Action Loading State per review id
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getReviews();
      setReviews(res.data || []);
    } catch (err) {
      console.error('[ReviewsModeratePage] Error:', err);
      setError(err.message || 'Failed to load customer reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (review) => {
    try {
      setUpdatingId(review.id);
      const newStatus = !review.isApproved;
      await adminApi.moderateReview(review.id, {
        isApproved: newStatus,
        isFlagged: review.isFlagged,
      });

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isApproved: newStatus } : r))
      );

      setSuccessMsg(`Review marked as ${newStatus ? 'Approved (Visible)' : 'Hidden'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('[ToggleApproval] Error:', err);
      setError(err.message || 'Failed to update review approval status.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleFlag = async (review) => {
    try {
      setUpdatingId(review.id);
      const newFlagged = !review.isFlagged;
      await adminApi.moderateReview(review.id, {
        isApproved: review.isApproved,
        isFlagged: newFlagged,
      });

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, isFlagged: newFlagged } : r))
      );

      setSuccessMsg(`Review ${newFlagged ? 'flagged for inspection' : 'unflagged'}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('[ToggleFlag] Error:', err);
      setError(err.message || 'Failed to update review flag status.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!reviewToDelete) return;

    try {
      setIsDeleting(true);
      await adminApi.deleteReview(reviewToDelete.id);
      setReviews((prev) => prev.filter((r) => r.id !== reviewToDelete.id));
      setSuccessMsg('Review deleted and tour package rating recalculated.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setReviewToDelete(null);
    } catch (err) {
      console.error('[DeleteReview] Error:', err);
      setError(err.message || 'Failed to delete review.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics calculation
  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.isApproved).length;
  const hiddenCount = reviews.filter((r) => !r.isApproved).length;
  const flaggedCount = reviews.filter((r) => r.isFlagged).length;
  const avgRating =
    approvedCount > 0
      ? (
          reviews
            .filter((r) => r.isApproved)
            .reduce((sum, r) => sum + Number(r.rating || 0), 0) / approvedCount
        ).toFixed(1)
      : '0.0';

  // Filter and search
  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === 'approved' && !r.isApproved) return false;
    if (statusFilter === 'hidden' && r.isApproved) return false;
    if (statusFilter === 'flagged' && !r.isFlagged) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchPkg = (r.packageName || '').toLowerCase().includes(q);
      const matchCust = (r.customerName || '').toLowerCase().includes(q);
      const matchRef = (r.bookingReference || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      return matchPkg || matchCust || matchRef || matchComment;
    }
    return true;
  });

  const canModerate = role === 'admin' || role === 'support';
  const canDelete = role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Customer Reviews & Ratings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit, moderate, and publish traveler reviews. Complies with Rule D: Only travelers with completed bookings can review.
          </p>
        </div>

        <Button
          onClick={fetchReviews}
          variant="outline"
          disabled={loading}
          className="w-full shrink-0 sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total Reviews</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <MessageSquare className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">{totalReviews}</div>
          <span className="text-xs text-muted-foreground">All submitted feedback</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Approved (Live)</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">{approvedCount}</div>
          <span className="text-xs text-muted-foreground">Visible on public catalog</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Average Rating</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
            {avgRating} <span className="text-base font-normal text-muted-foreground">/ 5.0</span>
          </div>
          <span className="text-xs text-muted-foreground">Approved reviews average</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Hidden / Flagged</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600">
              <ShieldAlert className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
            {hiddenCount} / {flaggedCount}
          </div>
          <span className="text-xs text-muted-foreground">{hiddenCount} hidden, {flaggedCount} flagged</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-sand-head p-1">
          {[
            { key: 'all', label: `All (${totalReviews})` },
            { key: 'approved', label: `Approved (${approvedCount})` },
            { key: 'hidden', label: `Hidden (${hiddenCount})` },
            { key: 'flagged', label: `Flagged (${flaggedCount})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={tabClass(statusFilter === tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search package, customer, comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-medium text-foreground">No reviews found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? 'Try clearing your search query.' : 'No customer reviews submitted in this category.'}
            </p>
          </div>
        ) : (
          <Table className="min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead>Tour Package</TableHead>
                <TableHead>Customer & Booking</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="w-1/3">Feedback / Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Moderation Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.map((rev) => {
                const isUpdating = updatingId === rev.id;

                return (
                  <TableRow key={rev.id} className="align-top">
                    {/* Tour Package */}
                    <TableCell className="align-top">
                      <div className="font-medium text-foreground">{rev.packageName || 'Tour Package'}</div>
                      <span className="font-mono text-[11px] text-muted-foreground">ID: {rev.packageId?.slice(0, 8)}...</span>
                    </TableCell>

                    {/* Customer & Booking */}
                    <TableCell className="align-top">
                      <div className="font-medium text-slate-800">{rev.customerName || 'Verified Traveler'}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Ref: {rev.bookingReference || rev.bookingId?.slice(0, 8) || 'N/A'}
                      </div>
                      <div className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>

                    {/* Rating */}
                    <TableCell className="align-top">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium tabular-nums text-foreground">{rev.rating}</span>
                      </div>
                    </TableCell>

                    {/* Comment */}
                    <TableCell className="align-top text-slate-700">
                      {rev.comment ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{rev.comment}</p>
                      ) : (
                        <span className="text-xs text-muted-foreground">No written comment provided</span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="align-top">
                      <div className="flex flex-col items-start gap-1">
                        {rev.isApproved ? (
                          <Badge variant="success">Approved (Live)</Badge>
                        ) : (
                          <Badge variant="secondary">Hidden</Badge>
                        )}

                        {rev.isFlagged && (
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3 fill-red-600 text-red-600" /> Flagged
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Moderation Actions */}
                    <TableCell className="align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canModerate && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isUpdating}
                              onClick={() => handleToggleApproval(rev)}
                              title={rev.isApproved ? 'Hide Review' : 'Approve & Publish'}
                              className="h-8 px-2.5 text-xs"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : rev.isApproved ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                                  Hide
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5 text-emerald-600" />
                                  Approve
                                </>
                              )}
                            </Button>

                            <Button
                              size="icon"
                              variant="outline"
                              disabled={isUpdating}
                              onClick={() => handleToggleFlag(rev)}
                              title={rev.isFlagged ? 'Remove Flag' : 'Flag for Inspection'}
                              className={`h-8 w-8 ${
                                rev.isFlagged ? 'border-red-200 bg-red-50 hover:bg-red-100' : ''
                              }`}
                            >
                              <Flag className={`h-3.5 w-3.5 ${rev.isFlagged ? 'fill-red-600 text-red-600' : 'text-slate-400'}`} />
                            </Button>
                          </>
                        )}

                        {canDelete && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => setReviewToDelete(rev)}
                            className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            title="Delete Review Permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Delete Customer Review
            </DialogTitle>
            <DialogDescription className="pt-1">
              Are you sure you want to permanently delete this review for{' '}
              <strong className="font-medium text-foreground">{reviewToDelete?.packageName}</strong> submitted by{' '}
              <strong className="font-medium text-foreground">{reviewToDelete?.customerName}</strong>?
              <br />
              <br />
              This will remove the review document and automatically recalculate the tour package's average rating and total review count. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" /> Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
