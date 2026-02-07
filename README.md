# 🍽️ Svinnstop

**Svinnstop** är en modern webbapp för att minska matsvinn genom smart spårning av utgångsdatum och AI-genererade receptförslag. Appen hjälper dig att hålla koll på dina matvaror, få påminnelser när de närmar sig utgångsdatum, och föreslår recept baserat på vad du har hemma.

🌐 **Live App:** [svinnstop.web.app](https://svinnstop.web.app)

## 🆕 Nytt i senaste versionen

- 🔄 **Fullständig cross-device sync** - Alla ändringar synkas realtid mellan alla dina enheter
- 👥 **Familjegrupper** - Dela kylskåp och inköpslista med familjen
- 🔒 **Säker autentisering** - Email/Google login (anonym auth borttaget)
- ⚖️ **GDPR-compliant** - Fullständiga användarvillkor och integritetspolicy
- 💾 **Smart datamigration** - Lokal data migreras automatiskt till molnet vid första inloggning
- 🎯 **Achievement system** - Lås upp utmärkelser för räddad mat
- 🏆 **Topplista** - Tävla med vänner om minst matsvinn
- 💰 **Besparingsstatistik** - Se hur mycket pengar du sparat
- 🎁 **Referralprogram** - Få gratis Premium genom att bjuda in vänner

## ✨ Funktioner

### 👤 Användarkonton & Synkning
- 🔐 **Email/Google login** - Säker autentisering med Firebase
- 🔄 **Realtidssynkning** - Alla ändringar synkas omedelbart mellan enheter
- 👥 **Familjegrupper** - Dela kylskåp och inköpslista med upp till 6 familjemedlemmar
- 💾 **Smart migration** - Lokal data flyttas automatiskt till molnet vid första login
- 🔒 **GDPR-compliant** - Fullständiga användarvillkor och integritetspolicy tillgängliga innan signup

### 🍽️ Kylskåpshantering
- 📝 **Spåra matvaror** - Lägg till varor med namn, antal och utgångsdatum
- 🤖 **AI-förslag** - Automatiska förslag för utgångsdatum baserat på varutyp
- 🎨 **Färgkodning** - Grön (över 3 dagar), Gul (1-3 dagar), Röd (utgånget)
- ⏰ **Smart sortering** - Varor sorteras automatiskt efter snarast utgångsdatum
- 🔍 **Filtrering & sökning** - Filtrera på status och sök efter varor
- ↩️ **Ångra-funktion** - Ångra borttagningar med en knapptryckning

### 🛒 Inköpslista & Recept
- ✅ **Smart inköpslista** - Planera inköp och bocka av när klart
- 🍳 **Receptförslag** - Automatiska receptförslag baserat på ditt kylskåp
- 🤖 **AI-receptgenerering** - Generera anpassade recept med OpenAI GPT-4
- 📚 **150+ svenska recept** - Inbyggd databas med klassiska och moderna recept
- 💾 **Spara recept** - Spara dina favorit AI-recept för senare

### 🎮 Gamification & Community
- 🏆 **Topplista** - Tävla med vänner om minst matsvinn
- 🎯 **21 Achievements** - Lås upp utmärkelser (Nybörjare → Svinnstoppare → Legend)
- 📈 **Daily streak** - Håll igång din streak genom att logga in varje dag
- 💰 **Besparingsstatistik** - Se exakt hur mycket mat och pengar du sparat
- 🎁 **Referralprogram** - Få gratis Premium (1 vän = 1 vecka, 50 vänner = livstid!)

### 💎 Premium-funktioner
- ♾️ **Obegränsat antal varor** (gratis = max 15)
- 🤖 **AI-receptgenerator** med GPT-4
- 🔔 **Push-notifikationer** för utgående varor
- 🚫 **Ingen reklam**
- 📊 **Utökad statistik** och insights
- 👨‍👩‍👧‍👦 **Family Premium** - Dela premium med upp till 6 familjemedlemmar (49 kr/mån)

### 🛠️ Övriga funktioner
- 📱 **PWA-stöd** - Installera som app på mobil och desktop
- 🌙 **Mörkt tema** - Modern och ögonvänlig design
- ❓ **FAQ & Support** - Hjälpcenter med vanliga frågor

## 🚀 Kom igång

### Krav
- Node.js 18+ 
- npm eller yarn
- Firebase-konto (för hosting och autentisering)
- (Valfritt) OpenAI API-nyckel för AI-recept
- (Valfritt) Stripe-konto för betalningar

### Installation

1. **Klona repositoryt**
```bash
git clone https://github.com/YOUR_USERNAME/svinnstop.git
cd svinnstop/Svinnstop2
```

2. **Installera dependencies**
```bash
npm install
```

3. **Konfigurera miljövariabler**
```bash
cp .env.example .env
```

Redigera `.env` och lägg till dina API-nycklar:
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
VITE_OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

4. **Konfigurera Firebase**
- Skapa ett projekt på [Firebase Console](https://console.firebase.google.com/)
- Aktivera Authentication:
  - Email/Password provider
  - Google provider
  - **OBS:** Anonym auth är INTE aktiverad (säkerhetsskäl)
- Aktivera Realtime Database med regler från `database.rules.json`
- Aktivera Hosting
- Uppdatera `src/firebaseConfig.js` med dina Firebase-credentials

Se [FIREBASE_SETUP.md](FIREBASE_SETUP.md) för detaljerad guide.

5. **Starta utvecklingsserver**
```bash
npm run dev
```

Appen öppnas på `http://localhost:3000`

## 🏗️ Bygga för produktion

```bash
npm run build
```

Byggda filer hamnar i `dist/` mappen.

## 🌐 Deploy till Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## 📁 Projektstruktur

```
Svinnstop2/
├── src/
│   ├── App.jsx                      # Huvudkomponent
│   ├── main.jsx                     # Entry point
│   ├── firebaseConfig.js            # Firebase-konfiguration
│   ├── userDataSync.js              # Användardata realtidssynk
│   ├── inventorySync.js             # Familj-kylskåpssynk
│   ├── shoppingListSync.js          # Familj-inköpslistesynk
│   ├── familyService.js             # Familjegrupper
│   ├── achievementService.js        # Utmärkelser & achievements
│   ├── savingsTracker.js            # Besparingsstatistik
│   ├── referralService.js           # Referralprogram
│   ├── leaderboardService.js        # Topplista
│   ├── aiRecipeService.js           # OpenAI-integration
│   ├── recipeAPI.js                 # Receptdatabas (150+ recept)
│   ├── notificationService.js       # Push-notifikationer
│   ├── premiumService.js            # Stripe-integration
│   ├── analyticsService.js          # Google Analytics
│   ├── components/
│   │   ├── AuthModal.jsx            # Login/Signup
│   │   └── GoogleSignInButton.jsx   # Google OAuth
│   ├── ShoppingList.jsx             # Inköpslista
│   ├── FamilySharing.jsx            # Familjegrupper UI
│   ├── Leaderboard.jsx              # Topplistor
│   ├── AchievementsPage.jsx         # Utmärkelser UI
│   ├── FAQ.jsx                      # Hjälpcenter + Villkor
│   ├── ReferralProgram.jsx          # Bjud in vänner
│   └── ...
├── public/
│   ├── sw.js                        # Service Worker (PWA)
│   └── manifest.json                # PWA manifest
├── functions/                       # Firebase Cloud Functions
│   └── index.js                     # Stripe webhooks
├── database.rules.json              # Firebase Database-regler
├── firebase.json                    # Firebase-konfiguration
├── vite.config.js                   # Vite-konfiguration
└── package.json
```

## 🔧 Teknisk stack

- **Frontend:** React 18 + Vite
- **Styling:** CSS3 (custom dark theme)
- **Icons:** Lucide React
- **Backend/Auth:** Firebase (Authentication + Realtime Database)
- **Payments:** Stripe
- **AI:** OpenAI API (GPT-4)
- **Hosting:** Firebase Hosting
- **PWA:** Service Worker + Web App Manifest
- **Notifications:** Web Push API
- **Monetization:** Google AdSense

## 📝 Kommandon

```bash
npm run dev        # Starta dev-server
npm run build      # Bygg för produktion
npm run preview    # Förhandsgranska production build
npm run start      # Starta dev-server (port 3000)
```

## 🤝 Bidra

Bidrag är välkomna! Skapa gärna en issue eller pull request.

## 📄 Licens

Privat projekt - All rights reserved.

## 🙏 Erkännanden

- Receptdatabas inspirerad av svenska klassiker
- Icons från Lucide React
- AI-recept från OpenAI GPT-4

---

**Utvecklat med ❤️ för att minska matsvinn**
