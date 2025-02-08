echo 'const functions = require("firebase-functions");

exports.processSubscription = functions.https.onRequest((req, res) => {
  res.send("Cloud Function Deployed Successfully!");
});' > index.js
