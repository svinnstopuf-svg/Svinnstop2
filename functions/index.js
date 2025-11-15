const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Resend} = require("resend");

admin.initializeApp();

// Initialize Resend with API key from Firebase config
const getResendKey = () => {
  const config = functions.config();
  return (config.resend && config.resend.api_key) || process.env.RESEND_API_KEY;
};
const resend = new Resend(getResendKey());

// Cloud Function för att hantera email-prenumerationer
exports.subscribeToWeeklyEmail = functions.https.onCall(async (data, context) => {
  const {email} = data;

  // Validera email
  if (!email || !email.includes("@")) {
    throw new functions.https.HttpsError("invalid-argument", "Ogiltig email-adress");
  }

  try {
    // Spara prenumerationen i Firestore
    await admin.firestore().collection("emailSubscriptions").doc(email).set({
      email: email,
      subscribedAt: admin.firestore.FieldValue.serverTimestamp(),
      type: "weekly_summary",
      active: true,
    });

    // Skicka välkomstmail med Resend
    // OBS: Använder test-email tills svinnstop.app är verifierad
    await resend.emails.send({
      from: "Svinnstop <onboarding@resend.dev>",
      to: email,
      subject: "🎉 Välkommen till Svinnstops veckosammanfattningar!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">🎉 Tack för att du prenumererar!</h1>
          <p>Du kommer nu få veckosammanfattningar varje måndag med:</p>
          <ul>
            <li>🥗 Varor som går ut denna vecka</li>
            <li>🍳 Receptförslag baserat på ditt kylskåp</li>
            <li>💰 Dina besparingar senaste veckan</li>
            <li>📊 Statistik och tips</li>
          </ul>
          <p>Vi ses nästa måndag!</p>
          <p style="color: #666; font-size: 12px;">
            Vill du avsluta? Klicka här: 
            <a href="https://svinnstop.app/unsubscribe?email=${email}">Avsluta prenumeration</a>
          </p>
        </div>
      `,
    });

    return {success: true, message: "Prenumeration registrerad!"};
  } catch (error) {
    console.error("Error subscribing:", error);
    throw new functions.https.HttpsError("internal", "Kunde inte registrera prenumeration");
  }
});

// Cloud Function för att avsluta prenumeration
exports.unsubscribeFromWeeklyEmail = functions.https.onCall(async (data, context) => {
  const {email} = data;

  try {
    await admin.firestore().collection("emailSubscriptions").doc(email).update({
      active: false,
      unsubscribedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {success: true, message: "Prenumeration avslutad"};
  } catch (error) {
    console.error("Error unsubscribing:", error);
    throw new functions.https.HttpsError("internal", "Kunde inte avsluta prenumeration");
  }
});

// Scheduled function som körs varje måndag kl 08:00
exports.sendWeeklyEmails = functions.pubsub
    .schedule("0 8 * * 1") // Varje måndag kl 08:00
    .timeZone("Europe/Stockholm")
    .onRun(async (context) => {
      console.log("Starting weekly email send...");

      try {
        // Hämta alla aktiva prenumerationer
        const subscriptionsSnapshot = await admin.firestore()
            .collection("emailSubscriptions")
            .where("active", "==", true)
            .get();

        const promises = [];

        subscriptionsSnapshot.forEach((doc) => {
          const {email} = doc.data();

          // För varje prenumerant, hämta deras data och skicka personligt email
          // Detta kräver att användare är inloggade och har sin data i Firestore
          // För nu skickar vi ett generiskt email
          const emailPromise = resend.emails.send({
            from: "Svinnstop <onboarding@resend.dev>",
            to: email,
            subject: "📅 Din veckosammanfattning från Svinnstop",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10b981;">📅 Din veckosammanfattning</h1>
                <p>Hej! Här är din sammanfattning för veckan:</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #1f2937; margin-top: 0;">🥗 Varor som går ut denna vecka</h2>
                  <p>Logga in i appen för att se dina specifika varor!</p>
                </div>

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #1f2937; margin-top: 0;">🍳 Receptförslag</h2>
                  <p>Öppna appen för att se receptförslag baserat på ditt kylskåp!</p>
                </div>

                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #1f2937; margin-top: 0;">💰 Dina besparingar</h2>
                  <p>Se din statistik i appen!</p>
                </div>

                <a href="https://svinnstop.app" 
                   style="display: inline-block; background: #10b981; color: white; 
                          padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                          margin: 20px 0;">
                  Öppna Svinnstop
                </a>

                <p style="color: #666; font-size: 12px; margin-top: 40px;">
                  Vill du avsluta? 
                  <a href="https://svinnstop.app/unsubscribe?email=${email}">Avsluta prenumeration</a>
                </p>
              </div>
            `,
          });

          promises.push(emailPromise);
        });

        await Promise.all(promises);
        console.log(`✅ Sent weekly emails to ${promises.length} subscribers`);
      } catch (error) {
        console.error("Error sending weekly emails:", error);
      }

      return null;
    });
