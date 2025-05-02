// functions/index.js

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const axios     = require('axios');
const StripeLib = require('stripe');

// — initialize Admin SDK & Firestore
admin.initializeApp();
const db = admin.firestore();

// — Zoho config from `functions.config().zoho`
const {
  client_id:     ZOHO_CLIENT_ID,
  client_secret: ZOHO_CLIENT_SECRET,
  refresh_token: ZOHO_REFRESH_TOKEN,
  api_domain:    ZOHO_API_DOMAIN,
  user_id:       ZOHO_USER_ID
} = functions.config().zoho;

// — Stripe config from `functions.config().stripe`
const STRIPE_SECRET    = functions.config().stripe.secret;
const STRIPE_WEBHOOK   = functions.config().stripe.webhook;
const stripe           = StripeLib(STRIPE_SECRET);

// — Your front-end’s origin for success/cancel redirects
const FRONTEND_URL = functions.config().app?.url || 'https://YOUR_DOMAIN';  
// (set via: `firebase functions:config:set app.url="https://autocuidadoclub.com"`)

// ─── Zoho Email Helpers ────────────────────────────────────────────────────────

async function getZohoAccessToken() {
  const resp = await axios.post(
    `${ZOHO_API_DOMAIN}/oauth/v2/token`,
    null,
    { params: {
        refresh_token: ZOHO_REFRESH_TOKEN,
        client_id:     ZOHO_CLIENT_ID,
        client_secret: ZOHO_CLIENT_SECRET,
        grant_type:    'refresh_token'
    }}
  );
  return resp.data.access_token;
}

async function sendZohoMail(toEmail, subject, htmlContent) {
  const token = await getZohoAccessToken();
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
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Zoho email sent:', resp.data);
  return resp.data;
}

// ─── 1️⃣ HTTP endpoint: Send referral email ────────────────────────────────────

exports.sendReferralEmail = functions.https.onRequest(async (req, res) => {
  try {
    const {
      referrerName, referrerEmail,
      referralName, referralEmail, referralPhone
    } = req.body;

    const subject = '🎉 ¡Nuevo referido en AutoCuidado Club!';
    const html = `
      ¡Hola ${referrerName}!<br><br>
      Has agregado un nuevo referido:<br>
      • Nombre: ${referralName}<br>
      • Email: ${referralEmail}<br>
      • WhatsApp: <a href="https://wa.me/${referralPhone}">${referralPhone}</a><br><br>
      Te avisaremos cuando complete su pago para que disfrutes tus recompensas 🎁
    `;

    await sendZohoMail(referrerEmail, subject, html);
    res.status(200).send('Referral email sent');
  } catch (err) {
    console.error('Error in sendReferralEmail:', err);
    res.status(500).send('Error sending referral email');
  }
});

// ─── 2️⃣ HTTP endpoint: Guardar Pagadito tokens ───────────────────────────────

exports.guardarTokenPagadito = functions.https.onRequest(async (req, res) => {
  try {
    const { token_usuario, token_comercio, estado, correo_cliente } = req.body;
    if (estado !== 'EX' || !token_usuario || !token_comercio || !correo_cliente) {
      return res.status(400).send('Invalid payload or transaction failed');
    }

    const usersRef = db.collection('users');
    const snap     = await usersRef.where('email','==',correo_cliente).limit(1).get();
    if (snap.empty) return res.status(404).send('User not found');

    const userRef = snap.docs[0].ref;
    await userRef.collection('pagadito').doc('tokens').set({
      token_usuario,
      token_comercio,
      creado: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(200).send('Tokens saved');
  } catch (err) {
    console.error('Error in guardarTokenPagadito:', err);
    res.status(500).send('Server error');
  }
});

// ─── 3️⃣ Callable: Create Stripe Checkout Session ─────────────────────────────

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // must be signed in
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated','User must be signed in');
  }

  const uid     = context.auth.uid;
  const priceId = data.priceId;  // e.g. "price_abc123..."

  if (!priceId) {
    throw new functions.https.HttpsError('invalid-argument','Missing priceId');
  }

  // build the session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode:                 'subscription',
    line_items:           [{ price: priceId, quantity: 1 }],
    customer_email:       context.auth.token.email,
    metadata:             { uid },
    success_url:          `${FRONTEND_URL}/checkout.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:           `${FRONTEND_URL}/dashboard.html?canceled=true`
  });

  return { url: session.url };
});

// ─── 4️⃣ Webhook: Handle completed checkouts ──────────────────────────────────

exports.stripeWebhook = functions.https.onRequest({ rawBody: true }, async (req, res) => {

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 1️⃣ First-time payment after checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const uid     = session.metadata.uid;

    console.log(`🔔 Checkout complete for user ${uid}`);

    try {
      await db.collection('users').doc(uid).update({
        paymentStatus:   'Completed',
        paymentDate:     admin.firestore.Timestamp.now(),
        nextPaymentDate: admin.firestore.Timestamp.fromDate(
                            new Date(Date.now() + 30*24*60*60*1000)
                         ),
        paymentHistory:  admin.firestore.FieldValue.arrayUnion({
                           date:   admin.firestore.Timestamp.now(),
                           amount: session.amount_total / 100,
                           method: 'Stripe',
                           status: 'Completed'
                         })
      });
      console.log(`✅ Firestore updated for ${uid}`);
    } catch (err) {
      console.error('❌ Firestore update failed:', err);
      return res.status(500).send('Firestore update error');
    }
  }

  // 2️⃣ Monthly subscription payment success
  if (event.type === 'invoice.payment_succeeded') {
    console.log('📥 invoice.payment_succeeded received!');
    console.log('🧾 Invoice data:', JSON.stringify(event.data.object, null, 2));
    const invoice = event.data.object;
    const customerEmail = invoice.customer_email || invoice.customer;
    const amountPaid = invoice.amount_paid / 100;
    const planId = invoice.lines.data[0].plan.id;

    await db.collection('payments').add({
      email: customerEmail,
      planId,
      amount: amountPaid,
      timestamp: Date.now(),
    });

    try {
  await sendZohoMail(
    'info@autocuidadoclub.com',
    `💳 Pago recibido de ${customerEmail}`,
    `Plan: ${planId}, Monto: $${amountPaid.toFixed(2)}`
  );
  console.log('✅ Zoho mail sent successfully');
} catch (err) {
  console.error('❌ Error sending Zoho mail:', err.response?.data || err.message);
}


  // 3️⃣ Subscription payment failed
  if (event.type === 'invoice.payment_failed') {
    console.log('📥 invoice.payment_failed received!');
    const invoice = event.data.object;
    const customerEmail = invoice.customer_email || invoice.customer;
    const amountDue = invoice.amount_due / 100;

    try {
  await sendZohoMail(
    'info@autocuidadoclub.com',
    `⚠️ Falló el pago de ${customerEmail}`,
    `Monto pendiente: $${amountDue.toFixed(2)} – por favor contactar.`
  );
  console.log('⚠️ Zoho failed payment email sent');
} catch (err) {
  console.error('❌ Error sending failed payment email:', err.response?.data || err.message);
}


  // ✅ Always ACK
  res.json({ received: true });
});
