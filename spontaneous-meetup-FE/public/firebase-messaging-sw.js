importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCfQ0wJiQLnHKUr9RTBuR2qnDvajy7yh4o",
  authDomain: "spontaneous-meetup-ea432.firebaseapp.com",
  projectId: "spontaneous-meetup-ea432",
  storageBucket: "spontaneous-meetup-ea432.firebasestorage.app",
  messagingSenderId: "927910491541",
  appId: "1:927910491541:web:5a458b2299e629b151f29c"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); 