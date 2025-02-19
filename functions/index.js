const functions = require("firebase-functions");

exports.processSubscription = functions
  .region("us-central1") // ✅ Ensure it matches your Firebase region
  .https.onRequest((req, res) => {
    res.status(200).send("Cloud Function Deployed Successfully!");
  });
