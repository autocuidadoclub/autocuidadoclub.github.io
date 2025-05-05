const express = require("express");
const axios = require("axios");
const FormData = require("form-data"); // ✅ Required for multipart/form-data

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", async (req, res) => {
  const event = req.body;

  console.log("📩 Received Stripe webhook:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("✅ Checkout completed:", {
        name: session.customer_details?.name,
        email: session.customer_details?.email,
        plan: session.metadata?.plan,
      });

      const form = new FormData();
      form.append("_subject", "✅ Pago exitoso en Stripe");
      form.append("Nombre", session.customer_details?.name || "Sin nombre");
      form.append("Email", session.customer_details?.email || "Sin correo");
      form.append("Plan", session.metadata?.plan || "No definido");
      form.append("Estado", "Pagado con éxito");

      await axios.post("https://formsubmit.co/info@autocuidadoclub.com", form, {
        headers: form.getHeaders(),
      });
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const session = event.data.object;

      const form = new FormData();
      form.append("_subject", "❌ Pago fallido o cancelado en Stripe");
      form.append("Email", session.customer_email || "Sin correo");
      form.append("Estado", "El cliente no completó el pago");

      await axios.post("https://formsubmit.co/info@autocuidadoclub.com", form, {
        headers: form.getHeaders(),
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error handling webhook:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    res.status(500).send("Error");
  }
});

app.get("/", (req, res) => res.send("✅ Webhook is running!"));

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
