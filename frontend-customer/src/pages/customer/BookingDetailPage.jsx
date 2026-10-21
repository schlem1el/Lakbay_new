import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsApi } from '../../api/bookingsApi';
import { reviewsApi } from '../../api/reviewsApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Calendar,
  Clock,
  ArrowLeft,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  MapPin,
  Loader2,
  ShieldAlert,
  Star,
  MessageSquare,
} from 'lucide-react';

export const BookingDetailPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState('');

  // Review Modal & Form State
  const [existingReview, setExistingReview] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const res = await bookingsApi.getById(id);
      setBooking(res.data);

      // Check if user has already submitted a review for this booking
      try {
        const reviewsRes = await reviewsApi.getMyReviews();
        const found = (reviewsRes.data || []).find((r) => r.bookingId === id);
        if (found) setExistingReview(found);
      } catch (revErr) {
        console.warn('Failed to fetch existing review:', revErr);
      }
    } catch (err) {
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewError('Please select a star rating between 1 and 5.');
      return;
    }

    try {
      setSubmittingReview(true);
      const payload = {
        packageId: booking.packageId,
        bookingId: booking.id,
        rating: reviewRating,
        comment: reviewComment,
      };

      const res = await reviewsApi.createReview(payload);
      setExistingReview(res.data);
      setReviewSuccess('Thank you! Your verified review has been published.');
      setTimeout(() => {
        setReviewModalOpen(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewError(err.response?.data?.message || err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-lg font-bold text-slate-800">Booking Record Not Found</h3>
        <Link to="/dashboard/bookings" className="inline-block mt-4">
          <Button variant="outline">Back to My Bookings</Button>
        </Link>
      </div>
    );
  }

  // Calculate days remaining until departure date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const depDate = new Date(booking.departureDate);
  depDate.setHours(0, 0, 0, 0);
  const diffTime = depDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const cutoffDays = booking.cancellationCutoffDays || 7;
  const isEligibleForAutoRefund = daysRemaining >= cutoffDays;

  const canCancel = ['Pending', 'Confirmed'].includes(booking.bookingStatus) && daysRemaining > 0;
  const isCompletedTour =
    booking.bookingStatus === 'Completed' ||
    (booking.bookingStatus === 'Confirmed' && daysRemaining <= 0);

  const handleConfirmCancel = async () => {
    setCancelling(true);
    setCancelFeedback('');
    try {
      const res = await bookingsApi.cancelBooking(id, cancelReason || 'Customer requested cancellation');
      setCancelFeedback(res.message || 'Cancellation request submitted.');
      await fetchBooking();
      setTimeout(() => {
        setCancelModalOpen(false);
      }, 2000);
    } catch (err) {
      console.error('Cancellation error:', err);
      setCancelFeedback(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/dashboard/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Link>

        <div className="flex items-center gap-2">
          <Badge
            className={`text-xs px-3 py-1 font-bold ${
              booking.bookingStatus === 'Confirmed'
                ? 'bg-emerald-100 text-emerald-800'
                : booking.bookingStatus === 'Pending'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            Booking {booking.bookingStatus}
          </Badge>
          <Badge
            className={`text-xs px-3 py-1 font-bold ${
              booking.paymentStatus === 'Paid'
                ? 'bg-emerald-50 text-emerald-700'
                : booking.paymentStatus === 'Refunded'
                ? 'bg-purple-50 text-purple-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Payment {booking.paymentStatus}
          </Badge>
        </div>
      </div>

      {/* Main Booking Summary Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Booking Reference
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-0.5">
              {booking.bookingReference}
            </h2>
            <h3 className="text-xl font-bold text-emerald-800 font-heading mt-1">
              {booking.packageName}
            </h3>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
              Total Amount
            </span>
            <span className="text-3xl font-black text-slate-900 font-heading">
              {formatCurrency(booking.totalPrice)}
            </span>
            <span className="text-xs text-slate-500 block mt-0.5">
              PHP ({formatCurrency(booking.pricePerPerson)} × {booking.numberOfTravelers} traveler(s))
            </span>
          </div>
        </div>

        {/* Departure Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-6 border-b border-slate-100 text-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Departure Date
            </span>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-600" />
              {formatDate(booking.departureDate)}
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Return Date
            </span>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-emerald-600" />
              {formatDate(booking.returnDate)}
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Travel Party
            </span>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-600" />
              {booking.numberOfTravelers} Person(s)
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Booked On
            </span>
            <p className="font-medium text-slate-600">
              {formatDate(booking.createdAt)}
            </p>
          </div>
        </div>

        {/* Traveler Manifest Section */}
        <div className="py-6 border-b border-slate-100">
          <h4 className="font-bold text-slate-900 text-base font-heading mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            Passenger Manifest Details
          </h4>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1">
              <div>
                <span className="font-bold text-slate-900">{booking.customerName}</span>
                <span className="text-slate-500 ml-2">(Lead Traveler / Contact)</span>
              </div>
              <div className="text-slate-600 mt-1 sm:mt-0 font-medium">
                {booking.customerEmail} • {booking.customerPhone}
              </div>
            </div>

            {booking.travelerManifest && booking.travelerManifest.length > 1 && (
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Companion Travelers
                </span>
                {booking.travelerManifest.slice(1).map((t, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-700">
                    <span className="font-semibold">{t.fullName}</span>
                    <span className="text-slate-500">{t.relationship || 'Companion'}</span>
                  </div>
                ))}
              </div>
            )}

            {booking.specialRequests && (
              <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Special Requests: </span>
                <span>{booking.specialRequests}</span>
              </div>
            )}
          </div>
        </div>

        {/* Verified Review Section for Completed Tours (Rule D) */}
        {isCompletedTour && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-base font-heading mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              Your Tour Rating & Review
            </h4>

            {existingReview ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= existingReview.rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="font-bold text-xs text-slate-800 ml-1">
                      {existingReview.rating} out of 5
                    </span>
                  </div>
                  <Badge variant="success" className="text-[10px] uppercase font-bold">
                    Verified Traveler Review
                  </Badge>
                </div>
                {existingReview.comment && (
                  <p className="text-xs text-slate-700 italic">"{existingReview.comment}"</p>
                )}
                <span className="text-[11px] text-slate-400 block pt-1">
                  Submitted on {formatDate(existingReview.createdAt)}
                </span>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900">How was your travel experience?</p>
                  <p className="text-xs text-slate-500">
                    Share your feedback to help fellow travelers explore {booking.packageName}.
                  </p>
                </div>
                <Button
                  onClick={() => setReviewModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <Star className="h-3.5 w-3.5 fill-white" />
                  Leave a Review
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons & Cancellation Section */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {daysRemaining > 0 ? (
              <p>
                Departure is in <span className="font-bold text-slate-900">{daysRemaining} day(s)</span>.
                Cutoff policy: <span className="font-semibold">{cutoffDays} days</span> before trip.
              </p>
            ) : (
              <p>This trip departure date has passed.</p>
            )}
          </div>

          {canCancel && (
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-semibold"
            >
              Cancel This Booking
            </Button>
          )}
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent onClose={() => setCancelModalOpen(false)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancel Booking ({booking.bookingReference})
            </DialogTitle>
            <DialogDescription>
              Please review the cancellation cutoff policy before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Auto-refund vs Review Alert */}
            {isEligibleForAutoRefund ? (
              <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Eligible for Automated Refund
                </p>
                <p>
                  Your departure is in <strong>{daysRemaining} days</strong>, which is on or before the <strong>{cutoffDays}-day</strong> cutoff. Cancelling now will immediately release your reserved seats and trigger an automated Stripe refund to your original payment method.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  Past Early-Cancellation Cutoff
                </p>
                <p>
                  Your departure is in <strong>{daysRemaining} day(s)</strong>, which is within the <strong>{cutoffDays}-day</strong> cutoff threshold. Your cancellation request will be submitted to our Support Agents for exception review.
                </p>
              </div>
            )}

            {cancelFeedback && (
              <div className="rounded-xl bg-slate-100 p-3 text-xs font-medium text-slate-800">
                {cancelFeedback}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Sudden scheduling conflict, medical reason, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelling}
              className="text-xs font-semibold"
            >
              Keep My Booking
            </Button>
            <Button
              onClick={handleConfirmCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Processing...
                </>
              ) : isEligibleForAutoRefund ? (
                'Confirm & Trigger Refund'
              ) : (
                'Submit for Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REVIEWS & RATINGS MODAL (Rule D Compliance) */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent onClose={() => setReviewModalOpen(false)}>
          <form onSubmit={handleReviewSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                Rate & Review {booking.packageName}
              </DialogTitle>
              <DialogDescription>
                Share your verified travel feedback with fellow adventurers.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {reviewSuccess && (
                <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{reviewSuccess}</span>
                </div>
              )}

              {reviewError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800 border border-red-200 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{reviewError}</span>
                </div>
              )}

              {/* Star Rating Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Your Overall Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                      className="p-1 rounded-md transition-transform hover:scale-110 focus:outline-hidden"
                    >
                      <Star
                        className={`h-7 w-7 transition-colors ${
                          star <= (reviewHover || reviewRating)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-bold text-slate-800 ml-2">
                    {reviewHover || reviewRating} / 5
                  </span>
                </div>
              </div>

              {/* Comment Textarea */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Your Experience & Travel Tips
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="How was the tour itinerary, local guide, and island spots? Any recommendations for future travelers?"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setReviewModalOpen(false)}
                disabled={submittingReview}
                className="text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingReview}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting Review...
                  </>
                ) : (
                  <>
                    <Star className="h-3.5 w-3.5 fill-white" />
                    Submit Verified Review
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
