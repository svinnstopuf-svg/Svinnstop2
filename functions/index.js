const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {Resend} = require("resend");
const stripe = require("stripe");
const fetch = require("node-fetch");

admin.initializeApp();

// Initialize Stripe with secret key
const getStripeKey = () => {
  const config = functions.config();
  return (config.stripe && config.stripe.secret_key) || process.env.STRIPE_SECRET_KEY;
};
const stripeClient = stripe(getStripeKey());

// Initialize Resend with API key from Firebase config
const getResendKey = () => {
  const config = functions.config();
  const key = (config.resend && config.resend.api_key) || process.env.RESEND_API_KEY;
  console.log("🔑 Resend API key detected:", key ? "YES (length: " + key.length + ")" : "NO - MISSING!");
  return key;
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
    console.log("📧 Attempting to send welcome email to:", email);

    try {
      const emailResult = await resend.emails.send({
        from: "Svinnstop <noreply@svinnstop.com>",
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
              <a href="https://svinnstop.com/unsubscribe?email=${email}">Avsluta prenumeration</a>
            </p>
          </div>
        `,
      });
      console.log("✅ Email sent successfully:", JSON.stringify(emailResult));
    } catch (emailError) {
      console.error("⚠️ Failed to send welcome email:", emailError);
      console.error("⚠️ Error details:", JSON.stringify(emailError, null, 2));
      // Don't throw - subscription is still saved even if email fails
    }

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
            from: "Svinnstop <noreply@svinnstop.com>",
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

                <a href="https://svinnstop.com" 
                   style="display: inline-block; background: #10b981; color: white; 
                          padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                          margin: 20px 0;">
                  Öppna Svinnstop
                </a>

                <p style="color: #666; font-size: 12px; margin-top: 40px;">
                  Vill du avsluta? 
                  <a href="https://svinnstop.com/unsubscribe?email=${email}">Avsluta prenumeration</a>
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

// ============= STRIPE PAYMENT FUNCTIONS =============

// Stripe Price IDs
const STRIPE_PRICES = {
  individual: "price_1SeFd3D8sKgXsuDAlRaQjmna", // 29 SEK/mån
  family: "price_1SeFfLD8sKgXsuDAMNnARtuo", // 49 SEK/mån
};

// Cloud Function: Skapa Stripe Checkout Session
exports.createCheckoutSession = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    let {userId, email, premiumType} = req.body;

    console.log("📥 Request body:", JSON.stringify(req.body));
    console.log("userId:", userId, "email:", email, "premiumType:", premiumType);

    if (!userId || !premiumType) {
      console.error("❌ Missing fields - userId:", userId, "premiumType:", premiumType);
      res.status(400).json({error: "Missing required fields"});
      return;
    }

    // If email is missing, fetch from Firebase Auth
    if (!email) {
      try {
        const userRecord = await admin.auth().getUser(userId);
        email = userRecord.email;
        console.log("📧 Fetched email from Firebase Auth:", email);
      } catch (authError) {
        console.error("❌ Failed to fetch user email:", authError);
        res.status(400).json({error: "Could not retrieve user email"});
        return;
      }
    }

    // Välj rätt price ID baserat på premiumType
    let priceId;
    const mode = "subscription";

    if (premiumType === "family") {
      // Gamla prenumerationen avbryts i webhook efter lyckat köp
      priceId = STRIPE_PRICES.family;
    } else if (premiumType === "individual") {
      priceId = STRIPE_PRICES.individual;
    } else {
      res.status(400).json({error: "Invalid premiumType"});
      return;
    }

    // Skapa Stripe Checkout Session
    const session = await stripeClient.checkout.sessions.create({
      mode: mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        premiumType: premiumType,
      },
      success_url: "https://svinnstop.web.app/?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://svinnstop.web.app/?payment=cancelled",
      subscription_data: {
        metadata: {
          userId: userId,
          premiumType: premiumType,
        },
      },
    });

    console.log("✅ Checkout session created:", session.id);
    console.log("🔗 Checkout URL:", session.url);
    res.json({url: session.url, sessionId: session.id});
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    res.status(500).json({error: error.message});
  }
});

// Cloud Function: Stripe Webhook
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const config = functions.config();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || (config.stripe && config.stripe.webhook_secret);

  let event;

  try {
    event = stripeClient.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log("📥 Webhook event received:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata.userId || session.client_reference_id;
        const premiumType = session.metadata.premiumType;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const customerEmail = session.customer_email || (session.customer_details && session.customer_details.email);

        console.log("✅ Payment successful for user:", userId);
        console.log("📝 Premium type from metadata:", premiumType);
        console.log("📝 Session metadata:", JSON.stringify(session.metadata));

        // Aktivera premium i Firebase
        const premiumRef = admin.database().ref(`users/${userId}/premium`);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const finalPremiumType = premiumType;

        // Hämta gammal premium data för att kolla om vi behöver avbryta en gammal prenumeration
        const oldPremiumSnap = await premiumRef.once("value");
        const oldPremium = oldPremiumSnap.val() || {};

        // Om användaren köper Family och hade Individual Premium via Stripe - avbryt gamla
        if (finalPremiumType === "family" &&
            oldPremium.premiumType === "individual" &&
            oldPremium.subscriptionId &&
            oldPremium.source === "stripe" &&
            oldPremium.subscriptionId !== subscriptionId) {
          try {
            await stripeClient.subscriptions.cancel(oldPremium.subscriptionId);
            console.log("✅ Cancelled old Individual subscription:", oldPremium.subscriptionId);
          } catch (cancelErr) {
            console.error("⚠️ Failed to cancel old subscription:", cancelErr);
          }
        }

        await premiumRef.set({
          active: true,
          lifetimePremium: false,
          premiumUntil: expiryDate.toISOString(),
          premiumType: finalPremiumType,
          source: "stripe",
          stripeCustomerId: customerId,
          subscriptionId: subscriptionId,
          lastUpdated: new Date().toISOString(),
        });

        console.log("✅ Premium activated for user:", userId);

        // Skicka bekräftelse-email med Resend
        if (customerEmail) {
          console.log("📧 Attempting to send confirmation email to:", customerEmail);
          console.log("📧 Resend instance exists:", !!resend);
          console.log("📧 Resend.emails exists:", !!(resend && resend.emails));

          try {
            const planName = finalPremiumType === "family" ? "Family Premium" : "Individual Premium";
            const price = finalPremiumType === "family" ? "49" : "29";

            console.log("📧 Preparing to send email with payload...");

            const emailResult = await resend.emails.send({
              from: "Svinnstop <noreply@svinnstop.com>",
              to: customerEmail,
              subject: `🎉 Tack för ditt köp av ${planName}!`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #10b981;">🎉 Välkommen till Svinnstop Premium!</h1>
                  <p>Tack för att du valde ${planName}!</p>
                  
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #1f2937; margin-top: 0;">Din prenumeration</h2>
                    <p><strong>Plan:</strong> ${planName}</p>
                    <p><strong>Pris:</strong> ${price} kr/månad</p>
                    <p><strong>Nästa betalning:</strong> ${expiryDate.toLocaleDateString("sv-SE")}</p>
                  </div>

                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #1f2937; margin-top: 0;">✨ Vad du får tillgång till:</h2>
                    <ul>
                      <li>AI-genererade recept från dina ingredienser</li>
                      <li>Obegränsat antal varor i kylskåpet</li>
                      ${finalPremiumType === "family" ? "<li>Familjesynkronisering (upp till 5 medlemmar)</li>" : ""}
                      <li>Avancerad statistik & miljöpåverkan</li>
                      <li>25+ Achievements & badges</li>
                      <li>Topplista</li>
                      <li>Push-notifikationer</li>
                    </ul>
                  </div>

                  <a href="https://svinnstop.com" 
                     style="display: inline-block; background: #10b981; color: white; 
                            padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                            margin: 20px 0;">
                    Öppna Svinnstop
                  </a>

                  <p style="color: #666; font-size: 12px; margin-top: 40px;">
                    <strong>Hantera din prenumeration:</strong><br>
                    Du kan avsluta eller ändra din prenumeration när som helst via din profil i appen.
                  </p>
                  
                  <p style="color: #666; font-size: 12px;">
                    Frågor? Kontakta oss på svinnstopuf@gmail.com
                  </p>
                </div>
              `,
            });

            console.log("✅ Confirmation email sent successfully!");
            console.log("✅ Email ID:", emailResult.data ? emailResult.data.id : "N/A");
            console.log("✅ Full response:", JSON.stringify(emailResult, null, 2));
          } catch (emailError) {
            console.error("❌ CRITICAL: Failed to send confirmation email");
            console.error("❌ Error message:", emailError.message);
            console.error("❌ Error stack:", emailError.stack);
            console.error("❌ Error name:", emailError.name);
            const errorProps = Object.getOwnPropertyNames(emailError);
            console.error("❌ Full error object:", JSON.stringify(emailError, errorProps, 2));
            // Don't fail the webhook if email fails
          }
        }

        // If user bought Family Premium, set premium on their family
        console.log("👨‍👩‍👧‍👦 Checking if should set family premium. finalPremiumType:", finalPremiumType);
        if (finalPremiumType === "family") {
          console.log("👨‍👩‍👧‍👦 User bought Family Premium - searching for their family...");
          try {
            // Find user's family by searching all families for this userId
            const familiesRef = admin.database().ref("families");
            const familiesSnapshot = await familiesRef.once("value");
            console.log("👨‍👩‍👧‍👦 Families snapshot exists:", familiesSnapshot.exists());

            if (familiesSnapshot.exists()) {
              const families = familiesSnapshot.val();
              let userFamilyId = null;

              // Search through all families for this userId
              for (const familyId in families) {
                if (Object.prototype.hasOwnProperty.call(families, familyId)) {
                  const family = families[familyId];
                  if (family.members) {
                    for (const memberId in family.members) {
                      if (Object.prototype.hasOwnProperty.call(family.members, memberId)) {
                        const member = family.members[memberId];
                        if (member.userId === userId) {
                          userFamilyId = familyId;
                          break;
                        }
                      }
                    }
                  }
                  if (userFamilyId) break;
                }
              }

              if (userFamilyId) {
                // User is in a family - set family premium
                const familyPremiumRef = admin.database().ref(`families/${userFamilyId}/premium`);
                await familyPremiumRef.set({
                  active: true,
                  premiumType: "family",
                  premiumUntil: expiryDate.toISOString(),
                  source: "stripe",
                  ownerId: userId,
                  lastUpdated: new Date().toISOString(),
                });

                console.log("✅ Family premium activated for family:", userFamilyId);
              } else {
                console.log("ℹ️ User bought Family Premium but is not in a family yet");
              }
            }
          } catch (familyError) {
            console.error("❌ Failed to set family premium:", familyError);
            // Don't fail the whole webhook - user still has individual premium
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        // Hitta användare baserat på Stripe customer ID
        const usersRef = admin.database().ref("users");
        const snapshot = await usersRef.orderByChild("premium/stripeCustomerId").equalTo(customerId).once("value");

        if (snapshot.exists()) {
          const userId = Object.keys(snapshot.val())[0];
          const premiumRef = admin.database().ref(`users/${userId}/premium`);
          const currentPremium = (await premiumRef.once("value")).val() || {};

          // Hämta prenumerationens faktiska förfallodatum från Stripe
          let premiumUntil;
          if (subscriptionId) {
            try {
              const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
              // current_period_end är Unix timestamp i sekunder
              premiumUntil = new Date(subscription.current_period_end * 1000).toISOString();
              console.log("📅 Stripe subscription end date:", premiumUntil);
            } catch (err) {
              console.error("⚠️ Could not fetch subscription, using +30 days:", err);
              const newExpiry = new Date();
              newExpiry.setDate(newExpiry.getDate() + 30);
              premiumUntil = newExpiry.toISOString();
            }
          } else {
            // Fallback: lägg till 30 dagar
            const newExpiry = new Date();
            newExpiry.setDate(newExpiry.getDate() + 30);
            premiumUntil = newExpiry.toISOString();
          }

          await premiumRef.update({
            active: true,
            premiumUntil: premiumUntil,
            lastUpdated: new Date().toISOString(),
          });

          console.log("✅ Premium renewed for user:", userId, "until", premiumUntil);

          // Om det är Family Premium, uppdatera även familjens premium
          if (currentPremium.premiumType === "family") {
            try {
              const familiesRef = admin.database().ref("families");
              const familiesSnapshot = await familiesRef.once("value");

              if (familiesSnapshot.exists()) {
                const families = familiesSnapshot.val();
                let userFamilyId = null;

                for (const familyId in families) {
                  if (Object.prototype.hasOwnProperty.call(families, familyId)) {
                    const family = families[familyId];
                    if (family.members) {
                      for (const memberId in family.members) {
                        if (Object.prototype.hasOwnProperty.call(family.members, memberId)) {
                          const member = family.members[memberId];
                          if (member.userId === userId) {
                            userFamilyId = familyId;
                            break;
                          }
                        }
                      }
                    }
                    if (userFamilyId) break;
                  }
                }

                if (userFamilyId) {
                  const familyPremiumRef = admin.database().ref(`families/${userFamilyId}/premium`);
                  await familyPremiumRef.update({
                    active: true,
                    premiumUntil: premiumUntil,
                    lastUpdated: new Date().toISOString(),
                  });
                  console.log("✅ Family premium renewed for family:", userFamilyId);
                }
              }
            } catch (familyError) {
              console.error("❌ Failed to update family premium on renewal:", familyError);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        // Hitta användare
        const usersRef = admin.database().ref("users");
        const snapshot = await usersRef.orderByChild("premium/stripeCustomerId").equalTo(customerId).once("value");

        if (snapshot.exists()) {
          const userId = Object.keys(snapshot.val())[0];
          const premiumRef = admin.database().ref(`users/${userId}/premium`);
          const currentPremium = (await premiumRef.once("value")).val() || {};

          // Om det var Family Premium, ta bort family premium också
          if (currentPremium.premiumType === "family") {
            try {
              const familiesRef = admin.database().ref("families");
              const familiesSnapshot = await familiesRef.once("value");

              if (familiesSnapshot.exists()) {
                const families = familiesSnapshot.val();
                let userFamilyId = null;

                for (const familyId in families) {
                  if (Object.prototype.hasOwnProperty.call(families, familyId)) {
                    const family = families[familyId];
                    if (family.members) {
                      for (const memberId in family.members) {
                        if (Object.prototype.hasOwnProperty.call(family.members, memberId)) {
                          const member = family.members[memberId];
                          if (member.userId === userId) {
                            userFamilyId = familyId;
                            break;
                          }
                        }
                      }
                    }
                    if (userFamilyId) break;
                  }
                }

                if (userFamilyId) {
                  // Ta bort family premium helt
                  const familyPremiumRef = admin.database().ref(`families/${userFamilyId}/premium`);
                  await familyPremiumRef.remove();
                  console.log("✅ Family premium removed for family:", userFamilyId);
                }
              }
            } catch (familyError) {
              console.error("❌ Failed to remove family premium:", familyError);
            }
          }

          // Avaktivera Stripe premium, men behåll referral premium om det finns
          if (currentPremium.source === "stripe") {
            await premiumRef.update({
              active: false,
              premiumUntil: null,
              subscriptionId: null,
              stripeCustomerId: null,
              premiumType: null,
              source: null,
              lastUpdated: new Date().toISOString(),
            });
            console.log("✅ Stripe premium cancelled for user:", userId);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({received: true});
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).send("Webhook processing failed");
  }
});

// Cloud Function: Skapa Stripe Customer Portal Session (för att hantera prenumeration)
exports.createPortalSession = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  try {
    const {userId} = req.body;

    if (!userId) {
      res.status(400).json({error: "Missing userId"});
      return;
    }

    // Hämta användarens Stripe customer ID
    const premiumRef = admin.database().ref(`users/${userId}/premium`);
    const snapshot = await premiumRef.once("value");
    const premiumData = snapshot.val();

    if (!premiumData || !premiumData.stripeCustomerId) {
      res.status(404).json({error: "No Stripe subscription found"});
      return;
    }

    // Skapa Customer Portal session
    const session = await stripeClient.billingPortal.sessions.create({
      customer: premiumData.stripeCustomerId,
      return_url: "https://svinnstop.web.app/?from=billing",
    });

    console.log("✅ Customer portal session created for user:", userId);
    res.json({url: session.url});
  } catch (error) {
    console.error("❌ Error creating portal session:", error);
    res.status(500).json({error: error.message});
  }
});

// ============= AI RECIPE GENERATION =============

// Get OpenAI API key
const getOpenAIKey = () => {
  const config = functions.config();
  return (config.openai && config.openai.api_key) || process.env.OPENAI_API_KEY;
};

// Cloud Function: Generate AI Recipe
exports.generateAIRecipe = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const openaiKey = getOpenAIKey();
  if (!openaiKey) {
    console.error("❌ OpenAI API key not configured");
    res.status(500).json({error: "OpenAI API key not configured"});
    return;
  }

  try {
    const {selectedIngredients, preferences, ingredientMode = "staples"} = req.body;

    if (!selectedIngredients || selectedIngredients.length === 0) {
      res.status(400).json({error: "No ingredients provided"});
      return;
    }

    // Format ingredients for prompt
    const ingredientsList = selectedIngredients
        .map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`)
        .join("\n");

    // Build ingredient instruction based on mode
    let ingredientInstruction = "";
    if (ingredientMode === "strict") {
      ingredientInstruction = `### INGREDIENSREGLER (STRICT MODE - ABSOLUT STRIKT)
- Använd ENDAST OCH EXAKT de listade ingredienserna nedan
- Du får ENDAST lägg till: vatten, salt
- INGA andra ingredienser är tillåtna (inte ens peppar, olja, smör, lök eller vitlök)
- Använd ingrediensernas EXAKTA namn - blanda INTE ihop liknande ingredienser
- Exempel: Om "vitlöksbröd" finns i listan, använd INTE "vitlök" istället
- Om ingredienserna inte räcker för en måltid, skapa ett tillbehör/snacks och ` +
      `lägg till "warning": "Begränsade ingredienser - ` +
      `detta är ett enkelt tillbehör" i JSON-svaret`;
    } else if (ingredientMode === "staples") {
      ingredientInstruction = `### INGREDIENSREGLER (STAPLES MODE - ENDAST BASVAROR)
- Använd ALLA listade ingredienser nedan som huvudingredienser
- Du får ENDAST lägga till dessa basvaror: salt, peppar, svartpeppar, olivolja, ` +
      `rapsolja, smör, vitlök, gul lök, röd lök, mjöl, vetemjöl, socker, vatten
- INGA andra ingredienser (kött, grönsaker, mejeriprodukter utom smör) får läggas till
- Använd ingrediensernas EXAKTA namn - blanda INTE ihop liknande ingredienser
- Exempel: Om "vitlöksbröd" finns i listan, använd INTE "vitlök" istället
- Om ingredienserna inte räcker för en måltid, skapa ett tillbehör/snacks och ` +
      `lägg till "warning": "Begränsade ingredienser - ` +
      `detta är ett enkelt tillbehör" i JSON-svaret`;
    } else if (ingredientMode === "creative") {
      ingredientInstruction = `### INGREDIENSREGLER (CREATIVE MODE - KREATIV FRIHET)
- Använd ALLA listade ingredienser nedan som bas
- Du får föreslå MAX 3 extra ingredienser för att förbättra receptet
- Markera extra ingredienser med "optional": true i ingredients-arrayen
- Använd ingrediensernas EXAKTA namn - blanda INTE ihop liknande ingredienser
- Exempel: Om "vitlöksbröd" finns i listan, använd INTE "vitlök" istället
- Om ingredienserna inte räcker för en måltid, skapa ett tillbehör/snacks och ` +
      `lägg till "warning": "Begränsade ingredienser - ` +
      `detta är ett enkelt tillbehör" i JSON-svaret`;
    }

    const prompt = `### PERSONA
Du är en Michelin-utbildad kock med expertis inom nordiskt kök och näringslara. 
Du skapar professionella, genomförbara recept på svenska med exakt näringsinformation.

### INPUT
Tillgängliga ingredienser:
${ingredientsList}
${preferences.cuisine ? `\nKökstyp: ${preferences.cuisine}` : ""}
${preferences.difficulty ? `Svårighetsgrad: ${preferences.difficulty}` : ""}
${preferences.time ? `Maximal tid: ${preferences.time} minuter` : ""}

${ingredientInstruction}

### KVALITETSKRAV
1. **Smakbalans**: Receptet måste ha perfekt balans mellan salt, syra, sötma och umami
2. **Teknik**: Använd rätt tillagningsmetoder för varje ingrediens
3. **Presentation**: Inkludera tips för professionell presentation
4. **Precision**: Exakta mängder och tider - inga uppskattningar
5. **Säkerhet**: Kontrollera att kötttemperaturer och tillagningstider är säkra

### OUTPUT-KRAV
Skapa ett restaurangkvalitet recept och svara med följande JSON-struktur:
{
  "name": "Kreativt och appetitretande receptnamn på svenska",
  "description": "Professionell beskrivning som får munnen att vattnas (2-3 meningar)",
  "servings": 2,
  "prepTime": "XX min" (exakt tid),
  "cookTime": "XX min" (exakt tid),
  "difficulty": "Lätt|Medel|Avancerad",
  "ingredients": [
    {
      "item": "ingrediens med specifik typ (t.ex. 'olivolja extra virgin')",
      "amount": "exakt mängd med enhet",
      "optional": false
    }
  ],
  "instructions": [
    "Detaljerat steg med exakta temperaturer, tider och tekniker",
    "Nästa steg med professionella kökstekniker..."
  ],
  "nutrition": {
    "calories": "XXX kcal" (BERÄKNA EXAKT - se nedan),
    "protein": "XX g" (BERÄKNA EXAKT),
    "carbs": "XX g" (BERÄKNA EXAKT),
    "fat": "XX g" (BERÄKNA EXAKT)
  },
  "tips": [
    "Professionellt kökstips för bästa resultat",
    "Lagringstips och hållbarhet",
    "Presentationstips för restaurangkänsla"
  ],
  "warning": null
}

### NÄRINGSINFORMATION - EXAKTA BERÄKNINGAR
BERÄKNA näringsinformationen EXAKT för HELA receptet först, dela sedan med portioner:

Använd dessa standardvärden per 100g:
- Kött (kyckling): 165 kcal, 31g protein, 0g carbs, 3.6g fat
- Kött (nöt): 250 kcal, 26g protein, 0g carbs, 15g fat
- Fisk (lax): 208 kcal, 20g protein, 0g carbs, 13g fat
- Fisk (torsk): 82 kcal, 18g protein, 0g carbs, 0.7g fat
- Ägg (1 st, 50g): 72 kcal, 6g protein, 0.4g carbs, 5g fat
- Pasta (torr): 350 kcal, 12g protein, 70g carbs, 1.5g fat
- Ris (torr): 365 kcal, 7g protein, 80g carbs, 0.6g fat
- Potatis: 77 kcal, 2g protein, 17g carbs, 0.1g fat
- Tomat: 18 kcal, 0.9g protein, 3.9g carbs, 0.2g fat
- Lök: 40 kcal, 1.1g protein, 9g carbs, 0.1g fat
- Vitlök: 149 kcal, 6.4g protein, 33g carbs, 0.5g fat
- Olivolja: 884 kcal, 0g protein, 0g carbs, 100g fat
- Smör: 717 kcal, 0.9g protein, 0.1g carbs, 81g fat
- Grädde (40%): 400 kcal, 2.2g protein, 3.2g carbs, 40g fat
- Mjölk: 42 kcal, 3.4g protein, 5g carbs, 1g fat
- Ost (hård): 402 kcal, 25g protein, 1.3g carbs, 33g fat
- Bröd (fullkorn): 247 kcal, 13g protein, 41g carbs, 3.4g fat

EXEMPEL-BERÄKNING (2 portioner pasta carbonara):
- 200g pasta: 700 kcal, 24g protein, 140g carbs, 3g fat
- 2 ägg: 144 kcal, 12g protein, 0.8g carbs, 10g fat
- 50g bacon: 541 kcal, 37g protein, 1.4g carbs, 42g fat
- 50g parmesan: 201 kcal, 12.5g protein, 0.7g carbs, 16.5g fat
- 20g olivolja: 177 kcal, 0g protein, 0g carbs, 20g fat
TOTALT: 1763 kcal, 85.5g protein, 142.9g carbs, 91.5g fat
PER PORTION (/ 2): 882 kcal, 43g protein, 71g carbs, 46g fat

VÄRDEN MÅSTE:
- Vara EXAKTA tal (inte intervall)
- Summera ALLA ingredienser
- Delas med antal portioner
- Vara LOGISKA (hög-fett = hög kalorier, etc)
- VARIERA mellan olika recept (inte alltid samma värden)

Om ingredienserna är otillräckliga för en hel måltid, ` +
    `skapa ett gourmet-tillbehör/förrätt och sätt "warning" till en elegant förklarande text.`;

    // Call OpenAI API with JSON mode
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Du är en Michelin-utbildad kock med expertis inom näringslara. " +
              "Du skapar restaurangkvalitet recept på svenska med exakta näringsberäkningar. " +
              "Du svarar alltid med perfekt strukturerad JSON med EXAKTA numeriska värden " +
              "(inga intervall eller uppskattningar). Varje recept är unikt och professionellt.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {type: "json_object"},
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ OpenAI API error:", errorData);
      const errorMessage = (errorData.error && errorData.error.message) || "OpenAI API error";
      res.status(response.status).json({error: errorMessage});
      return;
    }

    const data = await response.json();
    const recipeText = data.choices[0].message.content.trim();

    // Parse JSON directly (no regex needed with JSON mode)
    let recipe;
    try {
      recipe = JSON.parse(recipeText);
    } catch (parseError) {
      console.error("❌ Failed to parse JSON from OpenAI:", parseError);
      console.error("❌ Raw response:", recipeText);
      res.status(500).json({error: "Could not parse recipe from AI"});
      return;
    }

    // Validate required fields
    const requiredFields = ["name", "description", "servings", "prepTime", "cookTime",
      "difficulty", "ingredients", "instructions", "nutrition", "tips"];
    const missingFields = requiredFields.filter((field) => !(field in recipe));
    if (missingFields.length > 0) {
      console.error("❌ Missing required fields:", missingFields);
      res.status(500).json({error: `AI response missing fields: ${missingFields.join(", ")}`});
      return;
    }

    // Add metadata
    recipe.id = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    recipe.source = "AI-genererat";
    recipe.isAI = true;
    recipe.createdAt = Date.now();
    recipe.usedIngredients = selectedIngredients;

    // Ensure warning field exists (null if not set)
    if (!recipe.warning) {
      recipe.warning = null;
    }

    console.log("✅ Recipe generated:", recipe.name);
    if (recipe.warning) {
      console.log("⚠️ Warning:", recipe.warning);
    }
    res.json({success: true, recipe: recipe});
  } catch (error) {
    console.error("❌ Error generating AI recipe:", error);
    res.status(500).json({error: error.message || "Failed to generate recipe"});
  }
});

// ============= CLEANUP FUNCTIONS =============
const {cleanPremiumData} = require("./cleanPremium");
exports.cleanPremiumData = cleanPremiumData;
