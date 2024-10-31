// recommendation.js

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyBsYS6pHWaTgXzdml-H_y3lQewWgOUezPM",
  authDomain: "auto-cuidadoclub.firebaseapp.com",
  databaseURL: "https://auto-cuidadoclub-default-rtdb.firebaseio.com",
  projectId: "auto-cuidadoclub",
  storageBucket: "auto-cuidadoclub.appspot.com",
  messagingSenderId: "986704701191",
  appId: "1:986704701191:web:fc96ef678d64c1cdcf47a2",
  measurementId: "G-LBBGXV2YX5"

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

firebase.firestore().collection('profiles').doc(userEmail).get()
    .then((doc) => {
        if (doc.exists) {
            const profileData = doc.data();
            const vehicleCount = profileData.vehicles.length;
            const recommendationText = vehicleCount > 1 ? 
                'Recomendamos la Suscripción Plus para múltiples vehículos.' : 
                'Recomendamos la Suscripción Básica para un solo vehículo.';

            document.getElementById('recommendation').innerHTML = `<p>${recommendationText}</p>`;
        }
    });

function contactSupport() {
    window.location.href = 'https://wa.me/your-twilio-whatsapp-number';
}
