import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { packagesApi } from '../../api/packagesApi';
import { bookingsApi } from '../../api/bookingsApi';
import { customerApi } from '../../api/customerApi';
import { reviewsApi } from '../../api/reviewsApi';
import { useAuth } from '../../contexts/AuthContext';
import { ItineraryMap } from '../../components/common/ItineraryMap';
import { WeatherCalendar } from '../../components/common/WeatherCalendar';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  MapPin,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Bus,
  Hotel,
  Calendar,
  Users,
  CreditCard,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Compass,
  Sparkles,
  Star,
} from 'lucide-react';

export const PackageDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [pkg, setPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews & Rating State
  const [reviewsData, setReviewsData] = useState({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
  });
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Booking Form State
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [numberOfTravelers, setNumberOfTravelers] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Saved Co-Travelers
  const [savedCoTravelers, setSavedCoTravelers] = useState([]);
  const [selectedCoTravelerIds, setSelectedCoTravelerIds] = useState([]);

  // Submission state
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    const fetchPackageData = async () => {
      setLoading(true);
      try {
        const res = await packagesApi.getById(id);
        const data = res.data;
        setPackage(data);

        // Pre-select first open departure if available
        if (data.departures && data.departures.length > 0) {
          const firstOpen = data.departures.find((d) => d.status === 'open' && d.remainingSlots > 0);
          if (firstOpen) {
            setSelectedDeparture(firstOpen);
          }
        }
      } catch (err) {
        console.error('Failed to load package details:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const res = await reviewsApi.getPackageReviews(id);
        if (res.data) {
          setReviewsData(res.data);
        }
      } catch (err) {
        console.warn('Failed to load package reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchPackageData();
    fetchReviews();
  }, [id]);

  // Pre-fill user contact info & fetch saved co-travelers when user is authenticated
  useEffect(() => {
    if (user) {
      setCustomerName(profile?.fullName || user.displayName || '');
      setCustomerEmail(user.email || '');
      setCustomerPhone(profile?.phone || '');

      customerApi
        .getCoTravelers()
        .then((res) => {
          setSavedCoTravelers(res.data || []);
        })
        .catch((err) => console.warn('Co-travelers fetch error:', err));
    }
  }, [user, profile]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Tour Package Not Found</h2>
        <Link to="/packages" className="mt-4 inline-block">
          <Button variant="outline">Back to Packages</Button>
        </Link>
      </div>
    );
  }

  const images = pkg.imageUrls?.length > 0
    ? pkg.imageUrls
    : ['https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80'];

  const totalPrice = (pkg.pricePerPerson || 0) * numberOfTravelers;

  const handleToggleCoTraveler = (ct) => {
    if (selectedCoTravelerIds.includes(ct.id)) {
      setSelectedCoTravelerIds(selectedCoTravelerIds.filter((cid) => cid !== ct.id));
    } else {
      setSelectedCoTravelerIds([...selectedCoTravelerIds, ct.id]);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (!selectedDeparture) {
      setBookingError('Please select a departure schedule from the calendar or list.');
      return;
    }

    if (numberOfTravelers > selectedDeparture.remainingSlots) {
      setBookingError(
        `Selected departure only has ${selectedDeparture.remainingSlots} slot(s) remaining.`
      );
      return;
    }

    // Assemble traveler manifest
    const travelerManifest = [
      {
        fullName: customerName,
        relationship: 'Lead Traveler',
        contactPhone: customerPhone,
      },
    ];

    // Add selected co-travelers
    selectedCoTravelerIds.forEach((ctId) => {
      const ct = savedCoTravelers.find((c) => c.id === ctId);
      if (ct && travelerManifest.length < numberOfTravelers) {
        travelerManifest.push({
          fullName: ct.fullName,
          birthDate: ct.birthDate,
          relationship: ct.relationship,
          dietaryOrMedicalNotes: ct.dietaryOrMedicalNotes,
        });
      }
    });

    setSubmittingBooking(true);

    try {
      const bookingPayload = {
        packageId: pkg.id,
        departureId: selectedDeparture.id,
        numberOfTravelers,
        customerName,
        customerEmail,
        customerPhone,
        specialRequests,
        travelerManifest,
      };

      const res = await bookingsApi.createCheckout(bookingPayload);
      const { checkoutUrl, bookingReference } = res.data;

      if (checkoutUrl) {
        // Redirect directly to Stripe Checkout
        window.location.href = checkoutUrl;
      } else {
        navigate(`/dashboard/bookings?ref=${bookingReference}&status=reserved`);
      }
    } catch (err) {
      console.error('Booking checkout submission failed:', err);
      setBookingError(err.message || 'Failed to initialize Stripe checkout. Please try again.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Navigation Breadcrumb */}
        <Link
          to="/packages"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tour Packages
        </Link>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <Badge className="bg-emerald-600 text-white font-bold text-xs">
                {pkg.category}
              </Badge>
              <Badge variant="outline" className="text-slate-600 bg-white font-semibold text-xs">
                <Clock className="h-3 w-3 mr-1 text-emerald-600 inline" />
                {pkg.durationDays} Days / {pkg.durationNights} Nights
              </Badge>
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-800">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>{reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : (pkg.averageRating ? pkg.averageRating.toFixed(1) : 'New')}</span>
                <span className="text-slate-400 font-normal">
                  ({reviewsData.totalReviews || pkg.reviewCount || 0})
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Early-Cancellation Cutoff: {pkg.cancellationCutoffDays || 7} Days
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-heading">
              {pkg.name}
            </h1>

            <p className="mt-2 text-sm text-slate-600 flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-emerald-600" />
              {pkg.destination?.name || 'Philippines'}, {pkg.destination?.region}
            </p>
          </div>

          <div className="flex items-baseline gap-2 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Price</span>
            <span className="text-3xl font-black text-slate-900 font-heading">
              {formatCurrency(pkg.pricePerPerson)}
            </span>
            <span className="text-xs text-slate-400">/ person (PHP)</span>
          </div>
        </div>

        {/* Hero Image Showcase */}
        <div className="mb-12">
          <div className="relative h-96 sm:h-[460px] w-full overflow-hidden rounded-2xl shadow-lg border border-slate-200">
            <img
              src={images[activeImageIndex]}
              alt={pkg.name}
              className="h-full w-full object-cover transition-all duration-500"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    activeImageIndex === i ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Package Information (8 Cols) */}
          <div className="lg:col-span-7 space-y-10">
            {/* Overview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 font-heading mb-4">
                Tour Overview
              </h2>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                {pkg.description}
              </p>

              {/* Inclusions & Exclusions */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Inclusions
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {(pkg.inclusions || []).map((inc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3 flex items-center gap-1.5 text-red-800">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Exclusions
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700">
                    {(pkg.exclusions || []).map((exc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{exc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Lodging & Transportation */}
              <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pkg.accommodationDetails && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <Hotel className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">Accommodation</h5>
                      <p className="text-xs text-slate-800 mt-0.5">{pkg.accommodationDetails}</p>
                    </div>
                  </div>
                )}
                {pkg.transportDetails && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <Bus className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">Transportation</h5>
                      <p className="text-xs text-slate-800 mt-0.5">{pkg.transportDetails}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DAY-BY-DAY ACTIVITY ITINERARY & LEAFLET MAP */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-1">
                    Activity Route
                  </Badge>
                  <h2 className="text-2xl font-bold text-slate-900 font-heading">
                    Day-by-Day Activity Itinerary
                  </h2>
                </div>
              </div>

              {/* Interactive Route Map */}
              <div className="mb-8">
                <ItineraryMap itinerary={pkg.itinerary} height="400px" />
                <p className="text-xs text-slate-400 mt-2 text-center">
                  *Click any numbered marker on the map to preview activity details.
                </p>
              </div>

              {/* Day Breakdown List */}
              <div className="space-y-6">
                {(pkg.itinerary || []).map((day) => (
                  <div key={day.dayNumber} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                        D{day.dayNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base font-heading">
                        {day.dayTitle}
                      </h3>
                    </div>

                    <div className="space-y-3 pl-11">
                      {(day.activities || []).map((act, aIdx) => (
                        <div key={aIdx} className="border-l-2 border-emerald-400 pl-3.5 py-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                              {act.timeSlot}
                            </span>
                            <h4 className="font-bold text-slate-800 text-sm">{act.activityName}</h4>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {act.locationName}
                          </p>
                          {act.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* INTERACTIVE WEATHER DEPARTURE CALENDAR */}
            <div>
              <div className="mb-4">
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-1">
                  Availability & Forecast
                </Badge>
                <h2 className="text-2xl font-bold text-slate-900 font-heading">
                  Departure & Weather Calendar
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your departure date directly from the interactive calendar. Open departures show remaining seats and destination weather forecasts.
                </p>
              </div>

              <WeatherCalendar
                departures={pkg.departures || []}
                destinationCoordinates={pkg.destination?.coordinates}
                selectedDepartureId={selectedDeparture?.id}
                onSelectDeparture={(dep) => setSelectedDeparture(dep)}
              />
            </div>

            {/* CUSTOMER REVIEWS & RATINGS */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                <div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-1">
                    Verified Feedback
                  </Badge>
                  <h2 className="text-2xl font-bold text-slate-900 font-heading">
                    Customer Reviews & Ratings
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Only verified travelers who completed this tour can submit reviews.
                  </p>
                </div>

                {reviewsData.totalReviews > 0 && (
                  <div className="flex items-center gap-3 bg-amber-50/70 border border-amber-200/60 px-4 py-2.5 rounded-xl shrink-0">
                    <div className="text-center">
                      <div className="text-2xl font-black text-amber-700 font-heading leading-tight">
                        {reviewsData.averageRating?.toFixed(1) || '0.0'}
                      </div>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= Math.round(reviewsData.averageRating || 0)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 border-l border-amber-200 pl-3">
                      <span className="font-bold text-slate-800 block">
                        {reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'Review' : 'Reviews'}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">100% Verified</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Star Distribution Breakdown */}
              {reviewsData.totalReviews > 0 && (
                <div className="mb-6 p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewsData.distribution?.[star] || 0;
                    const pct = reviewsData.totalReviews > 0 ? (count / reviewsData.totalReviews) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-medium text-slate-600 flex items-center gap-1">
                          {star} <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />
                        </span>
                        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-right font-medium text-slate-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Review List */}
              {loadingReviews ? (
                <div className="flex py-10 justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : reviewsData.reviews?.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Star className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No customer reviews yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Be the first verified traveler to review this tour after completing your departure!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsData.reviews.map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                            {rev.customerName?.charAt(0)?.toUpperCase() || 'T'}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {rev.customerName || 'Verified Traveler'}
                            </span>
                            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="h-3 w-3" /> Verified Traveler
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center gap-0.5 justify-end">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3 w-3 ${
                                  s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {formatDate(rev.createdAt)}
                          </span>
                        </div>
                      </div>

                      {rev.comment && (
                        <p className="text-xs text-slate-700 leading-relaxed mt-2 pl-10">
                          "{rev.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sticky Booking Form Drawer (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  Book This Tour
                </span>
                <h3 className="text-2xl font-black text-slate-900 font-heading mt-1">
                  Secure Your Departure
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Instant seat locking with Stripe Checkout in Philippine Pesos (PHP).
                </p>
              </div>

              {bookingError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {/* 1. Selected Departure Indicator */}
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                    Departure Schedule
                  </Label>
                  {selectedDeparture ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {formatDate(selectedDeparture.departureDate)} to {formatDate(selectedDeparture.returnDate)}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-semibold">
                          {selectedDeparture.remainingSlots} slot(s) available
                        </p>
                      </div>
                      <Badge className="bg-emerald-600 text-white text-[10px]">Selected</Badge>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      Please pick an open departure date on the calendar above.
                    </div>
                  )}
                </div>

                {/* 2. Number of Travelers */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Number of Travelers
                    </Label>
                    <span className="text-xs text-slate-500 font-medium">
                      Max: {selectedDeparture?.remainingSlots || 10}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setNumberOfTravelers(Math.max(1, numberOfTravelers - 1))}
                      className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-black text-lg text-slate-900">
                      {numberOfTravelers}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNumberOfTravelers(
                          Math.min(selectedDeparture?.remainingSlots || 10, numberOfTravelers + 1)
                        )
                      }
                      className="h-10 w-10 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Saved Co-Travelers Quick Selector (If user logged in and has saved companions) */}
                {user && savedCoTravelers.length > 0 && numberOfTravelers > 1 && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
                      Saved Co-Travelers ({selectedCoTravelerIds.length}/{numberOfTravelers - 1})
                    </Label>
                    <div className="space-y-1.5">
                      {savedCoTravelers.map((ct) => (
                        <label
                          key={ct.id}
                          className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCoTravelerIds.includes(ct.id)}
                            onChange={() => handleToggleCoTraveler(ct)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                          />
                          <span className="font-semibold">{ct.fullName}</span>
                          <span className="text-slate-400">({ct.relationship})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Contact Details */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Lead Traveler Full Name</Label>
                    <Input
                      type="text"
                      required
                      placeholder="Juan Dela Cruz"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-xs font-semibold text-slate-600">Email Address</Label>
                      <Input
                        type="email"
                        required
                        placeholder="juan@email.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-600">Phone Number</Label>
                      <Input
                        type="tel"
                        required
                        placeholder="+63 917 123 4567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-slate-600">Special Requests / Dietary</Label>
                    <textarea
                      rows={2}
                      placeholder="Vegetarian meal, airport pick-up notes, etc."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <Separator />

                {/* 5. Pricing Breakdown */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {formatCurrency(pkg.pricePerPerson)} × {numberOfTravelers} traveler(s)
                    </span>
                    <span className="font-bold text-slate-900">{formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Environmental & Permit Fees</span>
                    <span className="text-emerald-700 font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100 text-sm">
                    <span className="font-bold text-slate-900">Total Price (PHP)</span>
                    <span className="text-2xl font-black text-slate-900 font-heading">
                      {formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* 6. Checkout CTA */}
                <Button
                  type="submit"
                  disabled={submittingBooking || !selectedDeparture}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingBooking ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      {user ? 'Pay & Book via Stripe' : 'Log in to Complete Booking'}
                    </>
                  )}
                </Button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5 text-emerald-600" />
                    Stripe 256-bit Encryption
                  </span>
                  <span>•</span>
                  <span>Free cancellation until {pkg.cancellationCutoffDays || 7} days prior</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
