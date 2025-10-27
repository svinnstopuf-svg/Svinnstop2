# 🐛 TESTPLAN FÖR BUGGFIXAR

## ✅ BUGGAR SOM FIXATS

### 1. **Race Condition i localStorage** ✅
**Problem:** Fel namn kunde visas på varor när data sparades/lästes samtidigt

**Fix:**
- Lagt till debounce (100ms) på localStorage-skrivningar
- Direkt localStorage-uppdatering vid kritiska operationer (add, remove, update)
- Använder functional updates (`prevState =>`) för att undvika stale state

**Test:**
1. Lägg till 3 varor snabbt efter varandra
2. Kontrollera att alla har rätt namn
3. Uppdatera en vara
4. Ladda om sidan → kontrollera att all data finns kvar

---

### 2. **Stale State i formulär** ✅
**Problem:** När användaren ändrade namn kunde gamla värden "hänga kvar"

**Fix:**
- Alla `setForm()` använder nu functional updates: `setForm(prevForm => ({ ...prevForm, ...}))`
- Skapar kopia av form-data INNAN state rensas i `onAdd()`
- Validering av inputs innan de används

**Test:**
1. Skriv "mjölk" i namn-fältet
2. Välj ett matvaruförslag
3. Ändra till "bröd"
4. Lägg till varan
5. Kontrollera att "bröd" (inte "mjölk") sparades

---

### 3. **Recept visas inte** ✅
**Problem:** För strikt filtrering - krävde ALLA ingredienser

**Fix:**
- Ändrat från "måste ha ALLA ingredienser" till "måste ha minst 2 ingredienser ELLER 30% av ingredienserna"
- Visar nu 8 recept istället för 5
- Bättre matchning med partial string matching

**Test:**
1. Lägg till 3 varor: "ägg", "mjölk", "bröd"
2. Gå till Recept-fliken
3. Du bör nu se FLERA recept (inte tomt!)
4. Kontrollera att recepten faktiskt använder dina varor

---

### 4. **Data-korruption vid localStorage-full** ✅
**Problem:** Om localStorage blev full kunde data bli korrupt

**Fix:**
- Try-catch på alla localStorage-operationer
- Automatisk rensning av cache om QuotaExceededError
- Validering av data vid laddning (filtrerar bort ogiltiga items)

**Test:**
1. Öppna DevTools → Console
2. Kör: `localStorage.setItem('test', 'x'.repeat(5000000))` (fylla localStorage)
3. Försök lägg till vara
4. Appen ska rensa cache och fortsätta fungera

---

### 5. **Ogiltiga objekt i items-array** ✅
**Problem:** Korrupta objekt kunde sparas i localStorage

**Fix:**
- Validering vid laddning: kontrollerar att items har `id`, `name`, `quantity`, `expiresAt`
- Filtrerar bort ogiltiga items automatiskt
- Loggar varning om items rensades

**Test:**
1. Öppna DevTools → Console
2. Kör: `localStorage.setItem('svinnstop_items', '[{"id":"1"},{"name":"test"}]')`
3. Ladda om sidan
4. Kontrollera console - ska visa "Rensade 2 ogiltiga items"
5. Appen ska fortsätta fungera utan krascher

---

## 🧪 MANUELLT TESTPROTOKOLL

### **Scenario 1: Snabb inmatning**
1. Lägg till 5 varor så snabbt du kan
2. ✅ Alla varor har rätt namn
3. ✅ Alla varor har rätt utgångsdatum
4. ✅ Inga dubbletter

### **Scenario 2: Återladdning**
1. Lägg till 3 varor
2. Ladda om sidan (F5)
3. ✅ Alla 3 varor finns kvar
4. ✅ Alla har rätt data

### **Scenario 3: Redigering**
1. Lägg till en vara "mjölk"
2. Redigera utgångsdatum
3. Ladda om sidan
4. ✅ Ändringen sparades

### **Scenario 4: Borttagning**
1. Lägg till 5 varor
2. Ta bort vara nummer 3
3. ✅ Rätt vara försvann
4. ✅ Andra varor opåverkade
5. Ladda om sidan
6. ✅ Borttagningen sparades

### **Scenario 5: Receptvisning**
1. Lägg till: ägg, mjölk, smör, bröd
2. Gå till Recept-fliken → "Mina recept"
3. ✅ Minst 2-3 recept visas
4. ✅ Recepten använder dina varor
5. Gå till "Rekommenderade"
6. ✅ Många recept laddas (från API eller cache)

---

## 🔍 DEBUG-TIPS

### **Inspektera localStorage:**
```javascript
// Console (DevTools)
JSON.parse(localStorage.getItem('svinnstop_items'))
```

### **Rensa allt:**
```javascript
localStorage.clear()
location.reload()
```

### **Simulera korrupt data:**
```javascript
localStorage.setItem('svinnstop_items', '[{"bad":"data"}]')
location.reload()
```

---

## ✅ CHECKLISTA INNAN LAUNCH

- [ ] Alla 5 manuella scenarion passerade
- [ ] Inga console-errors under normal användning
- [ ] Fungerar efter reload
- [ ] Recept visas korrekt
- [ ] Data sparas och laddas korrekt
- [ ] Inga "fel namn"-buggar
- [ ] Undo-knappen fungerar

---

## 🚀 NÄSTA STEG

När alla tester är gröna:
1. Commit alla ändringar
2. Deploy till test-miljö
3. Be teamet testa i 24 timmar
4. Om inga buggar → production deploy!

---

**Skapad:** 2025-10-27
**Senast uppdaterad:** 2025-10-27
