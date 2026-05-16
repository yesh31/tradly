import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

router.get('/conversations', authenticate, chatController.getMyConversations);
router.get('/conversations/:id/messages', authenticate, chatController.getConversationMessages);
router.get('/unread', authenticate, chatController.getUnreadCount);
router.post('/conversations', authenticate, chatController.createOrGetConversation);
router.post('/conversations/:id/messages', authenticate, chatController.sendMessage);
router.put('/conversations/:id/read', authenticate, chatController.markAsRead);
router.post('/block/:userId', authenticate, chatController.blockUser);
router.post('/report', authenticate, chatController.reportUser);

export default router;
