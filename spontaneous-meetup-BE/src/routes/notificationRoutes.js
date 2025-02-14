import express from 'express';
import { 
  sendNotification, 
  sendBroadcastNotification,
  sendMultipleNotifications 
} from '../controllers/notificationController.js';

const router = express.Router();

router.post('/send', sendNotification);
router.post('/broadcast', sendBroadcastNotification);
router.post('/multiple', sendMultipleNotifications);

export default router; 