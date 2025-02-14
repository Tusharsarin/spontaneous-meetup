import admin from 'firebase-admin';

export const sendNotification = async (req, res) => {
  try {
    const { userId, notification } = req.body;

    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      console.log(`No FCM token found for user ${userId}`);
      return res.status(404).json({ 
        error: 'FCM token not found for user',
        userId 
      });
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      token: fcmToken,
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    
    res.status(200).json({ 
      success: true, 
      messageId: response 
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      error: 'Failed to send notification',
      details: error.message 
    });
  }
};

export const sendBroadcastNotification = async (req, res) => {
  try {
    const { broadcastId, notification } = req.body;

    const broadcastDoc = await admin.firestore()
      .collection('broadcasts')
      .doc(broadcastId)
      .get();

    const broadcast = broadcastDoc.data();
    if (!broadcast) {
      return res.status(404).json({ error: 'Broadcast not found' });
    }

    const participants = broadcast.participants || [];
    const userIds = [broadcast.createdBy, ...participants.map(p => p.userId)];
    const uniqueUserIds = [...new Set(userIds)];

    const userDocs = await Promise.all(
      uniqueUserIds.map(userId => 
        admin.firestore().collection('users').doc(userId).get()
      )
    );

    const tokens = userDocs
      .map(doc => doc.data()?.fcmToken)
      .filter(token => token);

    if (tokens.length === 0) {
      return res.status(404).json({ error: 'No FCM tokens found' });
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Broadcast notification sent:', response);

    res.status(200).json({
      success: true,
      results: response.responses
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ 
      error: 'Failed to send broadcast notification',
      details: error.message 
    });
  }
};

export const sendMultipleNotifications = async (req, res) => {
  try {
    const { userIds, notification } = req.body;

    const userDocs = await Promise.all(
      userIds.map(userId => 
        admin.firestore().collection('users').doc(userId).get()
      )
    );

    const tokens = userDocs
      .map(doc => doc.data()?.fcmToken)
      .filter(token => token);

    if (tokens.length === 0) {
      return res.status(404).json({ error: 'No FCM tokens found' });
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log('Multiple notifications sent:', response);

    res.status(200).json({
      success: true,
      results: response.responses
    });
  } catch (error) {
    console.error('Error sending multiple notifications:', error);
    res.status(500).json({ 
      error: 'Failed to send multiple notifications',
      details: error.message 
    });
  }
};