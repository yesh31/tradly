import { Router } from 'express';
import { authenticate, requireAdmin, requireModOrAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id/ban', adminController.banUser);
router.put('/users/:id/unban', adminController.unbanUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.get('/products', adminController.getProducts);
router.put('/products/:id/status', adminController.updateProductStatus);
router.delete('/products/:id', adminController.deleteProduct);
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.handleReport);
router.get('/analytics', adminController.getAnalytics);

export default router;
