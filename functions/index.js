const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

// 🔑 Environment variables from GitHub Secrets / Firebase config
const {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REFRESH_TOKEN,
  ZOHO_API_DOMAIN,
  ZOHO_USER_ID,
} = process.env;

const stripe = Stripe(functions.config().stripe.secret);
const endpointSecret = functions.config().stripe.webhook;

// 🌐 Zoho Mail: Get Access Token
async function getZohoAccessToken() {
  const response = await axios.post(`${ZOHO_API_DOMAIN}/oauth/v2/token`, null, {
    params: {
      refresh_token: ZOHO_REFRESH_TOKEN,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: "refresh_token",
    },
  });
  return response.data.access_token;
}

// 📧 Zoho Mail: Send email
async function sendZohoMail(toEmail, subject, bodyContent) {
  const accessToken = await getZohoAccessToken();

  const payload = {
    fromAddress: "info@autocuidadoclub.com",
    toAddress: toEmail,
    subject,
    content: bodyContent,
    mailFormat: "html",
  };

  const response = await axios.post(
    `${ZOHO_API_DOMAIN}/mail/v1/accounts/${ZOHO_USER_ID}/messages`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  console.log("Email sent:", response.data);
  return response.data;
}

// 📩 Referral Email Function
exports.sendReferralEmail = functions.https.onRequest(async (req, res) => {
  try {
    const {
      referrerName,
      referrerEmail,
      referralName,
      referralEmail,
      referralPhone,
    } = req.body;

    const subject = "🎉 ¡Nuevo referido agregado en AutoCuidado Club!";
    const body = `
      ¡Hola ${referrerName}!<br><br>
      Has agregado un nuevo referido a AutoCuidado Club 🚗✨<br><br>
      📋 Datos del referido:<br>
      - Nombre: ${referralName}<br>
      - Email: ${referralEmail}<br>
      - WhatsApp: https://wa.me/${referralPhone}<br><br>
      Te notificaremos cuando se registre y pague para que recibas tus recompensas 🎁<br><br>
      ¡Gracias por confiar en AutoCuidado Club!
    `;

    await sendZohoMail(referrerEmail, subject, body);
    res.status(200).send("Referral email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending referral email:", error);
    res.status(500).send("Error sending email");
  }
});

// 💳 Stripe Webhook
exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Stripe Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = event.data.object;

  if (event.type === "checkout.session.completed") {
    const uid = session.metadata.uid;

    return db
      .collection("users")
      .doc(uid)
      .update({
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
      })
      .then(() => {
        console.log(`✅ Stripe payment recorded for user: ${uid}`);
        return res.status(200).send("Success");
      })
      .catch((err) => {
        console.error("❌ Firestore update failed:", err);
        return res.status(500).send("Firestore update error");
      });
  }

  res.status(200).send("Unhandled event type");
});

// 🧾 Wompi Webhook
exports.wompiWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const transaction = req.body?.transaction;

    if (!transaction || transaction.status !== "APPROVED") {
      return res.status(400).send("Invalid transaction");
    }

    const userEmail = transaction.customer_email;
    if (!userEmail) return res.status(400).send("Missing customer email");

    const snapshot = await db
      .collection("users")
      .where("email", "==", userEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).send("User not found");
    }

    const userRef = snapshot.docs[0].ref;
    const now = admin.firestore.Timestamp.now();
    const nextCycle = admin.firestore.Timestamp.fromMillis(
      now.toMillis() + 30 * 24 * 60 * 60 * 1000
    );

    const paymentId = transaction.id;
    const currentHistory = snapshot.docs[0].data().paymentHistory || [];
    const alreadyExists = currentHistory.some(
      (p) => p.transactionId === paymentId
    );

    if (alreadyExists) {
      console.log("🔁 Duplicate Wompi payment:", paymentId);
      return res.status(200).send("Duplicate transaction");
    }

    await userRef.update({
      paymentStatus: "Paid",
      subscriptionStatus: "active",
      paymentDate: now,
      nextPaymentDate: nextCycle,
      monthsPaid: admin.firestore.FieldValue.increment(1),
      checkoutLink: "",
      paymentHistory: admin.firestore.FieldValue.arrayUnion({
        date: now,
        amount: transaction.amount_in_cents / 100,
        transactionId: paymentId,
        status: transaction.status,
        source: "Wompi",
      }),
    });

    console.log(`✅ Wompi payment processed for: ${userEmail}`);
    res.status(200).send("Payment processed");
  } catch (error) {
    console.error("❌ Error in Wompi webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// 🔐 Pagadito token store
exports.guardarTokenPagadito = functions.https.onRequest(async (req, res) => {
  try {
    const { token_usuario, token_comercio, estado, correo_cliente } = req.body;

    if (!token_usuario || !token_comercio || !correo_cliente || estado !== "EX") {
      return res.status(400).send("Datos incompletos o transacción fallida.");
    }

    const usersRef = db.collection("users");
    const snapshot = await usersRef
      .where("email", "==", correo_cliente)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).send("Usuario no encontrado en Firestore.");
    }

    const userRef = snapshot.docs[0].ref;

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
