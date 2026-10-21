import { db } from '../config/firebaseAdmin.js';
import { stripe, isStripeInitialized } from '../config/stripe.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../services/auditService.js';

const BOOKINGS_COLLECTION = 'bookings';
const DEPARTURES_COLLECTION = 'departures';
const PAYMENTS_COLLECTION = 'payments';
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Handle incoming Stripe Webhook events
 */
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // Verify Stripe webhook signature if configured
  if (isStripeInitialized && webhookSecret && !webhookSecret.includes('placeholder')) {
    try {
      if (!req.rawBody) {
        return sendError(res, 'Missing raw request body buffer for Stripe verification', 400);
      }
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return sendError(res, `Webhook Signature Error: ${err.message}`, 400);
    }
  } else {
    // Development fallback without signature verification
    event = req.body;
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);
  const now = new Date().toISOString();

  try {
    switch (event.type) {
      // 1. Payment successfully completed
      case 'checkout.session.completed': {
        const session = event.data.object;
        const bookingId = session.client_reference_id || session.metadata?.bookingId;

        if (!bookingId) {
          console.warn('[Stripe Webhook] checkout.session.completed missing bookingId');
          break;
        }

        const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(bookingId);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists) {
          console.error(`[Stripe Webhook] Booking ${bookingId} not found`);
          break;
        }

        const booking = bookingDoc.data();
        const paymentIntentId = typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id || '';

        const amountPaid = (session.amount_total || 0) / 100;

        // Atomically mark booking Confirmed and Paid
        await bookingRef.update({
          bookingStatus: 'Confirmed',
          paymentStatus: 'Paid',
          stripePaymentIntentId: paymentIntentId,
          stripeSessionId: session.id,
          paidAt: now,
          updatedAt: now,
        });

        // Create record in payments collection
        await db.collection(PAYMENTS_COLLECTION).add({
          bookingId,
          bookingReference: booking.bookingReference,
          customerId: booking.customerId,
          amount: amountPaid || booking.totalPrice,
          currency: (session.currency || 'php').toUpperCase(),
          paymentMethod: 'stripe',
          referenceNumber: paymentIntentId,
          stripeSessionId: session.id,
          stripeRefundId: null,
          paymentStatus: 'Paid',
          createdAt: now,
          refundedAt: null,
        });

        // Create customer notification
        await db.collection(NOTIFICATIONS_COLLECTION).add({
          userId: booking.customerId,
          title: 'Payment Confirmed! Your Tour is Booked',
          message: `We received your payment of PHP ${booking.totalPrice.toLocaleString()} for booking ${
            booking.bookingReference
          }. Your departure is confirmed for ${booking.departureDate}.`,
          type: 'booking_confirmed',
          isRead: false,
          relatedBookingId: bookingId,
          createdAt: now,
        });

        await logActivity({
          actorUid: booking.customerId,
          actorRole: 'customer',
          action: 'STRIPE_PAYMENT_CONFIRMED',
          targetType: 'booking',
          targetId: bookingId,
          metadata: { amount: amountPaid, paymentIntentId },
        });

        console.log(`[Stripe Webhook] Booking ${bookingId} confirmed & payment recorded.`);
        break;
      }

      // 2. Checkout session expired without payment: release reserved seats
      case 'checkout.session.expired': {
        const session = event.data.object;
        const bookingId = session.client_reference_id || session.metadata?.bookingId;

        if (!bookingId) break;

        const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(bookingId);
        const bookingDoc = await bookingRef.get();

        if (bookingDoc.exists) {
          const booking = bookingDoc.data();

          // Only release if still pending/unpaid
          if (booking.bookingStatus === 'Pending' && booking.paymentStatus === 'Unpaid') {
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
                cancellationReason: 'Checkout session expired without payment',
                updatedAt: now,
              });
            });

            console.log(`[Stripe Webhook] Released seats for expired checkout session ${session.id}`);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return res.status(500).json({ error: error.message });
  }
};
