// profile.js
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
