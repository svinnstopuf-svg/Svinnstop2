# Aktivera Firebase Authentication

Authentication är nu implementerad i koden. Du måste aktivera det i Firebase Console:

## Steg 1: Aktivera Anonymous Authentication

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj ditt "Svinnstop"-projekt
3. Klicka på **"Authentication"** i vänstermenyn
4. Klicka på **"Get started"** (om det är första gången)
5. Gå till fliken **"Sign-in method"**
6. Klicka på **"Anonymous"**
7. Aktivera skjutreglaget till **"Enabled"**
8. Klicka **"Save"**

## Steg 2: Uppdatera Database Rules

1. Gå till **"Realtime Database"** i vänstermenyn
2. Klicka på fliken **"Rules"**
3. Ersätt innehållet med följande:

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
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "users": {
      "$userId": {
        "profile": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        },
        "stats": {
          ".read": "auth != null",
          ".write": "$userId === auth.uid"
        },
        "referralData": {
          ".read": "$userId === auth.uid",
          ".write": "$userId === auth.uid"
        },
        "referrals": {
          ".read": "$userId === auth.uid",
          ".write": "$userId === auth.uid"
        },
        "friends": {
          ".read": "$userId === auth.uid",
          ".write": "$userId === auth.uid"
        },
        "referredBy": {
          ".read": "$userId === auth.uid",
          ".write": "$userId === auth.uid"
        }
      }
    },
    "referralCodes": {
      "$code": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "usernames": {
      "$username": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

4. Klicka **"Publish"**

## Vad händer nu?

- ✅ Användare autentiseras automatiskt vid första appbesök
- ✅ Ingen synlig skillnad för användaren
- ✅ Data är nu skyddad - endast autentiserade användare har åtkomst
- ✅ Varje enhet får ett unikt anonymt ID

## Verifiera att det fungerar

1. Öppna appen
2. Öppna Browser Console (F12)
3. Du bör se: `✅ Firebase: Anonymous sign-in successful` eller `✅ Firebase: User authenticated`
4. Testa skapa en familjegrupp - ska fungera som vanligt

## Felsökning

### Fel: "auth/operation-not-allowed"
**Lösning:** Anonymous authentication är inte aktiverad. Följ Steg 1 ovan.

### Fel: "PERMISSION_DENIED"
**Lösning:** Database rules är inte uppdaterade. Följ Steg 2 ovan.

### Användare loggas ut hela tiden
**Lösning:** Det är normalt - anonymous sessions kan löpa ut. Appen skapar automatiskt en ny session.

## Viktigt att veta

- **Anonymous users kan tas bort** - Om en användare rensar webbläsardata förlorar de sitt ID och måste gå med i familjegruppen igen
- **För permanent ID**: Lägg till Email/Password eller Google Sign-In senare
- **Gratis nivå**: Firebase tillåter obegränsat antal anonymous users på gratisplanen
