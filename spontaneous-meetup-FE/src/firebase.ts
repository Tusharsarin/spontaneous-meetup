import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
// import { NotificationService } from "./services/notificationService";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log("Environment variables:", {
  apiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
});

const app = initializeApp(firebaseConfig);
console.log("Firebase initialized:", !!app);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const messaging = getMessaging(app);

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    
    // Generate FCM token only if notifications are supported and not blocked
    if (result.user && 'Notification' in window && Notification.permission !== 'denied') {
      try {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const currentToken = await getToken(messaging, {
            vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
          });

          if (currentToken) {
            await setDoc(doc(db, 'users', result.user.uid), {
              fcmToken: currentToken,
              email: result.user.email,
              displayName: result.user.displayName,
              photoURL: result.user.photoURL,
              lastLogin: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      } catch (err) {
        // Don't throw error if notifications are blocked
        console.log('Notifications not available:', err);
      }
    }
    return result.user;
  } catch (error) {
    console.error("Error signing in", error);
  }
};

const logout = async () => {
  await signOut(auth);
};

export const requestNotificationPermission = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY"
    });
    return token;
  } catch (error) {
    console.error("Notification permission denied:", error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export { signInWithGoogle, logout, app };
