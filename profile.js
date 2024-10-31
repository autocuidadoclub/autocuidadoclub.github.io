// Initialize Firebase
const firebaseConfig = {
apiKey: "AIzaSyBsYS6pHWaTgXzdml-H_y3lQewWgOUezPM",
  authDomain: "auto-cuidadoclub.firebaseapp.com",
  databaseURL: "https://auto-cuidadoclub-default-rtdb.firebaseio.com",
  projectId: "auto-cuidadoclub",
  storageBucket: "auto-cuidadoclub.appspot.com",
  messagingSenderId: "986704701191",
  appId: "1:986704701191:web:fc96ef678d64c1cdcf47a2",
  measurementId: "G-LBBGXV2YX5"
};
firebase.initializeApp(firebaseConfig);

// Firestore reference
const db = firebase.firestore();

// Check if user is logged in
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // User is authenticated, retrieve user data
    const userId = user.uid;
    db.collection("users").doc(userId).get().then((doc) => {
      if (doc.exists) {
        displayUserData(doc.data());
      } else {
        console.error("No user data found!");
        document.getElementById("profileInfo").innerText = "User data not found.";
      }
    }).catch((error) => {
      console.error("Error retrieving user data:", error);
    });
  } else {
    // Redirect to login if user is not authenticated
    window.location.href = "login.html";
  }
});

// Function to display user data on the profile page
function displayUserData(userData) {
  const profileInfo = document.getElementById("profileInfo");
  
  // Display basic user info
  profileInfo.innerHTML = `
    <p><strong>Nombre:</strong> ${userData.name || "No name provided"}</p>
    <p><strong>Email:</strong> ${userData.email || "No email provided"}</p>
    <p><strong>Teléfono:</strong> ${userData.phone || "No phone provided"}</p>
    <p><strong>Estado de Suscripción:</strong> ${userData.subscriptionStatus || "No subscription"}</p>
  `;

  // Display vehicle info if available
  if (userData.vehicles && userData.vehicles.length > 0) {
    const vehicleList = document.createElement("ul");
    userData.vehicles.forEach((vehicle, index) => {
      const vehicleItem = document.createElement("li");
      vehicleItem.innerHTML = `
        <p><strong>Vehículo ${index + 1}:</strong></p>
        <p>Marca: ${vehicle.brand || "No data"}</p>
        <p>Modelo: ${vehicle.model || "No data"}</p>
        <p>Año: ${vehicle.year || "No data"}</p>
        <p>Placa: ${vehicle.plate || "No data"}</p>
      `;
      vehicleList.appendChild(vehicleItem);
    });
    profileInfo.appendChild(vehicleList);
  } else {
    profileInfo.innerHTML += `<p>No vehicles registered.</p>`;
  }
}
