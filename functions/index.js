// functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// 🔑 Environment variables from GitHub Secrets
const {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
  ZOHO_API_DOMAIN,
  ZOHO_USER_ID
} = process.env;

// 🚀 Function to get new access token using refresh token
async function getZohoAccessToken() {
  const response = await axios.post(`${ZOHO_API_DOMAIN}/oauth/v2/token`, null, {
    params: {
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }
  });
  return response.data.access_token;
}

// 🚀 Function to send email via Zoho API
async function sendZohoMail(toEmail, subject, bodyContent) {
  const accessToken = await getZohoAccessToken();

  const payload = {
    fromAddress: 'info@autocuidadoclub.com', // 🛠️ Replace with your sending email
    toAddress: toEmail,
    subject,
    content: bodyContent,
    mailFormat: 'html'
  };

  const response = await axios.post(`${ZOHO_API_DOMAIN}/mail/v1/accounts/${ZOHO_USER_ID}/messages`, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  console.log('Email sent:', response.data);
  return response.data;
}

// 📩 Example trigger — Referral email (trigger manually or from Firestore)
exports.sendReferralEmail = functions.https.onRequest(async (req, res) => {
  try {
    const { referrerName, referrerEmail, referralName, referralEmail, referralPhone } = req.body;

    const subject = '🎉 ¡Nuevo referido agregado en AutoCuidado Club!';
    const body = `
      ¡Hola ${referrerName}!<br><br>
      Has agregado un nuevo referido a AutoCuidado Club 🚗✨<br><br>
      📋 Datos del referido:<br>
      - Nombre: ${referralName}<br>
      - Email: ${referralEmail}<br>
      - WhatsApp: https://wa.me/${referralPhone}<br><br>
      Recuerda que puedes seguir el progreso de tus referidos directamente desde tu panel de cliente.<br>
      Te notificaremos automáticamente cuando tu referido se registre y complete su pago para que disfrutes de tus recompensas 🎁<br><br>
      ¡Gracias por confiar en AutoCuidado Club!
    `;

    await sendZohoMail(referrerEmail, subject, body);
    res.status(200).send('Referral email sent successfully!');
  } catch (error) {
    console.error('Error sending referral email:', error);
    res.status(500).send('Error sending email');
  }
});

// ✅ Add more functions for registration and payment notifications here.
