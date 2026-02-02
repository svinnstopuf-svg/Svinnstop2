// Temporary cleanup function - call via HTTP to clean all premium data
// Deploy: firebase deploy --only functions:cleanPremiumData
// Call: https://us-central1-svinnstop.cloudfunctions.net/cleanPremiumData

const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.cleanPremiumData = functions.https.onRequest(async (req, res) => {
  // CORS
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  // Security: require confirmation token
  const confirmToken = req.body.confirm;
  if (confirmToken !== "CLEAN_ALL_PREMIUM_DATA_2026") {
    res.status(403).json({error: "Invalid confirmation token"});
    return;
  }

  try {
    console.log("🧹 Starting premium data cleanup...");

    const db = admin.database();

    // 1. Clean all user premium data
    console.log("📋 Step 1: Cleaning user premium data...");
    const usersRef = db.ref("users");
    const usersSnapshot = await usersRef.once("value");
    const users = usersSnapshot.val() || {};

    let userPremiumCount = 0;
    const userUpdates = {};

    for (const userId in users) {
      if (users[userId].premium) {
        userUpdates[`users/${userId}/premium`] = null;
        userPremiumCount++;
      }
    }

    if (userPremiumCount > 0) {
      await db.ref().update(userUpdates);
      console.log(`✅ Removed premium data from ${userPremiumCount} users`);
    }

    // 2. Clean all family premium data
    console.log("📋 Step 2: Cleaning family premium data...");
    const familiesRef = db.ref("families");
    const familiesSnapshot = await familiesRef.once("value");
    const families = familiesSnapshot.val() || {};

    let familyPremiumCount = 0;
    const familyUpdates = {};

    for (const familyId in families) {
      if (families[familyId].premium) {
        familyUpdates[`families/${familyId}/premium`] = null;
        familyPremiumCount++;
      }
    }

    if (familyPremiumCount > 0) {
      await db.ref().update(familyUpdates);
      console.log(`✅ Removed premium data from ${familyPremiumCount} families`);
    }

    // Success response
    res.json({
      success: true,
      message: "All premium data has been cleaned",
      usersCleaned: userPremiumCount,
      familiesCleaned: familyPremiumCount,
    });
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
