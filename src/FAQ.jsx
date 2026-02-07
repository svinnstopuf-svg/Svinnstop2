import React, { useState, useEffect } from 'react'
import './FAQ.css'

export default function FAQ() {
  const [activeSection, setActiveSection] = useState('faq')
  const [expandedQuestion, setExpandedQuestion] = useState(null)
  
  // Lyssna på event för att öppna specifik sektion
  useEffect(() => {
    const handleOpenFAQ = (event) => {
      const { section } = event.detail
      if (section) {
        setActiveSection(section)
      }
    }
    
    window.addEventListener('openFAQ', handleOpenFAQ)
    return () => window.removeEventListener('openFAQ', handleOpenFAQ)
  }, [])

  const faqs = [
    {
      question: 'Hur fungerar Svinnstop?',
      answer: 'Svinnstop hjälper dig att hålla koll på dina matvaror genom att spåra utgångsdatum, föreslå recept baserat på vad du har hemma, och påminna dig innan maten går ut. Du kan också dela din inköpslista och kylskåp med familjen.'
    },
    {
      question: 'Är Svinnstop gratis?',
      answer: 'Ja! Svinnstop har en gratis version med grundfunktioner. För att få tillgång till premium-funktioner som obegränsat antal varor, AI-receptgenerator och inga annonser kan du uppgradera till Premium för 29 kr/mån (Individual) eller 49 kr/mån (Family).'
    },
    {
      question: 'Hur bjuder jag in någon till min familjegrupp?',
      answer: 'Gå till Familj-fliken, skapa en familjegrupp och dela familjekoden med dina familjemedlemmar. De kan sedan gå med genom att ange koden i sin app.'
    },
    {
      question: 'Synkas min data mellan enheter?',
      answer: 'Ja! När du loggar in med ditt konto synkas all din data automatiskt mellan alla dina enheter - telefon, dator och surfplatta.'
    },
    {
      question: 'Hur får jag gratis Premium?',
      answer: 'Genom vårt referralprogram! Bjud in vänner med din personliga referralkod. Efter 1 vän får du 1 vecka gratis, 3 vänner = 1 månad, 10 vänner = 3 månader, och 50 vänner = livstids Premium!'
    },
    {
      question: 'Kan jag avbryta min Premium-prenumeration?',
      answer: 'Ja, du kan när som helst avbryta din prenumeration. Du behåller Premium-funktionerna till slutet av din betalperiod.'
    },
    {
      question: 'Hur raderar jag mitt konto?',
      answer: 'Kontakta oss på svinnstopuf@gmail.com så hjälper vi dig att radera ditt konto och all din data.'
    },
    {
      question: 'Vilka länder stöds?',
      answer: 'Svinnstop fungerar i alla länder, men appen är för närvarande på svenska. Vi planerar att stödja fler språk i framtiden.'
    }
  ]

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h2>Information & Hjälp</h2>
      </div>

      <div className="faq-tabs">
        <button 
          className={activeSection === 'faq' ? 'active' : ''}
          onClick={() => setActiveSection('faq')}
        >
          Vanliga frågor
        </button>
        <button 
          className={activeSection === 'terms' ? 'active' : ''}
          onClick={() => setActiveSection('terms')}
        >
          Användarvillkor
        </button>
        <button 
          className={activeSection === 'privacy' ? 'active' : ''}
          onClick={() => setActiveSection('privacy')}
        >
          Integritetspolicy
        </button>
      </div>

      <div className="faq-content">
        {activeSection === 'faq' && (
          <div className="faq-section">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button 
                  className={`faq-question ${expandedQuestion === index ? 'active' : ''}`}
                  onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                >
                  {faq.question}
                  <span className="faq-icon">{expandedQuestion === index ? '−' : '+'}</span>
                </button>
                {expandedQuestion === index && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}

            <div className="faq-contact">
              <h3>Har du fler frågor?</h3>
              <p>Kontakta oss på <a href="mailto:svinnstopuf@gmail.com">svinnstopuf@gmail.com</a></p>
            </div>
          </div>
        )}

        {activeSection === 'terms' && (
          <div className="terms-section">
            <h3>Användarvillkor för Svinnstop</h3>
            <p className="last-updated">Senast uppdaterad: 7 februari 2026</p>

            <section>
              <h4>1. Godkännande av villkor</h4>
              <p>Genom att använda Svinnstop godkänner du dessa användarvillkor. Om du inte godkänner villkoren, vänligen använd inte tjänsten.</p>
            </section>

            <section>
              <h4>2. Tjänstens syfte</h4>
              <p>Svinnstop är en tjänst för att hjälpa användare att minska matsvinn genom att spåra matvarors utgångsdatum, föreslå recept och hantera inköpslistor.</p>
            </section>

            <section>
              <h4>3. Användarkonto</h4>
              <ul>
                <li>Du måste skapa ett konto för att använda Svinnstop</li>
                <li>Du är ansvarig för att hålla ditt lösenord säkert</li>
                <li>Du får inte dela ditt konto med andra</li>
                <li>Du måste vara minst 13 år för att skapa ett konto</li>
              </ul>
            </section>

            <section>
              <h4>4. Premium-prenumerationer</h4>
              <ul>
                <li>Premium Individual: 29 kr/månad</li>
                <li>Premium Family: 49 kr/månad</li>
                <li>Prenumerationer förnyas automatiskt varje månad</li>
                <li>Du kan avbryta när som helst via ditt konto</li>
                <li>Vid avbokning behåller du Premium till slutet av betalperioden</li>
                <li>Inga återbetalningar för pågående period</li>
              </ul>
            </section>

            <section>
              <h4>5. Användarinnehåll</h4>
              <ul>
                <li>Du äger all data du skapar i Svinnstop</li>
                <li>Vi använder aldrig din data för att sälja till tredje part</li>
                <li>Du får inte använda tjänsten för olagliga ändamål</li>
              </ul>
            </section>

            <section>
              <h4>6. Ansvarsbegränsning</h4>
              <p>Svinnstop tillhandahålls "som den är". Vi garanterar inte att tjänsten alltid är tillgänglig eller felfri. Vi ansvarar inte för:</p>
              <ul>
                <li>Förlust av data</li>
                <li>Tekniska problem eller avbrott</li>
                <li>Felaktig information om utgångsdatum eller recept</li>
                <li>Matförgiftning eller hälsoproblem relaterade till matvaror</li>
              </ul>
              <p className="warning">⚠️ <strong>Viktigt:</strong> Svinnstop är ett hjälpmedel och ersätter inte ditt eget omdöme. Kontrollera alltid maten själv innan konsumtion.</p>
            </section>

            <section>
              <h4>7. Uppsägning</h4>
              <p>Vi förbehåller oss rätten att stänga av eller radera konton som bryter mot dessa villkor.</p>
            </section>

            <section>
              <h4>8. Ändringar av villkor</h4>
              <p>Vi kan uppdatera dessa villkor när som helst. Du meddelas om väsentliga ändringar via appen eller email.</p>
            </section>

            <section>
              <h4>9. Kontakt</h4>
              <p>För frågor om användarvillkoren, kontakta oss på <a href="mailto:svinnstopuf@gmail.com">svinnstopuf@gmail.com</a></p>
            </section>
          </div>
        )}

        {activeSection === 'privacy' && (
          <div className="privacy-section">
            <h3>Integritetspolicy för Svinnstop</h3>
            <p className="last-updated">Senast uppdaterad: 7 februari 2026</p>

            <section>
              <h4>1. Inledning</h4>
              <p>Din integritet är viktig för oss. Denna policy beskriver vilken data vi samlar in och hur vi använder den.</p>
            </section>

            <section>
              <h4>2. Data vi samlar in</h4>
              
              <h5>Kontoinformation:</h5>
              <ul>
                <li>Email-adress</li>
                <li>Användarnamn (om du väljer att sätta ett)</li>
                <li>Lösenord (krypterat)</li>
              </ul>

              <h5>Användningsdata:</h5>
              <ul>
                <li>Matvaror du lägger till i appen</li>
                <li>Utgångsdatum</li>
                <li>Inköpslistor</li>
                <li>Besparingsstatistik</li>
                <li>Achievements</li>
                <li>Familjegrupp-medlemskap</li>
              </ul>

              <h5>Teknisk data:</h5>
              <ul>
                <li>IP-adress</li>
                <li>Enhetsinformation (webbläsare, operativsystem)</li>
                <li>Användningsmönster (via Google Analytics)</li>
              </ul>
            </section>

            <section>
              <h4>3. Hur vi använder din data</h4>
              <ul>
                <li>För att tillhandahålla tjänsten (kylskåp, inköpslista, notifikationer)</li>
                <li>För att förbättra appen baserat på användningsmönster</li>
                <li>För att skicka viktiga uppdateringar (om du valt att få emails)</li>
                <li>För att hantera betalningar (via Stripe)</li>
                <li>För att visa relevanta annonser (Google AdSense för free users)</li>
              </ul>
            </section>

            <section>
              <h4>4. Datalagring</h4>
              <p>Din data lagras säkert i Firebase (Google Cloud Platform) med datacenter i EU. Vi följer GDPR och svenska dataskyddslagar.</p>
            </section>

            <section>
              <h4>5. Delning av data</h4>
              <p>Vi delar <strong>aldrig</strong> din personliga data med tredje part för marknadsföring. Vi använder följande tjänster:</p>
              <ul>
                <li><strong>Firebase/Google:</strong> För autentisering och datalagring</li>
                <li><strong>Stripe:</strong> För betalningar (endast om du köper Premium)</li>
                <li><strong>Google Analytics:</strong> För användningsstatistik (anonymiserad)</li>
                <li><strong>Google AdSense:</strong> För annonser (free users)</li>
              </ul>
            </section>

            <section>
              <h4>6. Dina rättigheter (GDPR)</h4>
              <p>Du har rätt att:</p>
              <ul>
                <li><strong>Se din data:</strong> Kontakta oss för en kopia av din data</li>
                <li><strong>Rätta data:</strong> Ändra din data direkt i appen</li>
                <li><strong>Radera data:</strong> Begär att vi raderar ditt konto och all data</li>
                <li><strong>Exportera data:</strong> Få din data i ett maskinläsbart format</li>
                <li><strong>Invända:</strong> Invända mot viss databehandling</li>
              </ul>
            </section>

            <section>
              <h4>7. Cookies</h4>
              <p>Vi använder cookies för:</p>
              <ul>
                <li>Att hålla dig inloggad</li>
                <li>Att komma ihåg dina inställningar</li>
                <li>Analytics (Google Analytics)</li>
                <li>Annonser (Google AdSense)</li>
              </ul>
              <p>Du kan blockera cookies i din webbläsare, men vissa funktioner kanske inte fungerar.</p>
            </section>

            <section>
              <h4>8. Barns integritet</h4>
              <p>Svinnstop är inte avsedd för barn under 13 år. Vi samlar inte medvetet in data från barn under 13.</p>
            </section>

            <section>
              <h4>9. Datasäkerhet</h4>
              <p>Vi använder branschstandard säkerhetsåtgärder:</p>
              <ul>
                <li>HTTPS-kryptering</li>
                <li>Krypterade lösenord</li>
                <li>Säkra Firebase security rules</li>
                <li>Regelbundna säkerhetsuppdateringar</li>
              </ul>
            </section>

            <section>
              <h4>10. Ändringar av integritetspolicy</h4>
              <p>Vi kan uppdatera denna policy när som helst. Väsentliga ändringar meddelas via appen eller email.</p>
            </section>

            <section>
              <h4>11. Kontakt</h4>
              <p>För frågor om integritet eller för att utöva dina rättigheter:</p>
              <ul>
                <li>Email: <a href="mailto:svinnstopuf@gmail.com">svinnstopuf@gmail.com</a></li>
                <li>För alla förfrågningar inklusive GDPR: <a href="mailto:svinnstopuf@gmail.com">svinnstopuf@gmail.com</a></li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
