# Stripe Integration Plan - Uppdaterad för Family Upgrade Pricing

## Prissättning (Uppdaterad)

### Produkter i Stripe Dashboard:
1. **Svinnstop Individual Premium** - 29 kr/mån (recurring)
   - Price ID: `price_individual` (kommer från Stripe)
   
2. **Svinnstop Family Premium** - 49 kr/mån (recurring)
   - Price ID: `price_family` (kommer från Stripe)
   
3. **Svinnstop Family Upgrade** - 20 kr/mån (recurring)
   - Price ID: `price_family_upgrade` (kommer från Stripe)
   - För användare som redan har Individual Premium

### Pricing Logic:

**Scenario 1: Ingen Premium**
- Individual: 29 kr/mån
- Family: 49 kr/mån

**Scenario 2: Har Individual Premium (Stripe eller Referral)**
- Family Upgrade: +20 kr/mån
- Efter referral tar slut: 49 kr/mån total

**Scenario 3: Lifetime Individual Premium (50 referrals)**
- Family Upgrade: 20 kr/mån för alltid
- Individual förblir gratis

**Scenario 4: Har redan Family Premium**
- Ingen uppgradering möjlig

## Cloud Functions

### createCheckoutSession
```javascript
Input:
- userId (string)
- email (string)  
- premiumType ('individual' | 'family' | 'family_upgrade')

Output:
- sessionId (string)

Logic:
1. Hämta användarens nuvarande premium status från Firebase
2. Välj rätt Stripe price_id baserat på premiumType och current status
3. Om family_upgrade + lifetimePremium → använd price_family_upgrade
4. Om family_upgrade + tidsbegränsad premium → använd price_family_upgrade (övergår till full 49kr senare)
5. Skapa Stripe Checkout Session
6. Success URL: https://svinnstop.web.app/premium/success?session_id={CHECKOUT_SESSION_ID}
7. Cancel URL: https://svinnstop.web.app/premium/cancel
```

### stripeWebhook
```javascript
Events att hantera:
1. checkout.session.completed
   - Aktivera premium första gången
   - Sätt stripeCustomerId och subscriptionId i Firebase
   - Sätt premiumType ('individual', 'family', 'family_upgrade')

2. invoice.paid
   - Förnya premium (lägg till 30 dagar)
   - Om family_upgrade + referral premium har tagit slut → uppgradera till full family (49kr)

3. customer.subscription.deleted
   - Avaktivera Stripe premium
   - Behåll referral premium om det finns

4. customer.subscription.updated
   - Hantera plan-ändringar (upgrade/downgrade)
```

## Firebase Data Structure

```
users/{uid}/premium {
  active: boolean
  lifetimePremium: boolean
  premiumUntil: timestamp
  premiumType: 'individual' | 'family'
  source: 'referral' | 'stripe'
  stripeCustomerId: string
  subscriptionId: string
  stripePriceId: string  // För att veta vilken plan
  lastUpdated: timestamp
}
```

## Implementation Steps

### ✅ KLAR
1. [x] Installerat @stripe/stripe-js
2. [x] Skapat StripeCheckout.jsx
3. [x] Skapat familyPremiumService.js för pricing logic
4. [x] Uppdaterat referralService att sätta premiumType: 'individual'
5. [x] Installerat stripe i functions/

### 🚧 ÅTERSTÅR
6. [ ] Lägg till Stripe Cloud Functions i functions/index.js
7. [ ] Skapa .env fil med Stripe test keys
8. [ ] Integrera StripeCheckout i UpgradeModal.jsx
9. [ ] Skapa PremiumSuccess.jsx och PremiumCancel.jsx
10. [ ] Sätt upp produkter i Stripe Dashboard (test mode)
11. [ ] Testa hela flödet med test cards
12. [ ] Deploy till Firebase

## Test Mode Setup

När du skapar Stripe-konto:
1. Stanna i Test Mode
2. Skapa 3 produkter med recurring pricing (29, 49, 20 kr/mån)
3. Kopiera test publishable key → .env
4. Kopiera test secret key → Firebase functions config
5. Sätt webhook URL: https://us-central1-svinnstop.cloudfunctions.net/stripeWebhook
6. Testa med test card: 4242 4242 4242 4242

## Production Activation (När du har bankkonto)

1. I Stripe Dashboard: Aktivera live mode
2. Kopiera live publishable key → .env (byt ut test key)
3. Kopiera live secret key → Firebase functions config
4. Uppdatera webhook URL till production
5. Deploy med nya keys
6. Ta bort "TEST MODE" notice i StripeCheckout.jsx

## Notes

- Alla priser i SEK (Svenska kronor)
- Recurring monthly subscriptions
- Användare kan avsluta när som helst
- Family upgrade behåller användarens referral premium om aktiv
- Lifetime Individual + Family Upgrade = 20kr/mån för alltid
