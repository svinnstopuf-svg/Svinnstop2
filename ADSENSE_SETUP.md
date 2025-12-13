# Google AdSense Setup Guide för Svinnstop

## Status
✅ **Teknisk implementation klar** - Redo att aktiveras när bankkonto är klart

⏳ **Väntar på**: Bankkonto (förväntas inom 2 veckor)

## Vad som redan är implementerat

### 1. Ad Service (`src/adService.js`)
- ✅ Endast visar annonser för gratis-användare
- ✅ Premium-användare ser inga annonser
- ✅ Hanterar adblocker-detection
- ✅ Auto-döljer annonser när användare uppgraderar

### 2. AdBanner Component (`src/AdBanner.jsx`)
- ✅ Responsiv annonskomponent
- ✅ Auto-döljs för premium-användare
- ✅ Integrerad i huvudappen

### 3. Strategic Ad Placement
- ✅ Efter inventory-listan (inventory tab)
- ✅ Före receptlistan (recipes tab)
- ✅ Kan enkelt lägga till fler platser vid behov

### 4. Premium Integration
- ✅ Annonser döljs automatiskt när användare blir premium
- ✅ Annonser visas igen om premium upphör
- ✅ Synkroniseras med Firebase

## Steg för att aktivera AdSense (när bankkonto finns)

### Steg 1: Skapa Google AdSense-konto
1. Gå till [https://www.google.com/adsense](https://www.google.com/adsense)
2. Logga in med ditt Google-konto
3. Fyll i information:
   - Webbplats URL: `https://svinnstop.com` (eller din faktiska domän)
   - Land: Sverige
   - Bankkonto: Fyll i ditt nya bankkonto

### Steg 2: Få ditt AdSense Client ID
Efter godkännande får du ett **Client ID** som ser ut så här:
```
ca-pub-XXXXXXXXXXXXXXXX
```

### Steg 3: Uppdatera koden med ditt Client ID

#### I `src/adService.js` (rad 43):
```javascript
// FÖRE:
// script.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX')

// EFTER:
script.setAttribute('data-ad-client', 'ca-pub-DIN_RIKTIGA_CLIENT_ID')
```

#### I `src/AdBanner.jsx` (rad 62):
```javascript
// FÖRE:
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"

// EFTER:
data-ad-client="ca-pub-DIN_RIKTIGA_CLIENT_ID"
```

### Steg 4: Skapa Ad Units i AdSense Dashboard
1. Gå till AdSense Dashboard → Ads → Overview
2. Klicka "Create new ad unit"
3. Skapa 2 ad units:
   - **Inventory Ad** (Display ad, Responsive)
   - **Recipe Ad** (Display ad, Responsive)

4. För varje ad unit får du en **Ad Slot ID** (ex: `1234567890`)

### Steg 5: Uppdatera Ad Slot IDs i komponenter

#### I `src/App.jsx`:

**För inventory-annons (rad ~2002):**
```jsx
// FÖRE:
<AdBanner className="bottom" />

// EFTER:
<AdBanner slot="DIN_INVENTORY_AD_SLOT_ID" className="bottom" />
```

**För recept-annons (rad ~2038):**
```jsx
// FÖRE:
<AdBanner className="top" />

// EFTER:
<AdBanner slot="DIN_RECIPE_AD_SLOT_ID" className="top" />
```

### Steg 6: Verifiera domän i AdSense
1. AdSense kommer ge dig en verifieringskod
2. Lägg till koden i `index.html` mellan `<head>` och `</head>`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
     crossorigin="anonymous"></script>
```

### Steg 7: Deploy och testa
1. Bygg appen: `npm run build`
2. Deploy till produktion
3. Vänta 24-48 timmar för AdSense-godkännande
4. Testa med gratis-konto (du ska se annonser)
5. Testa med premium-konto (inga annonser ska visas)

## Optimeringsstrategier

### Fler annonsplatser (om behövs)
Lägg till fler `<AdBanner />` komponenter:

```jsx
// I shopping list-fliken
<AdBanner slot="SHOPPING_AD_SLOT_ID" className="inline" />

// I profil-fliken
<AdBanner slot="PROFILE_AD_SLOT_ID" className="bottom" />
```

### A/B Testing
- Testa olika annonsplaceringar
- Monitrera CTR (Click-Through Rate) i AdSense Dashboard
- Justera placeringar baserat på prestanda

### Balance mellan intäkter och UX
- **För få annonser** = Låga intäkter
- **För många annonser** = Dålig användarupplevelse → fler premium-konverteringar
- **Rekommendation**: Börja med 2 annonser (som nu), öka gradvis om behövs

## Intäktsförväntan

### Estimat (Sverige, svenska app)
- **CPM** (Cost Per Mille): 10-30 kr per 1000 visningar
- **CTR** (Click-Through Rate): 0.5-2%
- **CPC** (Cost Per Click): 1-5 kr per klick

### Exempel-scenario:
- 1000 gratis-användare per dag
- 3 sessions per användare = 3000 sessioner
- 2 annonser per session = 6000 ad impressions
- CPM 20 kr = **120 kr/dag ≈ 3600 kr/månad**

**Viktigt**: Första månaden är ofta lägre (AdSense lär sig din publik)

## Monetiseringsstrategi

### Prioritering:
1. **Premium-konvertering** (primär intäkt)
   - 29 kr/mån (individual)
   - 49 kr/mån (family)
   
2. **AdSense** (sekundär intäkt)
   - Passiv inkomst från gratis-användare
   - Inget underhåll efter setup

### Balans:
- Annonser på gratis-konton → irritation → premium-konvertering
- Annonsintäkter täcker drift för gratis-användare
- Premium ger ren vinst

## Troubleshooting

### Problem: Annonser visas inte
**Lösningar:**
1. Kontrollera att Client ID och Slot IDs är korrekta
2. Vänta 24-48 timmar efter setup
3. Kolla AdSense Dashboard för fel
4. Verifiera att domänen är godkänd

### Problem: Annonser visas för premium-användare
**Lösningar:**
1. Kolla `premiumService.isPremiumActive()` i console
2. Verifiera att `AdBanner` kollar premium-status
3. Hard refresh (Ctrl+Shift+R) för att rensa cache

### Problem: Låg CTR
**Lösningar:**
1. Testa olika annonsplaceringar
2. Använd native ads (blends bättre)
3. Optimera annonsformat (responsive)

## Support
- **AdSense Help**: [https://support.google.com/adsense](https://support.google.com/adsense)
- **Sverige-specifik support**: [https://support.google.com/adsense/community](https://support.google.com/adsense/community)

## Nästa steg
1. ✅ Teknisk implementation klar
2. ⏳ Vänta på bankkonto
3. 🎯 Skapa AdSense-konto
4. 🎯 Uppdatera Client ID & Slot IDs
5. 🎯 Deploy och testa
6. 🎯 Monitrera prestanda
