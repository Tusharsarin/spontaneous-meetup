import { useEffect, createContext, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { NotificationService } from '../services/notificationService';

const NotificationContext = createContext<{
  sendNotification: (userId: string, title: string, body: string) => Promise<void>;
}>({
  sendNotification: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (user) {
        try {
          await NotificationService.registerServiceWorker();
          await NotificationService.requestPermission();
        } catch (error) {
          console.error('Error initializing notifications:', error);
        }
      }
    };

    if (!loading) {
      initializeNotifications();
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