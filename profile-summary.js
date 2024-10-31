// profile-summary.js

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
            const profileHTML = `
                <h2>${profileData.name}</h2>
                <p><strong>Correo:</strong> ${profileData.email}</p>
                <p><strong>Teléfono:</strong> ${profileData.phone}</p>
                <h3>Vehículos:</h3>
                <ul>
                    ${profileData.vehicles.map(vehicle => `
                        <li>${vehicle.make} ${vehicle.model} (${vehicle.year}) - Placa: ${vehicle.plate}</li>
                    `).join('')}
                </ul>
                <p><strong>Suscripción:</strong> ${profileData.subscription || 'No activa'}</p>
            `;
            document.getElementById('profileSummary').innerHTML = profileHTML;
        } else {
            alert('Perfil no encontrado.');
        }
    });
