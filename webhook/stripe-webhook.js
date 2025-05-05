const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const ZOHO_TOKEN = process.env.ZOHO_ACCESS_TOKEN;
const ZOHO_ACCOUNT_ID = process.env.ZOHO_ACCOUNT_ID;

app.use(express.json());

app.post("/webhook", async (req, res) => {
  const event = req.body;
  console.log("📩 Stripe event:", event.type);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const nombre = session.customer_details?.name || "Sin nombre";
      const email = session.customer_details?.email || "Sin correo";
      const plan = session.metadata?.plan || "No definido";

      const content = `
✅ Pago exitoso en Stripe

🧑 Nombre: ${nombre}
📧 Email del cliente: ${email}
📦 Plan: ${plan}
✅ Estado: Pagado con éxito
`;

      const messageData = {
        fromAddress: "info@autocuidadoclub.com",
        subject: "✅ Confirmación de pago - AutoCuidado Club",
        content: content,
      };

      // 📤 Send to staff
      await axios.post(
        `https://mail.zoho.com/api/accounts/${ZOHO_ACCOUNT_ID}/messages`,
        {
          ...messageData,
          toAddress: "info@autocuidadoclub.com",
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${ZOHO_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 📤 Send to client
      if (email !== "Sin correo") {
        await axios.post(
          `https://mail.zoho.com/api/accounts/${ZOHO_ACCOUNT_ID}/messages`,
          {
            ...messageData,
            toAddress: email,
          },
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${ZOHO_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log("✅ Emails sent to staff and customer.");
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
