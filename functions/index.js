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
    console.log("📧 Attempting to send welcome email to:", email);

    try {
      const emailResult = await resend.emails.send({
        from: "Svinnstop <noreply@svinnstop.app>",
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
            from: "Svinnstop <noreply@svinnstop.app>",
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

// ============= STRIPE PAYMENT FUNCTIONS =============

// Stripe Price IDs
const STRIPE_PRICES = {
  individual: "price_1SeFd3D8sKgXsuDAlRaQjmna", // 29 SEK/mån
  family: "price_1SeFfLD8sKgXsuDAMNnARtuo", // 49 SEK/mån
  family_upgrade: "price_1SeFgND8sKgXsuDATGb7Affr", // 20 SEK/mån
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

    // Hämta användarens nuvarande premium status
    const userRef = admin.database().ref(`users/${userId}/premium`);
    const snapshot = await userRef.once("value");
    const currentPremium = snapshot.val() || {};

    // Välj rätt price ID baserat på premiumType och current status
    let priceId;
    const mode = "subscription";

    if (premiumType === "family_upgrade" || premiumType === "family") {
      // Om användaren redan har Individual Premium (referral eller Stripe)
      if (currentPremium.premiumType === "individual" && currentPremium.active) {
        priceId = STRIPE_PRICES.family_upgrade;
      } else {
        priceId = STRIPE_PRICES.family;
      }
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

        console.log("✅ Payment successful for user:", userId);

        // Aktivera premium i Firebase
        const premiumRef = admin.database().ref(`users/${userId}/premium`);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        const finalPremiumType = premiumType === "family_upgrade" ? "family" : premiumType;

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

        // If user bought Family Premium, set premium on their family
        if (finalPremiumType === "family") {
          try {
            // Find user's family
            const familiesRef = admin.database().ref("families");
            const familySnapshot = await familiesRef.orderByChild(`members/${userId}`).once("value");

            if (familySnapshot.exists()) {
              // User is in a family - set family premium
              const families = familySnapshot.val();
              const familyId = Object.keys(families)[0];

              const familyPremiumRef = admin.database().ref(`families/${familyId}/premium`);
              await familyPremiumRef.set({
                active: true,
                premiumType: "family",
                premiumUntil: expiryDate.toISOString(),
                source: "stripe",
                ownerId: userId,
                lastUpdated: new Date().toISOString(),
              });

              console.log("✅ Family premium activated for family:", familyId);
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

        // Hitta användare baserat på Stripe customer ID
        const usersRef = admin.database().ref("users");
        const snapshot = await usersRef.orderByChild("premium/stripeCustomerId").equalTo(customerId).once("value");

        if (snapshot.exists()) {
          const userId = Object.keys(snapshot.val())[0];
          const premiumRef = admin.database().ref(`users/${userId}/premium`);
          const currentPremium = (await premiumRef.once("value")).val() || {};

          // Förnya premium med 30 dagar
          const currentExpiry = currentPremium.premiumUntil ? new Date(currentPremium.premiumUntil) : new Date();
          const newExpiry = currentExpiry > new Date() ? currentExpiry : new Date();
          newExpiry.setDate(newExpiry.getDate() + 30);

          await premiumRef.update({
            active: true,
            premiumUntil: newExpiry.toISOString(),
            lastUpdated: new Date().toISOString(),
          });

          console.log("✅ Premium renewed for user:", userId);
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

          // Avaktivera Stripe premium, men behåll referral premium om det finns
          if (currentPremium.source === "stripe") {
            await premiumRef.update({
              active: false,
              premiumUntil: null,
              subscriptionId: null,
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
      ingredientInstruction = `### INGREDIENSREGLER (STRICT MODE)
- Använd ENDAST de listade ingredienserna nedan
- Du får ENDAST lägga till: vatten, salt
- INGA andra ingredienser är tillåtna (inte ens peppar, olja eller lök)
- Om ingredienserna inte räcker för en måltid, skapa ett tillbehör/snacks och ` +
      `lägg till "warning": "Begränsade ingredienser - ` +
      `detta är ett enkelt tillbehör" i JSON-svaret`;
    } else if (ingredientMode === "staples") {
      ingredientInstruction = `### INGREDIENSREGLER (STAPLES MODE)
- Använd ALLA listade ingredienser nedan som huvudingredienser
- Du får lägga till vanliga basvaror: salt, peppar, olja, smör, vitlök, lök, mjöl, socker
- INGA andra huvudingredienser (kött, grönsaker, mejeriprodukter) får läggas till
- Om ingredienserna inte räcker för en måltid, skapa ett tillbehör/snacks och ` +
      `lägg till "warning": "Begränsade ingredienser - ` +
      `detta är ett enkelt tillbehör" i JSON-svaret`;
    } else if (ingredientMode === "creative") {
      ingredientInstruction = `### INGREDIENSREGLER (CREATIVE MODE)
- Använd ALLA listade ingredienser nedan som bas
- Du får föreslå MAX 3 extra ingredienser för att förbättra receptet
- Markera extra ingredienser med "optional": true i ingredients-arrayen
- Om ingredienserna inte räcker för en måltid, skapa ett tillbehör/snacks och ` +
      `lägg till "warning": "Begränsade ingredienser - ` +
      `detta är ett enkelt tillbehör" i JSON-svaret`;
    }

    const prompt = `### PERSONA
Du är en professionell kock som skapar praktiska, genomförbara recept på svenska.

### INPUT
Tillgängliga ingredienser:
${ingredientsList}
${preferences.cuisine ? `\nKökstyp: ${preferences.cuisine}` : ""}
${preferences.difficulty ? `Svårighetsgrad: ${preferences.difficulty}` : ""}
${preferences.time ? `Maximal tid: ${preferences.time} minuter` : ""}

${ingredientInstruction}

### OUTPUT-KRAV
Skapa ett unikt recept och svara med följande JSON-struktur:
{
  "name": "Receptnamn på svenska",
  "description": "Kort lockande beskrivning (1-2 meningar)",
  "servings": 2,
  "prepTime": "15 min",
  "cookTime": "20 min",
  "difficulty": "Lätt|Medel|Avancerad",
  "ingredients": [
    {"item": "ingrediens", "amount": "mängd", "optional": false}
  ],
  "instructions": [
    "Steg 1 med tydliga instruktioner",
    "Steg 2..."
  ],
  "nutrition": {
    "calories": "[BERÄKNA baserat på ingredienser] kcal",
    "protein": "[BERÄKNA] g",
    "carbs": "[BERÄKNA] g",
    "fat": "[BERÄKNA] g"
  },
  "tips": ["Praktiskt tips 1", "Praktiskt tips 2"],
  "warning": null
}

### NÄRINGSINFORMATION
BERÄKNA näringsinformationen baserat på de faktiska ingredienserna och deras mängder.
Använd uppskattade näringsvärden för varje ingrediens och summera för hela receptet.
Dela sedan med antalet portioner för att få värden per portion.
Se till att värdena är RIMLIGA och VARIERAR baserat på ingredienserna.

Om ingredienserna är otillräckliga för en hel måltid, ` +
    `skapa ett tillbehör/snacks och sätt "warning" till en förklarande text.`;

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
            content: "Du är en professionell kock som skapar kreativa och " +
              "genomförbara recept på svenska. Du svarar alltid med välstrukturerad JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {type: "json_object"},
        temperature: 0.5,
        max_tokens: 1500,
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
