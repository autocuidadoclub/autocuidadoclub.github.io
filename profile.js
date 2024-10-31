// profile.js

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

let vehicleCount = 1;

function addVehicle() {
    const vehicleSection = document.getElementById('vehicleSection');
    vehicleCount++;

    const vehicleHTML = `
        <h3>Vehículo ${vehicleCount}</h3>
        <label for="plate${vehicleCount}">Placa:</label>
        <input type="text" id="plate${vehicleCount}" name="plate${vehicleCount}" required>

        <label for="make${vehicleCount}">Marca:</label>
        <input type="text" id="make${vehicleCount}" name="make${vehicleCount}" required>

        <label for="model${vehicleCount}">Modelo:</label>
        <input type="text" id="model${vehicleCount}" name="model${vehicleCount}" required>

        <label for="year${vehicleCount}">Año:</label>
        <input type="number" id="year${vehicleCount}" name="year${vehicleCount}" required>
    `;
    vehicleSection.insertAdjacentHTML('beforeend', vehicleHTML);
}

document.getElementById('profileForm').addEventListener('submit', function(event) {
    event.preventDefault();
    saveProfile();
});

function saveProfile() {
    // Collect form data and save it to Firebase
    const profileData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        vehicles: []
    };

    for (let i = 1; i <= vehicleCount; i++) {
        const vehicle = {
            plate: document.getElementById(`plate${i}`).value,
            make: document.getElementById(`make${i}`).value,
            model: document.getElementById(`model${i}`).value,
            year: document.getElementById(`year${i}`).value
        };
        profileData.vehicles.push(vehicle);
    }

    // Save to Firebase (assuming Firebase is initialized in firebase.js)
    firebase.firestore().collection('profiles').doc(profileData.email).set(profileData)
        .then(() => {
            alert('Perfil guardado exitosamente');
            window.location.href = 'recommendation.html';
        })
        .catch((error) => {
            console.error('Error saving profile: ', error);
            alert('Error al guardar el perfil');
        });
}
