// register.js


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

document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const phone = document.getElementById('phone').value;
    const plate = document.getElementById('plate').value;
    const make = document.getElementById('make').value;
    const model = document.getElementById('model').value;
    const year = document.getElementById('year').value;

    // Register user in Firebase Auth
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const userId = userCredential.user.uid;

            // Save profile data to Firestore
            return firebase.firestore().collection('users').doc(userId).set({
                name, email, phone,
                vehicles: [{ plate, make, model, year }],
                subscriptionStatus: 'Pending'
            });
        })
        .then(() => {
            alert('Registro exitoso');
            // Send WhatsApp message via Twilio (see Step 5)
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error en el registro:', error);
        });
});
