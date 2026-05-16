import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

router.post('/generate-description', authenticate, aiController.generateDescription);
router.post('/suggest-price', authenticate, aiController.suggestPrice);
router.post('/chat', aiController.chatWithAI);
router.get('/trending-suggestions', aiController.getTrendingSuggestions);

export default router;
