import admin from 'firebase-admin';

export const sendNotification = async (req, res) => {
  try {
    const { userId, notification } = req.body;

    // Store notification in Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        ...notification,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });

    // Send FCM notification
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();

    const fcmToken = userDoc.data()?.fcmToken;

    if (fcmToken) {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log('Notification sent successfully:', response);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
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

    // Send notifications one by one
    const results = await Promise.all(
      tokens.map(token => 
        admin.messaging().send({
          notification: {
            title: notification.title,
            body: notification.body,
          },
          token: token
        })
      )
    );

    console.log('Broadcast notifications sent:', results);

    res.status(200).json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: error.message });
  }
};

export const sendMultipleNotifications = async (req, res) => {
  try {
    const { userIds, notification } = req.body;
    console.log('Sending notifications to users:', userIds);

    // Get user documents from Firestore
    const userDocs = await Promise.all(
      userIds.map(userId => 
        admin.firestore().collection('users').doc(userId).get()
      )
    );

    // Extract FCM tokens
    const tokens = userDocs
      .map(doc => {
        const userData = doc.data();
        console.log('User data:', userData);
        return userData?.fcmToken;
      })
      .filter(token => token);

    console.log('Found FCM tokens:', tokens);

    if (tokens.length === 0) {
      console.log('No FCM tokens found for users:', userIds);
      return res.status(404).json({ 
        error: 'No FCM tokens found',
        userIds: userIds 
      });
    }

    // Send notifications one by one instead of using sendMulticast
    const results = await Promise.all(
      tokens.map(token => 
        admin.messaging().send({
          notification: {
            title: notification.title,
            body: notification.body,
          },
          token: token
        })
      )
    );

    console.log('Sent notifications:', results);

    res.status(200).json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error sending multiple notifications:', error);
    res.status(500).json({ error: error.message });
  }
};