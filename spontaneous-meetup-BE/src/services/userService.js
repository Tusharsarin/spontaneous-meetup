import admin from 'firebase-admin';

export const updateUserFCMToken = async (userId, fcmToken) => {
  try {
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .set({
        fcmToken,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
}; 