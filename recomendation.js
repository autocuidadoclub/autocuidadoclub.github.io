// recommendation.js
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
