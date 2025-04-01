importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
    apiKey: window._env_.FIREBASE_API_KEY,
    authDomain: window._env_.FIREBASE_AUTH_DOMAIN,
    projectId: window._env_.FIREBASE_PROJECT_ID,
    storageBucket: window._env_.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: window._env_.FIREBASE_MESSAGING_SENDER_ID,
    appId: window._env_.FIREBASE_APP_ID,
    measurementId: window._env_.FIREBASE_MEASUREMENT_ID
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
        body: 'Background Message body.',
        icon: '/firebase-logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
