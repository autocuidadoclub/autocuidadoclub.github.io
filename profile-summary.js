// profile-summary.js
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
