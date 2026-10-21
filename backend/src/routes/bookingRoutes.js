import { Router } from 'express';
import {
  createCheckoutSession,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getAllBookings,
  supportUpdateBooking,
  processExceptionRefund,
} from '../controllers/bookingController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// All booking operations require authentication
router.use(verifyToken);

// Customer endpoints
router.post('/checkout', createCheckoutSession);
router.get('/my-bookings', getMyBookings);
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);

// Support, Admin, Coordinator & Operator management endpoints
router.get('/', requireRoles('support', 'admin', 'coordinator', 'operator'), getAllBookings);
router.patch('/:id', requireRoles('support', 'admin'), supportUpdateBooking);
router.post('/:id/exception-refund', requireRoles('support', 'admin'), processExceptionRefund);

export default router;
