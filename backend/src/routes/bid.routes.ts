import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as bidController from '../controllers/bid.controller.js';

const router = Router();

router.get('/my', authenticate, bidController.getMyBids);
router.get('/product/:productId', bidController.getProductBids);
router.post('/', authenticate, bidController.placeBid);
router.put('/:id/accept', authenticate, bidController.acceptBid);
router.put('/:id/reject', authenticate, bidController.rejectBid);

export default router;
