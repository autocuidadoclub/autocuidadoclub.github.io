// Clean base integrating everything from the original with supplier JSON adjustment for wompiWebhook + fullPaymentCompleted logic
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const Stripe = require("stripe");
const qs = require("querystring");
const cors = require("cors")({ origin: true });


admin.initializeApp();
const db = admin.firestore();

const {
  client_id: ZOHO_CLIENT_ID,
  client_secret: ZOHO_CLIENT_SECRET,
  refresh_token: ZOHO_REFRESH_TOKEN,
  api_domain: ZOHO_API_DOMAIN,
  user_id: ZOHO_USER_ID
} = functions.config().zoho || {};

const stripe = Stripe(functions.config().stripe.secret);
const endpointSecret = functions.config().stripe.webhook;

async function getZohoAccessToken() {
  if (!ZOHO_CLIENT_ID || !ZOHO_CLIENT_SECRET || !ZOHO_REFRESH_TOKEN || !ZOHO_API_DOMAIN) {
    throw new Error("❌ Faltan variables de entorno de Zoho");
  }

  const body = qs.stringify({
    refresh_token: ZOHO_REFRESH_TOKEN,
    client_id: ZOHO_CLIENT_ID,
    client_secret: ZOHO_CLIENT_SECRET,
    grant_type: "refresh_token"
  });

  const response = await axios.post(`${ZOHO_API_DOMAIN}/oauth/v2/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  return response.data.access_token;
}

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
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  console.log("📧 Email sent:", response.data);
  return response.data;
}

exports.sendReferralEmail = functions.https.onRequest(async (req, res) => {
  try {
    const { referrerName, referrerEmail, referralName, referralEmail, referralPhone } = req.body;
    const subject = "🎉 ¡Nuevo referido agregado en AutoCuidado Club!";
    const body = `¡Hola ${referrerName}!<br><br>Has agregado un nuevo referido a AutoCuidado Club 🚗✨<br><br>📋 Datos del referido:<br>- Nombre: ${referralName}<br>- Email: ${referralEmail}<br>- WhatsApp: https://wa.me/${referralPhone}<br><br>Te notificaremos cuando se registre y pague para que recibas tus recompensas 🎁<br><br>¡Gracias por confiar en AutoCuidado Club!`;

    await sendZohoMail(referrerEmail, subject, body);
    res.status(200).send("Correo de referido enviado correctamente.");
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    res.status(500).send("Error al enviar correo.");
  }
});

exports.stripeWebhook = functions.https.onRequest((req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Firma Stripe inválida:", err.message);
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
      console.log(`✅ Stripe: pago registrado para ${uid}`);
      return res.status(200).send("Success");
    }).catch((err) => {
      console.error("❌ Error al actualizar Firestore:", err);
      return res.status(500).send("Firestore update error");
    });
  }
  return res.status(200).send("Unhandled event type");
});

exports.wompiWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const data = req.body;
    console.log("Webhook recibido:", JSON.stringify(data));

    const resultado = data.ResultadoTransaccion;
    if (!data || resultado !== "ExitosaAprobada") {
      console.warn("Transacción inválida o no aprobada.");
      return res.status(400).send("Invalid transaction");
    }

    const userEmail = data.Cliente?.EMail;
    if (!userEmail) return res.status(400).send("Missing customer email");

    const snapshot = await db.collection("users").where("email", "==", userEmail).limit(1).get();
    if (snapshot.empty) return res.status(404).send("User not found");

    const userRef = snapshot.docs[0].ref;
    const userData = snapshot.docs[0].data();
    const now = admin.firestore.Timestamp.now();
    const nextCycle = admin.firestore.Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
    const paymentId = data.IdTransaccion;
    const history = userData.paymentHistory || [];

    if (history.some(p => p.transactionId === paymentId)) {
      console.log("🔁 Wompi: pago ya registrado", paymentId);
      return res.status(200).send("Duplicate transaction");
    }

    const fullPlanPrices = {
      basic3mfull: 89.97,
      plus6mfull: 179.94,
      basic12mfull: 359.88,
      plus12mfull: 719.76
    };
    const plan = userData.planType;
    const amountPaid = parseFloat(data.Monto);
    const fullPaymentCompleted = fullPlanPrices[plan] ? amountPaid >= fullPlanPrices[plan] : false;

    await userRef.update({
      paymentStatus: "Confirmado",
      subscriptionStatus: "active",
      fullPaymentCompleted: fullPaymentCompleted,
      paymentDate: now,
      nextPaymentDate: nextCycle,
      monthsPaid: admin.firestore.FieldValue.increment(1),
      checkoutLink: "",
      paymentHistory: admin.firestore.FieldValue.arrayUnion({
        date: now,
        amount: amountPaid,
        transactionId: paymentId,
        status: resultado,
        source: "Proveedor",
      }),
    });

    console.log(`✅ Proveedor: pago registrado para ${userEmail}`);
    try {
      await sendZohoMail(userEmail, "🎉 ¡Gracias por tu pago en AutoCuidado Club!", `Pago recibido.`);
    } catch (emailError) {
      console.error("Zoho email error:", emailError.response?.data || emailError.message);
    }

    return res.status(200).send("Payment processed");
  } catch (error) {
    console.error("❌ Error en webhook proveedor:", error);
    return res.status(500).send("Internal Server Error");
  }
});

exports.guardarTokenPagadito = functions.https.onRequest(async (req, res) => {
  try {
    const { token_usuario, token_comercio, estado, correo_cliente } = req.body;
    if (!token_usuario || !token_comercio || !correo_cliente || estado !== "EX") {
      return res.status(400).send("Datos incompletos o transacción fallida.");
    }

    const snapshot = await db.collection("users").where("email", "==", correo_cliente).limit(1).get();
    if (snapshot.empty) return res.status(404).send("Usuario no encontrado.");

    const userRef = snapshot.docs[0].ref;
    await userRef.collection("pagadito").doc("tokens").set({
      token_usuario,
      token_comercio,
      creado: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).send("Tokens guardados exitosamente.");
  } catch (error) {
    console.error("❌ Error guardando tokens:", error);
    return res.status(500).send("Error del servidor.");
  }
});

exports.confirmPayment = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send({ error: "Only POST allowed" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).send({ error: "Missing userId" });
      }

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).send({ error: "User not found" });
      }

      const userData = userDoc.data();
      const currentMonthsPaid = userData.monthsPaid || 0;
      const newMonthsPaid = currentMonthsPaid + 1;

      const paymentDate = new Date();
      const nextPaymentDate = new Date();
      nextPaymentDate.setMonth(paymentDate.getMonth() + 1);

      const newPaymentEntry = {
        date: admin.firestore.Timestamp.fromDate(paymentDate),
        amount: userData.subscriptionAmount || 0,
        method: "Confirmado por Staff",
        status: "Completado",
      };

      const updates = {
        paymentStatus: "Confirmado",
        paymentDate: admin.firestore.Timestamp.fromDate(paymentDate),
        nextPaymentDate: admin.firestore.Timestamp.fromDate(nextPaymentDate),
        monthsPaid: newMonthsPaid >= 8 ? 0 : newMonthsPaid,
        paymentHistory: admin.firestore.FieldValue.arrayUnion(newPaymentEntry),
      };

      await userRef.update(updates);

      return res.status(200).send({
        success: true,
        message: "Payment updated",
        userData: { ...userData, ...updates },
      });
    } catch (error) {
      console.error("❌ Error in confirmPayment:", error);
      return res.status(500).send({ error: error.message });
    }
  });
});


// ✅ Secure Cloud Function for Staff Updates
exports.staffUpdateUser = functions.https.onCall(async (data, context) => {
  try {
    // Ensure user is logged in
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'El usuario no está autenticado.');
    }

    const staffRef = admin.firestore().collection('users').doc(context.auth.uid);
    const staffSnap = await staffRef.get();

    // Ensure only staff can run this
    if (!staffSnap.exists || staffSnap.data().role !== 'staff') {
      throw new functions.https.HttpsError('permission-denied', 'Solo el personal autorizado puede realizar esta acción.');
    }

    const { userId, updates } = data;
    if (!userId || !updates) {
      throw new functions.https.HttpsError('invalid-argument', 'Faltan parámetros necesarios.');
    }

    // Update Firestore document
    await admin.firestore().collection('users').doc(userId).update(updates);

    console.log(`✅ staffUpdateUser: Datos actualizados para ${userId}`);
    return { success: true, message: "Datos actualizados correctamente." };
  } catch (error) {
    console.error('❌ staffUpdateUser error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
