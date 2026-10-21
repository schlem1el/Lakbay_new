import { db } from '../config/firebaseAdmin.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logActivity } from '../services/auditService.js';

const COLLECTION = 'departures';

/**
 * Get departures with optional package, guide, date, and status filters
 */
export const getDepartures = async (req, res, next) => {
  try {
    const { packageId, status, from, to, guideId } = req.query;
    const isStaff = req.user && ['coordinator', 'support', 'guide', 'admin', 'operator'].includes(req.user.role);

    let query = db.collection(COLLECTION);

    if (packageId) {
      query = query.where('packageId', '==', packageId);
    }

    if (guideId) {
      query = query.where('assignedGuideId', '==', guideId);
    }

    if (status) {
      query = query.where('status', '==', status);
    } else if (!isStaff) {
      query = query.where('status', '==', 'open');
    }

    const snapshot = await query.get();
    let departures = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      remainingSlots: Math.max(0, (doc.data().capacity || 0) - (doc.data().bookedCount || 0)),
    }));

    // In-memory sort by departure date ascending
    departures.sort((a, b) => (a.departureDate || '').localeCompare(b.departureDate || ''));

    // Date filtering in memory
    const today = new Date().toISOString().split('T')[0];
    if (!isStaff) {
      departures = departures.filter((d) => d.departureDate >= today);
    }
    if (from) {
      departures = departures.filter((d) => d.departureDate >= from);
    }
    if (to) {
      departures = departures.filter((d) => d.departureDate <= to);
    }

    // Attach package title and assigned guide name if available
    const pkgMap = new Map();
    const pkgOperatorMap = new Map();
    const userMap = new Map();

    for (const dep of departures) {
      if (dep.packageId && !pkgMap.has(dep.packageId)) {
        const pDoc = await db.collection('tourPackages').doc(dep.packageId).get();
        pkgMap.set(dep.packageId, pDoc.exists ? pDoc.data().name : 'Unknown Package');
        pkgOperatorMap.set(dep.packageId, pDoc.exists ? pDoc.data().operatorId : null);
      }
      dep.packageName = pkgMap.get(dep.packageId);
      dep.operatorId = dep.operatorId || pkgOperatorMap.get(dep.packageId);

      if (dep.assignedGuideId && !userMap.has(dep.assignedGuideId)) {
        const uDoc = await db.collection('users').doc(dep.assignedGuideId).get();
        userMap.set(dep.assignedGuideId, uDoc.exists ? uDoc.data().fullName : 'Unassigned');
      }
      dep.assignedGuideName = dep.assignedGuideId ? userMap.get(dep.assignedGuideId) : 'Unassigned';
    }

    // Rule D: Operator sandboxing - operators only see departures for their own packages
    if (req.user?.role === 'operator') {
      departures = departures.filter((d) => d.operatorId === req.user.uid);
    }

    return sendSuccess(res, departures, `Retrieved ${departures.length} departure(s)`);
  } catch (error) {
    next(error);
  }
};

/**
 * Get departure by ID with manifest summary for staff
 */
export const getDepartureById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return sendError(res, 'Departure not found', 404);
    }

    const departure = {
      id: doc.id,
      ...doc.data(),
      remainingSlots: Math.max(0, (doc.data().capacity || 0) - (doc.data().bookedCount || 0)),
    };

    // Attach package details
    if (departure.packageId) {
      const pDoc = await db.collection('tourPackages').doc(departure.packageId).get();
      if (pDoc.exists) {
        departure.package = { id: pDoc.id, ...pDoc.data() };
      }
    }

    return sendSuccess(res, departure);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new departure schedule (Coordinator / Admin)
 */
export const createDeparture = async (req, res, next) => {
  try {
    const {
      packageId,
      departureDate,
      returnDate,
      capacity,
      assignedGuideId = null,
      status = 'open',
    } = req.body;

    if (!packageId || !departureDate || capacity === undefined) {
      return sendError(res, 'packageId, departureDate, and capacity are required', 400);
    }

    const numCapacity = Number(capacity);
    if (isNaN(numCapacity) || numCapacity <= 0) {
      return sendError(res, 'Capacity must be a positive number', 400);
    }

    // Verify package exists
    const pkgDoc = await db.collection('tourPackages').doc(packageId).get();
    if (!pkgDoc.exists) {
      return sendError(res, 'Tour package does not exist', 400);
    }

    const pkgData = pkgDoc.data();
    const isOperator = req.user?.role === 'operator';

    // Rule D: Operator Ownership Guard
    if (isOperator && pkgData.operatorId && pkgData.operatorId !== req.user.uid) {
      return sendError(res, "Forbidden: Operators cannot schedule departures for tours they do not own (Rule D).", 403);
    }

    // Calculate returnDate if not provided
    let calculatedReturnDate = returnDate;
    if (!calculatedReturnDate) {
      const durationDays = pkgData.durationDays || 1;
      const depDateObj = new Date(departureDate);
      depDateObj.setDate(depDateObj.getDate() + (durationDays - 1));
      calculatedReturnDate = depDateObj.toISOString().split('T')[0];
    }

    const now = new Date().toISOString();
    const departureData = {
      packageId,
      departureDate,
      returnDate: calculatedReturnDate,
      capacity: numCapacity,
      bookedCount: 0,
      assignedGuideId: assignedGuideId || null,
      operatorId: pkgData.operatorId || 'platform',
      status,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(departureData);
    const created = { id: docRef.id, ...departureData };

    await logActivity({
      actorUid: req.user.uid,
      actorRole: req.user.role,
      action: 'CREATE_DEPARTURE',
      targetType: 'departure',
      targetId: docRef.id,
      metadata: { packageId, departureDate, capacity: numCapacity },
    });

    return sendSuccess(res, created, 'Departure schedule created successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update departure schedule (Coordinator / Admin)
 * Safety guard: Cannot reduce capacity below already booked count
 */
export const updateDeparture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return sendError(res, 'Departure not found', 404);
    }

    const existing = doc.data();
    const isOperator = req.user.role === 'operator';

    // Rule D: Operator Ownership Guard
    if (isOperator && existing.operatorId && existing.operatorId !== req.user.uid) {
      return sendError(res, "Forbidden: Operators cannot modify departures for tours they do not own (Rule D).", 403);
    }

    const updates = { ...req.body };
    delete updates.id;
    delete updates.createdAt;
    delete updates.bookedCount; // bookedCount is managed only via transactions
    updates.updatedAt = new Date().toISOString();

    // Safety guard: Capacity cannot be set lower than already reserved seats
    if (updates.capacity !== undefined) {
      const newCapacity = Number(updates.capacity);
      if (isNaN(newCapacity) || newCapacity < existing.bookedCount) {
        return sendError(
          res,
          `Cannot reduce capacity to ${newCapacity}. There are already ${existing.bookedCount} confirmed/reserved seat(s).`,
          400
        );
      }
      updates.capacity = newCapacity;
    }

    await docRef.update(updates);
    const updated = await docRef.get();

    await logActivity({
      actorUid: req.user.uid,
      actorRole: req.user.role,
      action: 'UPDATE_DEPARTURE',
      targetType: 'departure',
      targetId: id,
      metadata: { updatedFields: Object.keys(updates) },
    });

    return sendSuccess(res, { id, ...updated.data() }, 'Departure schedule updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a departure schedule safely (Coordinator / Admin)
 */
export const cancelDeparture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Cancelled by coordinator' } = req.body;
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return sendError(res, 'Departure not found', 404);
    }

    const existing = doc.data();
    const isOperator = req.user.role === 'operator';

    // Rule D: Operator Ownership Guard
    if (isOperator && existing.operatorId && existing.operatorId !== req.user.uid) {
      return sendError(res, "Forbidden: Operators cannot cancel departures for tours they do not own (Rule D).", 403);
    }

    const now = new Date().toISOString();
    await docRef.update({
      status: 'cancelled',
      cancellationReason: reason,
      updatedAt: now,
    });

    // Notify any confirmed/pending bookings
    const bookingsSnap = await db
      .collection('bookings')
      .where('departureId', '==', id)
      .where('bookingStatus', 'in', ['Pending', 'Confirmed'])
      .get();

    const batch = db.batch();
    for (const bDoc of bookingsSnap.docs) {
      const booking = bDoc.data();
      // Add notification for affected customers
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: booking.customerId,
        title: 'Departure Cancelled',
        message: `Your upcoming tour scheduled for departure on ${doc.data().departureDate} has been cancelled by administration (${reason}). Our support team will process a full refund or assist with rescheduling.`,
        type: 'departure_cancelled',
        isRead: false,
        relatedBookingId: bDoc.id,
        createdAt: now,
      });
    }
    await batch.commit();

    await logActivity({
      actorUid: req.user.uid,
      actorRole: req.user.role,
      action: 'CANCEL_DEPARTURE',
      targetType: 'departure',
      targetId: id,
      metadata: { reason, affectedBookingsCount: bookingsSnap.size },
    });

    return sendSuccess(
      res,
      null,
      `Departure cancelled. ${bookingsSnap.size} booking(s) flagged and notified for refund/rescheduling.`
    );
  } catch (error) {
    next(error);
  }
};
