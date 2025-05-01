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
exports.guardarTokenPagadito = functions.https.onRequest(async (req, res) => {
  try {
    const { token_usuario, token_comercio, estado, correo_cliente } = req.body;

    if (!token_usuario || !token_comercio || !correo_cliente || estado !== "EX") {
      return res.status(400).send("Datos incompletos o transacción fallida.");
    }

    // Buscar el usuario por email
    const usersRef = admin.firestore().collection("users");
    const snapshot = await usersRef.where("email", "==", correo_cliente).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).send("Usuario no encontrado en Firestore.");
    }

    const userRef = snapshot.docs[0].ref;

    // Guardar tokens en subcolección "pagadito"
    await userRef.collection("pagadito").doc("tokens").set({
      token_usuario,
      token_comercio,
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send("Tokens guardados exitosamente.");
  } catch (error) {
    console.error("❌ Error al guardar tokens:", error);
    return res.status(500).send("Error del servidor.");
  }
});

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

// Load Stripe secret and webhook secret from environment
const stripe = Stripe(functions.config().stripe.secret);
const endpointSecret = functions.config().stripe.webhook;

exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  if (event.type === "checkout.session.completed") {
    const uid = session.metadata.uid;

    return db.collection("users").doc(uid).update({
      paymentStatus: "Completed",
      paymentDate: admin.firestore.Timestamp.now(),
      nextPaymentDate: admin.firestore.Timestamp.fromDate(
        new Date(new Date().setMonth(new Date().getMonth() + 1))
      ),
      paymentHistory: admin.firestore.FieldValue.arrayUnion({
        date: admin.firestore.Timestamp.now(),
        amount: session.amount_total / 100,
        method: "Stripe",
        status: "Completed",
      }),
    }).then(() => {
      console.log(`✅ Payment recorded for user: ${uid}`);
      return res.status(200).send("Success");
    }).catch((err) => {
      console.error("❌ Firestore update failed:", err);
      return res.status(500).send("Firestore update error");
    });
  }

  return res.status(200).send("Unhandled event type");
});
