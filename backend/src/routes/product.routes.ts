import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import * as productController from '../controllers/product.controller.js';

const router = Router();

router.get('/', optionalAuth, productController.getProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/recommended', optionalAuth, productController.getRecommendedProducts);
router.get('/user/:userId', productController.getUserProducts);
router.get('/:id', optionalAuth, productController.getProduct);
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);
router.put('/:id/sold', authenticate, productController.markAsSold);
router.put('/:id/pause', authenticate, productController.pauseProduct);

export default router;
