const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", async (req, res) => {
  const event = req.body;

  // ✅ Debug log incoming request
  console.log("📩 Received Stripe webhook:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("✅ Checkout completed:", {
        name: session.customer_details?.name,
        email: session.customer_details?.email,
        plan: session.metadata?.plan,
      });

      await axios.post("https://formsubmit.co/ajax/info@autocuidadoclub.com", {
        _subject: "✅ Pago exitoso en Stripe",
        Nombre: session.customer_details?.name || "Sin nombre",
        Email: session.customer_details?.email || "Sin correo",
        Plan: session.metadata?.plan || "No definido",
        Estado: "Pagado con éxito",
      });
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const session = event.data.object;
      console.log("❌ Checkout failed or expired:", {
        email: session.customer_email || "Sin correo",
      });

      await axios.post("https://formsubmit.co/ajax/info@autocuidadoclub.com", {
        _subject: "❌ Pago fallido o cancelado en Stripe",
        Email: session.customer_email || "Sin correo",
        Estado: "El cliente no completó el pago",
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error handling webhook:", error.message);
    res.status(500).send("Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
