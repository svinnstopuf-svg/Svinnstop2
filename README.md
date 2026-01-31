# 🍽️ Svinnstop

**Svinnstop** är en modern webbapp för att minska matsvinn genom smart spårning av utgångsdatum och AI-genererade receptförslag. Appen hjälper dig att hålla koll på dina matvaror, få påminnelser när de närmar sig utgångsdatum, och föreslår recept baserat på vad du har hemma.

🌐 **Live Demo:** [svinnstop.web.app](https://svinnstop.web.app)

## ✨ Funktioner

### Grundläggande
- 📝 **Spåra matvaror** - Lägg till varor med namn, antal, inköpsdatum och utgångsdatum
- ⏰ **Smart sortering** - Varor sorteras automatiskt efter snarast utgångsdatum
- 🔍 **Filtrering** - Filtrera på alla varor, snart utgående (≤3 dagar), eller utgångna
- 💾 **Lokal lagring** - All data sparas säkert i webbläsaren (localStorage)
- 📱 **PWA-stöd** - Installera som app på mobil och desktop

### Avancerade funktioner
- 🤖 **AI-receptgenerering** - Generera anpassade recept baserat på dina ingredienser (OpenAI)
- 🍳 **Receptförslag** - Automatiska receptförslag från inbyggd databas
- 🔔 **Push-notifikationer** - Få påminnelser när varor närmar sig utgångsdatum
- 🛒 **Inköpslista** - Planera inköp och spara favoritrecept
- 🏆 **Leaderboard** - Tävla med andra om minst matsvinn
- 📊 **Statistik** - Se hur mycket pengar och mat du sparat
- 💳 **Premium-funktioner** - Stripe-integration för premiumtjänster
- 🌍 **Flerspråksstöd** - Google Translate-integration (svenska prioriterat)
- 📱 **AdSense-integration** - Monetisering via Google AdSense

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
- Aktivera Authentication (Anonymous + Email/Password)
- Aktivera Realtime Database
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
│   ├── App.jsx                    # Huvudkomponent
│   ├── main.jsx                   # Entry point
│   ├── firebaseConfig.js          # Firebase-konfiguration
│   ├── aiRecipeService.js         # OpenAI-integration
│   ├── recipeAPI.js               # Receptdatabas
│   ├── notificationService.js     # Push-notifikationer
│   ├── premiumService.js          # Stripe-integration
│   ├── analyticsService.js        # Användarstatistik
│   ├── ShoppingList.jsx           # Inköpslista
│   ├── Leaderboard.jsx            # Topplistor
│   └── ...
├── public/
│   ├── sw.js                      # Service Worker
│   └── manifest.json              # PWA manifest
├── functions/                     # Firebase Cloud Functions
├── firebase.json                  # Firebase-konfiguration
├── vite.config.js                 # Vite-konfiguration
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
