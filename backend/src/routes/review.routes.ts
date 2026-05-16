import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as reviewController from '../controllers/review.controller.js';

const router = Router();

router.get('/user/:userId', reviewController.getUserReviews);
router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', authenticate, reviewController.createReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

export default router;
