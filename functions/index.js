// functions/index.js

const functions    = require('firebase-functions');
const admin        = require('firebase-admin');
const axios        = require('axios');
const Stripe       = require('stripe');

admin.initializeApp();
const db = admin.firestore();

// —— Zoho Email Credentials from functions.config()
const {
  client_id:     ZOHO_CLIENT_ID,
  client_secret: ZOHO_CLIENT_SECRET,
  refresh_token: ZOHO_REFRESH_TOKEN,
  api_domain:    ZOHO_API_DOMAIN,
  user_id:       ZOHO_USER_ID
} = functions.config().zoho;

// —— Stripe Credentials
const stripe       = Stripe(functions.config().stripe.secret);
const endpointSecret = functions.config().stripe.webhook;



// 🚀 Get a new Zoho access token
async function getZohoAccessToken() {
  const resp = await axios.post(
    `${ZOHO_API_DOMAIN}/oauth/v2/token`,
    null,
    { params: {
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id:     ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type:    'refresh_token'
      }
    }
  );
  return resp.data.access_token;
}

// 🚀 Send an email via Zoho
async function sendZohoMail(toEmail, subject, htmlContent) {
  const accessToken = await getZohoAccessToken();
  const payload = {
    fromAddress: 'info@autocuidadoclub.com',
    toAddress:   toEmail,
    subject,
    content:     htmlContent,
    mailFormat:  'html'
  };
  const resp = await axios.post(
    `${ZOHO_API_DOMAIN}/mail/v1/accounts/${ZOHO_USER_ID}/messages`,
    payload,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  console.log('Zoho email sent:', resp.data);
  return resp.data;
}

// 📩 Endpoint: Send referral email
exports.sendReferralEmail = functions.https.onRequest(async (req, res) => {
  try {
    const { referrerName, referrerEmail, referralName, referralEmail, referralPhone } = req.body;
    const subject = '🎉 ¡Nuevo referido en AutoCuidado Club!';
    const body = `
      ¡Hola ${referrerName}!<br><br>
      Has agregado un nuevo referido:<br>
      - Nombre: ${referralName}<br>
      - Email: ${referralEmail}<br>
      - WhatsApp: https://wa.me/${referralPhone}<br><br>
      Te avisaremos cuando complete su pago para que disfrutes tus recompensas. 🎁
    `;
    await sendZohoMail(referrerEmail, subject, body);
    res.status(200).send('Referral email sent');
  } catch (err) {
    console.error('Error sending referral email:', err);
    res.status(500).send('Error');
  }
});

// 📦 Endpoint: Guardar tokens Pagadito
exports.guardarTokenPagadito = functions.https.onRequest(async (req, res) => {
  try {
    const { token_usuario, token_comercio, estado, correo_cliente } = req.body;
    if (estado !== 'EX' || !token_usuario || !token_comercio || !correo_cliente) {
      return res.status(400).send('Invalid payload or payment failed');
    }
    const usersRef = db.collection('users');
    const snap     = await usersRef.where('email', '==', correo_cliente).limit(1).get();
    if (snap.empty) return res.status(404).send('User not found');
    const userRef = snap.docs[0].ref;
    await userRef.collection('pagadito').doc('tokens').set({
      token_usuario,
      token_comercio,
      creado: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(200).send('Tokens saved');
  } catch (err) {
    console.error('Error guardarTokenPagadito:', err);
    res.status(500).send('Server error');
  }
});

// 🔔 Endpoint: Stripe Webhook to record completed checkouts
exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const sess = event.data.object;
    const uid  = sess.metadata.uid;  // ← Make sure you set this when creating the Session!
    return db.collection('users').doc(uid).update({
      paymentStatus:   'Completed',
      paymentDate:     admin.firestore.Timestamp.now(),
      nextPaymentDate: admin.firestore.Timestamp.fromDate(
                         new Date(Date.now() + 30*24*60*60*1000)
                       ),
      paymentHistory:  admin.firestore.FieldValue.arrayUnion({
                         date:   admin.firestore.Timestamp.now(),
                         amount: sess.amount_total/100,
                         method: 'Stripe',
                         status: 'Completed'
                       })
    })
    .then(() => {
      console.log(`Payment recorded for user ${uid}`);
      return res.status(200).send('Success');
    })
    .catch((err) => {
      console.error('Firestore update failed:', err);
      return res.status(500).send('Update error');
    });
  }

  // Other events
  res.status(200).send('Ignored');
});
