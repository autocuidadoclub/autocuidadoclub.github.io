const functions = require("firebase-functions");

exports.processSubscription = functions
  .region("us-central1") // ✅ Ensure it matches your Firebase region
  .https.onRequest((req, res) => {
    res.status(200).send("Cloud Function Deployed Successfully!");
  });

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// ✅ Function to get new access token from Zoho
async function getZohoAccessToken() {
  const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', null, {
    params: {
      refresh_token: process.env.ZOHO_REFRESH_TOKEN,
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }
  });
  return response.data.access_token;
}

// ✅ Main Function to send Email
exports.sendZohoEmail = functions.https.onRequest(async (req, res) => {
  try {
    const accessToken = await getZohoAccessToken();

    const emailData = {
      fromAddress: 'info@autocuidadoclub.com',
      toAddress: 'test@example.com', // Later: dynamic email from referral
      subject: '🎉 Nuevo referido agregado en AutoCuidado Club!',
      content: `
        ¡Hola [Nombre del Cliente]!

        Has agregado un nuevo referido a AutoCuidado Club 🚗✨

        📋 Datos del referido:
        - Nombre: [Nombre del referido]
        - Email: [Email del referido]
        - WhatsApp: https://wa.me/[Teléfono sin +]

        Recuerda que puedes seguir el progreso de tus referidos directamente desde tu panel de cliente.

        ¡Gracias por confiar en AutoCuidado Club!
      `,
      mailFormat: 'html',
    };

    await axios.post(`https://mail.zoho.com/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages`, emailData, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      }
    });

    res.status(200).send('✅ Email enviado correctamente.');
  } catch (error) {
    console.error('❌ Error al enviar email:', error.response?.data || error.message);
    res.status(500).send('Error al enviar email.');
  }
});
