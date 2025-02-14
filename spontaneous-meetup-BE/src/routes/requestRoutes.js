import express from 'express';
import { db } from '../../firebase-config.js';

const router = express.Router();

// Create a join request
router.post('/', async (req, res) => {
  try {
    const { userId, userName, broadcastId } = req.body;

    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcast = await broadcastRef.get();

    if (!broadcast.exists) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    await broadcastRef.update({
      joinRequests: [...(broadcast.data().joinRequests || []), {
        userId,
        userName,
        status: 'pending',
        createdAt: new Date().toISOString()
      }]
    });

    res.status(201).json({ message: 'Join request created successfully' });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update request status (approve/reject)
router.put('/:broadcastId/:userId', async (req, res) => {
  try {
    const { broadcastId, userId } = req.params;
    const { status } = req.body;

    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcast = await broadcastRef.get();

    if (!broadcast.exists) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    const data = broadcast.data();
    const request = data.joinRequests?.find(r => r.userId === userId);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update request status
    const updatedRequests = data.joinRequests.map(r => 
      r.userId === userId ? { ...r, status } : r
    );

    await broadcastRef.update({ joinRequests: updatedRequests });

    // If approved, add to participants
    if (status === 'approved') {
      await broadcastRef.update({
        participants: [...(data.participants || []), {
          userId: request.userId,
          userName: request.userName,
          joinedAt: new Date().toISOString()
        }]
      });
    }

    res.status(200).json({ message: `Request ${status} successfully` });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get requests for a broadcast
router.get('/:broadcastId', async (req, res) => {
  try {
    const { broadcastId } = req.params;
    
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcast = await broadcastRef.get();

    if (!broadcast.exists) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    const data = broadcast.data();
    const requests = data.joinRequests || [];

    res.status(200).json(requests);
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;