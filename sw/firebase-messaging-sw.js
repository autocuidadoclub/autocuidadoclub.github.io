importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCY6BeuJSbUboosMDrvlzQUmeNLb2dJX_0",
  authDomain: "bookings-autocuidad-club.firebaseapp.com",
  projectId: "bookings-autocuidad-club",
  storageBucket: "bookings-autocuidad-club.appspot.com",
  messagingSenderId: "179075180686",
  appId: "1:179075180686:web:6950b87b7fd6c6f49d01df",
  measurementId: "G-LXJ50PGESY"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message: ', payload);
  
  const notificationTitle = 'New message!';
  const notificationOptions = {
    body: payload.data.status,
    icon: '/images/icon.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
