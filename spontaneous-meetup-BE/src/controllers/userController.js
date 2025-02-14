import { Request, Response } from 'express';
import { updateUserFCMToken } from '../services/userService';

export const updateFCMToken = async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ 
        error: 'userId and fcmToken are required' 
      });
    }

    await updateUserFCMToken(userId, fcmToken);
    
    res.status(200).json({ 
      success: true 
    });
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({ 
      error: 'Failed to update FCM token' 
    });
  }
}; 