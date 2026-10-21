import { db } from '../config/firebaseAdmin.js';
import { stripe, isStripeInitialized, DEFAULT_CURRENCY } from '../config/stripe.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { generateBookingReference } from '../utils/bookingReference.js';
import { logActivity } from '../services/auditService.js';

const BOOKINGS_COLLECTION = 'bookings';
const DEPARTURES_COLLECTION = 'departures';
const PACKAGES_COLLECTION = 'tourPackages';
const PAYMENTS_COLLECTION = 'payments';
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * 1. Checkout Creation (POST /api/bookings/checkout)
 * Runs a Firestore transaction to check capacity, reserve seats, create Pending/Unpaid booking,
 * and initiates a Stripe Checkout session in Philippine Pesos (PHP).
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const {
      packageId,
      departureId,
      numberOfTravelers,
      travelerManifest = [],
      customerName,
      customerEmail,
      customerPhone,
      specialRequests = '',
    } = req.body;

    const customerId = req.user.uid;

    if (!packageId || !departureId || !numberOfTravelers) {
      return sendError(res, 'packageId, departureId, and numberOfTravelers are required', 400);
    }

    const travelerCount = Number(numberOfTravelers);
    if (isNaN(travelerCount) || travelerCount < 1) {
      return sendError(res, 'numberOfTravelers must be at least 1', 400);
    }

    // References
    const pkgRef = db.collection(PACKAGES_COLLECTION).doc(packageId);
    const depRef = db.collection(DEPARTURES_COLLECTION).doc(departureId);

    // Fetch package to verify publication and get authoritative pricePerPerson
    const pkgDoc = await pkgRef.get();
    if (!pkgDoc.exists) {
      return sendError(res, 'Tour package not found', 404);
    }
    const pkgData = pkgDoc.data();
    if (!pkgData.isPublished) {
      return sendError(res, 'This tour package is not currently available for booking', 400);
    }

    const pricePerPerson = Number(pkgData.pricePerPerson);
    const totalPrice = pricePerPerson * travelerCount;
    const bookingReference = generateBookingReference();
    const now = new Date().toISOString();

    let newBookingId = null;

    // Run Firestore transaction to atomically reserve seats and create booking
    await db.runTransaction(async (transaction) => {
      const depDoc = await transaction.get(depRef);
      if (!depDoc.exists) {
        throw new Error('Selected departure schedule not found');
      }

      const depData = depDoc.data();
      if (depData.status !== 'open') {
        throw new Error(`Departure schedule is not open for bookings (status: ${depData.status})`);
      }

      const today = new Date().toISOString().split('T')[0];
      if (depData.departureDate < today) {
        throw new Error('Cannot book a departure date in the past');
      }

      const currentBooked = depData.bookedCount || 0;
      const capacity = depData.capacity || 0;
      const remainingSlots = capacity - currentBooked;

      if (currentBooked + travelerCount > capacity) {
        throw new Error(
          `Insufficient seats remaining. Requested: ${travelerCount}, Available: ${Math.max(0, remainingSlots)}`
        );
      }

      // Reserve seats on departure
      transaction.update(depRef, {
        bookedCount: currentBooked + travelerCount,
        updatedAt: now,
      });

      // Create new booking record
      const newBookingRef = db.collection(BOOKINGS_COLLECTION).doc();
      newBookingId = newBookingRef.id;

      const bookingRecord = {
        bookingReference,
        customerId,
        packageId,
        departureId,
        packageName: pkgData.name,
        departureDate: depData.departureDate,
        returnDate: depData.returnDate,
        customerName: customerName || req.user.fullName || '',
        customerEmail: customerEmail || req.user.email || '',
        customerPhone: customerPhone || '',
        numberOfTravelers: travelerCount,
        travelerManifest: Array.isArray(travelerManifest) ? travelerManifest : [],
        pricePerPerson,
        totalPrice,
        bookingStatus: 'Pending',
        paymentStatus: 'Unpaid',
        specialRequests,
        cancellationCutoffDays: pkgData.cancellationCutoffDays || 7,
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(newBookingRef, bookingRecord);
    });

    // Create Stripe Checkout Session
    const clientBaseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    let checkoutUrl = '';
    let stripeSessionId = '';

    if (isStripeInitialized && stripe) {
      // Amount in smallest currency unit (centavos for PHP)
      const unitAmountInCentavos = Math.round(pricePerPerson * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        currency: DEFAULT_CURRENCY,
        line_items: [
          {
            price_data: {
              currency: DEFAULT_CURRENCY,
              product_data: {
                name: `${pkgData.name} - Tour Departure`,
                description: `Departure Date: ${pkgDoc.data().name} (${travelerCount} traveler(s)) | Ref: ${bookingReference}`,
                images: (pkgData.imageUrls || []).slice(0, 1),
              },
              unit_amount: unitAmountInCentavos,
            },
            quantity: travelerCount,
          },
        ],
        customer_email: customerEmail || req.user.email,
        client_reference_id: newBookingId,
        metadata: {
          bookingId: newBookingId,
          bookingReference,
          customerId,
          packageId,
          departureId,
        },
        success_url: `${clientBaseUrl}/dashboard/bookings?session_id={CHECKOUT_SESSION_ID}&ref=${bookingReference}&status=success`,
        cancel_url: `${clientBaseUrl}/packages/${packageId}?booking_ref=${bookingReference}&status=cancelled`,
      });

      checkoutUrl = session.url;
      stripeSessionId = session.id;

      // Update booking with stripeSessionId
      await db.collection(BOOKINGS_COLLECTION).doc(newBookingId).update({
        stripeSessionId,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Development mock fallback URL if Stripe secret key is not yet configured
      checkoutUrl = `${clientBaseUrl}/dashboard/bookings?mock_payment=pending&ref=${bookingReference}`;
    }

    await logActivity({
      actorUid: customerId,
      actorRole: 'customer',
      action: 'CREATE_BOOKING_CHECKOUT',
      targetType: 'booking',
      targetId: newBookingId,
      metadata: { bookingReference, totalPrice, travelerCount },
    });

    return sendSuccess(
      res,
      {
        bookingId: newBookingId,
        bookingReference,
        totalPrice,
        pricePerPerson,
        numberOfTravelers: travelerCount,
        checkoutUrl,
        stripeSessionId,
      },
      'Booking reserved and checkout session created',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Early-Cancellation Auto-Refund (POST /api/bookings/:id/cancel)
 * If cancelled >= cancellationCutoffDays before departureDate, triggers automated Stripe refund
 * and releases reserved seats. If past cutoff, flags for Support Agent exception review.
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by customer' } = req.body;
    const userId = req.user.uid;
    const isStaff = ['support', 'admin'].includes(req.user.role);

    const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return sendError(res, 'Booking not found', 404);
    }

    const booking = bookingDoc.data();

    // Verify ownership if not staff
    if (!isStaff && booking.customerId !== userId) {
      return sendError(res, 'Unauthorized: You can only cancel your own bookings', 403);
    }

    if (['Cancelled', 'Completed', 'Rejected'].includes(booking.bookingStatus)) {
      return sendError(res, `Cannot cancel a booking that is already ${booking.bookingStatus}`, 400);
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
    const now = new Date().toISOString();

    if (isEligibleForAutoRefund) {
      // QUALIFIES FOR IMMEDIATE AUTO-REFUND
      let refundResult = null;

      // If booking was Paid, process Stripe refund
      if (booking.paymentStatus === 'Paid') {
        // Find payment record
        const paymentSnap = await db
          .collection(PAYMENTS_COLLECTION)
          .where('bookingId', '==', id)
          .where('paymentStatus', '==', 'Paid')
          .limit(1)
          .get();

        if (!paymentSnap.empty && isStripeInitialized && stripe) {
          const paymentDoc = paymentSnap.docs[0];
          const paymentData = paymentDoc.data();

          if (paymentData.referenceNumber) {
            refundResult = await stripe.refunds.create({
              payment_intent: paymentData.referenceNumber,
              reason: 'requested_by_customer',
              metadata: {
                bookingId: id,
                bookingReference: booking.bookingReference,
              },
            });

            await paymentDoc.ref.update({
              paymentStatus: 'Refunded',
              stripeRefundId: refundResult.id,
              refundedAt: now,
            });
          }
        }
      }

      // Atomically decrement departure bookedCount and update booking to Cancelled
      const depRef = db.collection(DEPARTURES_COLLECTION).doc(booking.departureId);
      await db.runTransaction(async (t) => {
        const dDoc = await t.get(depRef);
        if (dDoc.exists) {
          const currentBooked = dDoc.data().bookedCount || 0;
          t.update(depRef, {
            bookedCount: Math.max(0, currentBooked - booking.numberOfTravelers),
            updatedAt: now,
          });
        }

        t.update(bookingRef, {
          bookingStatus: 'Cancelled',
          paymentStatus: booking.paymentStatus === 'Paid' ? 'Refunded' : 'Unpaid',
          cancellationReason: reason,
          cancelledAt: now,
          refundProcessed: Boolean(refundResult),
          updatedAt: now,
        });
      });

      // Send notification to customer
      await db.collection(NOTIFICATIONS_COLLECTION).add({
        userId: booking.customerId,
        title: 'Booking Cancelled & Refunded',
        message: `Your booking (${booking.bookingReference}) for departure on ${booking.departureDate} has been cancelled. ${
          booking.paymentStatus === 'Paid' ? 'Your refund has been initiated and will appear on your card in 5-10 business days.' : 'No payment was collected.'
        }`,
        type: 'booking_cancelled_refunded',
        isRead: false,
        relatedBookingId: id,
        createdAt: now,
      });

      await logActivity({
        actorUid: userId,
        actorRole: req.user.role,
        action: 'AUTO_CANCEL_AND_REFUND',
        targetType: 'booking',
        targetId: id,
        metadata: {
          daysRemaining,
          cutoffDays,
          refundId: refundResult?.id,
        },
      });

      return sendSuccess(
        res,
        {
          bookingId: id,
          bookingStatus: 'Cancelled',
          paymentStatus: booking.paymentStatus === 'Paid' ? 'Refunded' : 'Unpaid',
          refundInitiated: Boolean(refundResult),
          daysRemaining,
          cutoffDays,
        },
        'Booking cancelled successfully. Reserved seats released and refund initiated.'
      );
    } else {
      // PAST EARLY-CANCELLATION CUTOFF: Flag for Support Agent exception review
      await bookingRef.update({
        cancellationRequested: true,
        cancellationRequestReason: reason,
        cancellationRequestedAt: now,
        cancellationDaysRemaining: daysRemaining,
        cancellationCutoffDays: cutoffDays,
        updatedAt: now,
      });

      // Notify customer that request is under review
      await db.collection(NOTIFICATIONS_COLLECTION).add({
        userId: booking.customerId,
        title: 'Cancellation Request Submitted',
        message: `Your cancellation request for booking ${booking.bookingReference} is within the ${cutoffDays}-day cutoff window (${daysRemaining} days left). Our support team will review your exception request.`,
        type: 'cancellation_under_review',
        isRead: false,
        relatedBookingId: id,
        createdAt: now,
      });

      await logActivity({
        actorUid: userId,
        actorRole: req.user.role,
        action: 'REQUEST_EXCEPTION_CANCELLATION',
        targetType: 'booking',
        targetId: id,
        metadata: { daysRemaining, cutoffDays, reason },
      });

      return sendSuccess(
        res,
        {
          bookingId: id,
          cancellationRequested: true,
          daysRemaining,
          cutoffDays,
          status: 'pending_support_review',
        },
        `Notice: Your departure is in ${daysRemaining} day(s), which is past the ${cutoffDays}-day early cancellation cutoff. Your request has been routed to a Support Agent for exception review.`
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Get customer's personal bookings (/api/bookings/my-bookings)
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const customerId = req.user.uid;
    const { status } = req.query;

    let query = db.collection(BOOKINGS_COLLECTION).where('customerId', '==', customerId);

    if (status) {
      query = query.where('bookingStatus', '==', status);
    }

    const snapshot = await query.get();
    let bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return sendSuccess(res, bookings, `Retrieved ${bookings.length} booking(s)`);
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Get booking details by ID
 */
export const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(BOOKINGS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      return sendError(res, 'Booking not found', 404);
    }

    const booking = { id: doc.id, ...doc.data() };
    const isStaff = ['coordinator', 'support', 'guide', 'admin', 'operator'].includes(req.user.role);

    // Enforce authorization
    if (!isStaff && booking.customerId !== req.user.uid) {
      return sendError(res, 'Unauthorized access to booking', 403);
    }

    // Operator ownership guard: Operator can only view bookings on their own tours
    if (req.user.role === 'operator' && booking.packageId) {
      const pDoc = await db.collection(PACKAGES_COLLECTION).doc(booking.packageId).get();
      if (!pDoc.exists || pDoc.data().operatorId !== req.user.uid) {
        return sendError(res, "Unauthorized: Operators can only access bookings for their own tours.", 403);
      }
    }

    // Attach package itinerary details
    if (booking.packageId) {
      const pDoc = await db.collection(PACKAGES_COLLECTION).doc(booking.packageId).get();
      if (pDoc.exists) {
        booking.package = {
          id: pDoc.id,
          name: pDoc.data().name,
          itinerary: pDoc.data().itinerary,
          inclusions: pDoc.data().inclusions,
          exclusions: pDoc.data().exclusions,
          imageUrls: pDoc.data().imageUrls,
        };
      }
    }

    // Attach payment details if available
    const paySnap = await db.collection(PAYMENTS_COLLECTION).where('bookingId', '==', id).get();
    booking.payments = paySnap.docs.map((p) => ({ id: p.id, ...p.data() }));

    return sendSuccess(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Support / Admin: Search and list all bookings
 */
export const getAllBookings = async (req, res, next) => {
  try {
    const {
      search,
      bookingStatus,
      paymentStatus,
      packageId,
      departureDate,
      limit = 50,
    } = req.query;

    let query = db.collection(BOOKINGS_COLLECTION);

    if (bookingStatus) {
      query = query.where('bookingStatus', '==', bookingStatus);
    }
    if (paymentStatus) {
      query = query.where('paymentStatus', '==', paymentStatus);
    }
    if (packageId) {
      query = query.where('packageId', '==', packageId);
    }

    const snapshot = await query.get();
    let bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Rule D: Operator scoping - operators only see bookings for their own tours
    if (req.user?.role === 'operator') {
      const myPkgSnap = await db
        .collection(PACKAGES_COLLECTION)
        .where('operatorId', '==', req.user.uid)
        .get();
      const myPkgIds = new Set(myPkgSnap.docs.map((d) => d.id));
      bookings = bookings.filter((b) => myPkgIds.has(b.packageId));
    }

    bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (limit) {
      bookings = bookings.slice(0, Number(limit));
    }

    // In-memory text search
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.bookingReference?.toLowerCase().includes(term) ||
          b.customerName?.toLowerCase().includes(term) ||
          b.customerEmail?.toLowerCase().includes(term) ||
          b.packageName?.toLowerCase().includes(term)
      );
    }

    if (departureDate) {
      bookings = bookings.filter((b) => b.departureDate === departureDate);
    }

    return sendSuccess(res, bookings, `Retrieved ${bookings.length} booking(s)`);
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Support / Admin: Update booking status, internal notes, or reschedule
 */
export const supportUpdateBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      bookingStatus,
      paymentStatus,
      internalNotes,
      specialRequests,
      rescheduleDepartureId,
    } = req.body;

    const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return sendError(res, 'Booking not found', 404);
    }

    const currentBooking = bookingDoc.data();
    const now = new Date().toISOString();
    const updates = { updatedAt: now };

    if (bookingStatus) updates.bookingStatus = bookingStatus;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    if (specialRequests !== undefined) updates.specialRequests = specialRequests;

    if (internalNotes) {
      const existingNotes = currentBooking.internalNotes || [];
      updates.internalNotes = [
        ...existingNotes,
        {
          note: internalNotes,
          authorUid: req.user.uid,
          authorName: req.user.fullName,
          timestamp: now,
        },
      ];
    }

    // Handle departure rescheduling
    if (rescheduleDepartureId && rescheduleDepartureId !== currentBooking.departureId) {
      const oldDepRef = db.collection(DEPARTURES_COLLECTION).doc(currentBooking.departureId);
      const newDepRef = db.collection(DEPARTURES_COLLECTION).doc(rescheduleDepartureId);

      await db.runTransaction(async (t) => {
        const oldDoc = await t.get(oldDepRef);
        const newDoc = await t.get(newDepRef);

        if (!newDoc.exists) {
          throw new Error('Target departure schedule does not exist');
        }

        const newData = newDoc.data();
        if (newData.status !== 'open') {
          throw new Error(`Target departure is not open (status: ${newData.status})`);
        }

        const remainingInNew = (newData.capacity || 0) - (newData.bookedCount || 0);
        if (currentBooking.numberOfTravelers > remainingInNew) {
          throw new Error(`Insufficient capacity on target departure (${remainingInNew} slot(s) available)`);
        }

        // Adjust seat counts
        if (oldDoc.exists) {
          const oldBooked = oldDoc.data().bookedCount || 0;
          t.update(oldDepRef, {
            bookedCount: Math.max(0, oldBooked - currentBooking.numberOfTravelers),
            updatedAt: now,
          });
        }

        t.update(newDepRef, {
          bookedCount: (newData.bookedCount || 0) + currentBooking.numberOfTravelers,
          updatedAt: now,
        });

        updates.departureId = rescheduleDepartureId;
        updates.departureDate = newData.departureDate;
        updates.returnDate = newData.returnDate;
        updates.rescheduledAt = now;

        t.update(bookingRef, updates);
      });

      // Send rescheduling notification to customer
      await db.collection(NOTIFICATIONS_COLLECTION).add({
        userId: currentBooking.customerId,
        title: 'Booking Rescheduled',
        message: `Your booking (${currentBooking.bookingReference}) has been rescheduled to depart on ${updates.departureDate}.`,
        type: 'booking_rescheduled',
        isRead: false,
        relatedBookingId: id,
        createdAt: now,
      });
    } else {
      await bookingRef.update(updates);
    }

    await logActivity({
      actorUid: req.user.uid,
      actorRole: req.user.role,
      action: 'SUPPORT_UPDATE_BOOKING',
      targetType: 'booking',
      targetId: id,
      metadata: { updates },
    });

    const updated = await bookingRef.get();
    return sendSuccess(res, { id, ...updated.data() }, 'Booking updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Support / Admin: Process approved exception refund
 */
export const processExceptionRefund = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { exceptionReason = 'Approved exception refund by support' } = req.body;

    const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(id);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return sendError(res, 'Booking not found', 404);
    }

    const booking = bookingDoc.data();
    const now = new Date().toISOString();

    let refundResult = null;

    if (booking.paymentStatus === 'Paid' && isStripeInitialized && stripe) {
      const paySnap = await db
        .collection(PAYMENTS_COLLECTION)
        .where('bookingId', '==', id)
        .where('paymentStatus', '==', 'Paid')
        .limit(1)
        .get();

      if (!paySnap.empty) {
        const paymentDoc = paySnap.docs[0];
        const paymentData = paymentDoc.data();

        if (paymentData.referenceNumber) {
          refundResult = await stripe.refunds.create({
            payment_intent: paymentData.referenceNumber,
            reason: 'requested_by_customer',
            metadata: {
              bookingId: id,
              exceptionReason,
              approvedBy: req.user.uid,
            },
          });

          await paymentDoc.ref.update({
            paymentStatus: 'Refunded',
            stripeRefundId: refundResult.id,
            refundedAt: now,
          });
        }
      }
    }

    // Release seats
    const depRef = db.collection(DEPARTURES_COLLECTION).doc(booking.departureId);
    await db.runTransaction(async (t) => {
      const dDoc = await t.get(depRef);
      if (dDoc.exists) {
        const booked = dDoc.data().bookedCount || 0;
        t.update(depRef, {
          bookedCount: Math.max(0, booked - booking.numberOfTravelers),
          updatedAt: now,
        });
      }

      t.update(bookingRef, {
        bookingStatus: 'Cancelled',
        paymentStatus: 'Refunded',
        cancellationReason: exceptionReason,
        exceptionApprovedBy: req.user.uid,
        cancelledAt: now,
        updatedAt: now,
      });
    });

    // Notify customer
    await db.collection(NOTIFICATIONS_COLLECTION).add({
      userId: booking.customerId,
      title: 'Exception Refund Approved',
      message: `Your exception refund request for booking ${booking.bookingReference} has been approved and processed.`,
      type: 'refund_approved',
      isRead: false,
      relatedBookingId: id,
      createdAt: now,
    });

    await logActivity({
      actorUid: req.user.uid,
      actorRole: req.user.role,
      action: 'APPROVE_EXCEPTION_REFUND',
      targetType: 'booking',
      targetId: id,
      metadata: { exceptionReason, refundId: refundResult?.id },
    });

    return sendSuccess(
      res,
      { bookingId: id, status: 'Cancelled', paymentStatus: 'Refunded', refundResult },
      'Exception refund successfully processed.'
    );
  } catch (error) {
    next(error);
  }
};
