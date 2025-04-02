// Import the necessary Firebase SDKs for the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyCY6BeuJSbUboosMDrvlzQUmeNLb2dJX_0",
  authDomain: "bookings-autocuidad-club.firebaseapp.com",
  projectId: "bookings-autocuidad-club",
  storageBucket: "bookings-autocuidad-club.firebasestorage.app",
  messagingSenderId: "179075180686",
  appId: "1:179075180686:web:6950b87b7fd6c6f49d01df",
  measurementId: "G-LXJ50PGESY"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Construct notification options
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png' // Make sure this icon exists at the root
  };

  // Display notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});
