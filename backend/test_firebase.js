const admin = require("firebase-admin");

try {
  admin.initializeApp({ projectId: "nuance-ai-e9e6b" });
  console.log("Initialized.");
} catch (e) {
  console.log("Init error:", e.message);
}

async function test() {
  try {
    await admin.auth().verifyIdToken("fake_token_123");
    console.log("Verification succeeded (unexpected)");
  } catch (e) {
    console.log("Verification error:", e.message);
  }
}

test();
