import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { NotificationService } from "./services/notificationService";

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
    // Request notification permission right after successful login
    if (result.user) {
      try {
        const token = await NotificationService.requestPermission();
        console.log('Notification permission granted and token stored:', token);
      } catch (err) {
        console.error('Error setting up notifications:', err);
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
