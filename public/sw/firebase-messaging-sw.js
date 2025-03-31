importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: window._env_.FIREBASE_API_KEY,
        authDomain: window._env_.FIREBASE_AUTH_DOMAIN,
        projectId: window._env_.FIREBASE_PROJECT_ID,
        storageBucket: window._env_.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: window._env_.FIREBASE_MESSAGING_SENDER_ID,
        appId: window._env_.FIREBASE_APP_ID,
        measurementId: window._env_.FIREBASE_MEASUREMENT_ID
});

const messaging = firebase.messaging();

self.addEventListener('install', (event) => {
  console.log('✅ Service worker installed');
});

messaging.onBackgroundMessage((payload) => {
  console.log('📩 Mensaje en background:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.jpg' // or any icon you want
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
