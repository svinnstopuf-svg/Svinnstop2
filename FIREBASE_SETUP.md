# Firebase Konfiguration för Svinnstop

## Steg 1: Skapa Firebase Projekt

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Klicka på "Add project" (Lägg till projekt)
3. Ange projektnamn: `svinnstop` (eller valfritt namn)
4. Välj om du vill ha Google Analytics (valfritt)
5. Klicka "Create project"

## Steg 2: Aktivera Realtime Database

1. I Firebase Console, klicka på "Realtime Database" i vänster meny
2. Klicka "Create Database"
3. Välj region (föreslagen: `europe-west1` för Sverige)
4. Välj "Start in test mode" (vi lägger till säkerhetsregler senare)
5. Klicka "Enable"

## Steg 3: Registrera Webb-App

1. I Firebase Console översikt, klicka på webb-ikonen (`</>`)
2. Ange app-namn: `Svinnstop Web`
3. **VIKTIGT**: Bocka i "Also set up Firebase Hosting" om du ska deploya appen
4. Klicka "Register app"
5. Firebase visar nu din konfiguration - **kopiera värdena**

Din konfiguration ser ut ungefär så här:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "svinnstop-xxxxx.firebaseapp.com",
  databaseURL: "https://svinnstop-xxxxx-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "svinnstop-xxxxx",
  storageBucket: "svinnstop-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};
```

## Steg 4: Uppdatera firebaseConfig.js

Öppna `src/firebaseConfig.js` och ersätt placeholder-värdena med dina riktiga värden från Firebase:

```javascript
import { initializeApp } from 'firebase/database'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "DIN_API_KEY_HÄR",
  authDomain: "DIN_AUTH_DOMAIN_HÄR",
  databaseURL: "DIN_DATABASE_URL_HÄR",  // VIKTIGT! Denna måste finnas
  projectId: "DITT_PROJECT_ID_HÄR",
  storageBucket: "DIN_STORAGE_BUCKET_HÄR",
  messagingSenderId: "DITT_MESSAGING_SENDER_ID_HÄR",
  appId: "DITT_APP_ID_HÄR"
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
```

## Steg 5: Lägg till Säkerhetsregler (VIKTIGT!)

Test mode ger alla läs- och skrivrättigheter - detta är INTE säkert för produktion!

1. Gå till "Realtime Database" → "Rules" fliken
2. Ersätt reglerna med följande:

```json
{
  "rules": {
    "families": {
      "$familyId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "codes": {
      "$familyCode": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

**OBS**: Dessa regler kräver autentisering. Om du inte använder Firebase Authentication än, kan du temporärt använda:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

**VARNING**: Ovanstående regler ger alla fullständig åtkomst. Använd endast för utveckling!

## Steg 6: (Valfritt) Lägg till Firebase Authentication

För säkrare dataåtkomst, rekommenderas Firebase Authentication:

1. I Firebase Console, klicka "Authentication" → "Get started"
2. Aktivera "Anonymous" authentication (enklast för första steget)
3. Senare kan du lägga till Google Sign-In, Email/Password etc.

## Steg 7: Testa Appen

1. Spara alla ändringar i `firebaseConfig.js`
2. Starta appen: `npm start`
3. Gå till Profil → Familjegrupp
4. Skapa en familjegrupp
5. Öppna appen på en annan enhet/webbläsare
6. Gå med i familjegruppen med samma kod
7. Lägg till en vara på den första enheten
8. Kontrollera att varan syns på den andra enheten i realtid!

## Felsökning

### Fel: "Firebase: Error (auth/operation-not-allowed)"
- Lösning: Aktivera Authentication i Firebase Console

### Fel: "PERMISSION_DENIED: Permission denied"
- Lösning: Kontrollera Database Rules i Firebase Console
- Använd test mode-regler under utveckling

### Fel: "Database URL is required"
- Lösning: Se till att `databaseURL` finns i `firebaseConfig` och pekar på rätt region

### Inventariet synkar inte
- Kontrollera att båda enheterna använder samma familjegrupp-kod
- Öppna Browser Console (F12) och leta efter felmeddelanden
- Kontrollera i Firebase Console → Realtime Database att data skrivs

## Datastruktur i Firebase

Din data kommer att lagras så här:
```
/families
  /family_1234567890
    /familyId: "family_1234567890"
    /familyCode: "ABC123"
    /familyName: "Min Familj"
    /createdAt: "2024-01-15T10:30:00.000Z"
    /members
      /member_1234567890
        /id: "member_1234567890"
        /name: "Anna"
        /role: "owner"
        /joinedAt: "2024-01-15T10:30:00.000Z"
      /member_0987654321
        /id: "member_0987654321"
        /name: "Erik"
        /role: "member"
        /joinedAt: "2024-01-15T11:00:00.000Z"
    /inventory
      /0
        /id: "item_1234567890"
        /name: "Mjölk"
        /quantity: 2
        /expiresAt: "2024-01-20"
        ...

/codes
  /ABC123
    /familyId: "family_1234567890"
    /familyName: "Min Familj"
    /createdAt: "2024-01-15T10:30:00.000Z"
```

## Support

Om du stöter på problem:
1. Kontrollera Browser Console för felmeddelanden
2. Verifiera Firebase-konfigurationen
3. Kontrollera Database Rules i Firebase Console
4. Se till att `databaseURL` är korrekt konfigurerad
