/// <reference lib="webworker" />

import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare const self: ServiceWorkerGlobalScope;

const firebaseApp = initializeApp({
  apiKey: "AIzaSyCfQ0wJiQLnHKUr9RTBuR2qnDvajy7yh4o",
  authDomain: "spontaneous-meetup-ea432.firebaseapp.com",
  projectId: "spontaneous-meetup-ea432",
  storageBucket: "spontaneous-meetup-ea432.firebasestorage.app",
  messagingSenderId: "927910491541",
  appId: "1:927910491541:web:5a458b2299e629b151f29c"
});

const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions: NotificationOptions = {
    body: payload.notification?.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {
      click_action: payload.data?.click_action || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

export {}; 