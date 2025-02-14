import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, onSnapshot, collection } from "firebase/firestore";
import { app, auth, db } from '../firebase'; // Import from your existing firebase.ts

const API_URL = 'http://localhost:5000/api';

export const NotificationService = {
  getMessaging() {
    return getMessaging(app);
  },

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('ServiceWorker registration successful:', registration);
        return registration;
      } catch (err) {
        console.error('ServiceWorker registration failed:', err);
        return null;
      }
    }
    return null;
  },

  async requestPermission() {
    try {
      // First check if notifications are supported
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return;
      }

      // Check if permission is already granted
      if (Notification.permission === 'granted') {
        console.log('Notification permission already granted');
      } else {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Permission not granted for notifications');
          return;
        }
      }

      const messaging = this.getMessaging();
      const registration = await this.registerServiceWorker();
      
      if (!registration) {
        throw new Error('Service Worker registration failed');
      }

      const currentToken = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration
      });
      
      if (!currentToken) {
        console.log('No registration token available. Request permission to generate one.');
        return;
      }

      if (auth.currentUser) {
        await this.storeFCMToken(currentToken);
        console.log('Notification permission granted and token stored:', currentToken);
      }
      
      return currentToken;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  },

  async storeFCMToken(token: string) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId || !token) {
        console.log('No user ID or token available');
        return;
      }

      await setDoc(doc(db, 'users', userId), {
        fcmToken: token,
        updatedAt: new Date().toISOString(),
        userId: userId
      }, { merge: true });
      
      console.log('FCM token stored successfully for user:', userId);
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  },

  onMessageListener() {
    return new Promise((resolve) => {
      const messaging = this.getMessaging();
      onMessage(messaging, (payload) => {
        console.log('Received foreground message:', payload);
        resolve(payload);
      });
    });
  },

  async sendNotification(userId: string, title: string, body: string) {
    try {
      if (!userId) {
        console.error('No user ID provided for notification');
        return;
      }

      const response = await fetch(`${API_URL}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification: {
            title,
            body,
          },
        }),
      });

      const result = await response.json();
      console.log('Notification sent:', result);
      return result;
    } catch (error) {
      console.error("Error sending notification:", error);
      throw error;
    }
  },

  async sendBroadcastNotification(broadcastId: string, title: string, body: string) {
    try {
      const response = await fetch(`${API_URL}/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          broadcastId,
          notification: {
            title,
            body,
          },
        }),
      });
      return response.json();
    } catch (error) {
      console.error("Error sending broadcast notification:", error);
      throw error;
    }
  },

  async sendMultipleNotifications(userIds: string[], title: string, body: string) {
    try {
      const response = await fetch(`${API_URL}/notifications/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds,
          notification: {
            title,
            body,
          },
        }),
      });
      return response.json();
    } catch (error) {
      console.error("Error sending multiple notifications:", error);
      throw error;
    }
  },

  listenForNotifications(userId: string, callback: (notification: any) => void) {
    // Listen to user's notifications collection
    return onSnapshot(
      collection(db, 'users', userId, 'notifications'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = change.doc.data();
            callback(notification);
          }
        });
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );
  }
}; 