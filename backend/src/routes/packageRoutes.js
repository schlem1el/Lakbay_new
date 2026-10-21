import { Router } from 'express';
import {
  getPackages,
  getFeaturedPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  approvePackage,
  rejectPackage,
} from '../controllers/packageController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { requireRoles } from '../middlewares/roleMiddleware.js';

const router = Router();

// Public routes
router.get('/', getPackages);
router.get('/featured', getFeaturedPackages);
router.get('/:id', getPackageById);

// Protected routes (Coordinator, Admin, & Operator)
router.post('/', verifyToken, requireRoles('coordinator', 'admin', 'operator'), createPackage);
router.put('/:id', verifyToken, requireRoles('coordinator', 'admin', 'operator'), updatePackage);
router.patch('/:id', verifyToken, requireRoles('coordinator', 'admin', 'operator'), updatePackage);
router.delete('/:id', verifyToken, requireRoles('coordinator', 'admin', 'operator'), deletePackage);

// Tour Approval & Publishing (Admin & Coordinator only)
router.patch('/:id/approve', verifyToken, requireRoles('coordinator', 'admin'), approvePackage);
router.patch('/:id/reject', verifyToken, requireRoles('coordinator', 'admin'), rejectPackage);

export default router;
