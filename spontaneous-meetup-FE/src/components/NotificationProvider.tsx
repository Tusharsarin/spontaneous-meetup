import { useEffect, createContext, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { NotificationService } from '../services/notificationService';
import { getMessaging, onMessage, getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const NotificationContext = createContext<{
  sendNotification: (userId: string, title: string, body: string) => Promise<void>;
}>({
  sendNotification: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    const setupNotifications = async () => {
      if (user) {
        try {
          // First check if notifications are supported and get permission
          if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return;
          }

          // Request permission if not already granted
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              console.log('Notification permission not granted');
              return;
            }
          }

          // Only proceed if permission is granted
          if (Notification.permission === 'granted') {
            const messaging = getMessaging();
            const currentToken = await getToken(messaging, {
              vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
            });
            
            if (currentToken) {
              await setDoc(doc(db, 'users', user.uid), {
                fcmToken: currentToken,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }

            onMessage(messaging, (payload) => {
              console.log('Received foreground message:', payload);
              new Notification(payload.notification?.title || '', {
                body: payload.notification?.body,
                icon: '/logo192.png'
              });
            });
          }
        } catch (error) {
          console.error('Error setting up notifications:', error);
        }
      }
    };

    if (!loading) {
      setupNotifications();
    }
  }, [user, loading]);

  const sendNotification = async (userId: string, title: string, body: string) => {
    if (!user) return;
    await NotificationService.sendNotification(userId, title, body);
  };

  return (
    <NotificationContext.Provider value={{ sendNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}; 