import { useState } from 'react'
import './Onboarding.css'

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      icon: '💸',
      title: 'Varje svensk kastar 500 kr mat varje månad',
      description: 'Det blir 6000 kr per år som bokstavligen hamnar i soporna. Låt oss ändra på det!',
      image: '📊'
    },
    {
      icon: '🔔',
      title: 'Svinnstop hjälper dig spara pengar',
      description: 'Få smarta påminnelser innan maten går ut. Hitta recept baserat på vad du har hemma. Aldrig mer dåligt samvete!',
      image: '📱'
    },
    {
      icon: '✨',
      title: 'Lägg till din första vara nu!',
      description: 'Det tar bara 10 sekunder att lägga till en vara. Vi hjälper dig komma igång!',
      image: '🥛'
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // På sista steget - stäng onboarding och gå till add-formuläret
      onComplete()
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const step = steps[currentStep]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <button className="onboarding-skip" onClick={handleSkip}>
          Hoppa över
        </button>

        <div className="onboarding-content">
          <div className="onboarding-icon">{step.icon}</div>
          <h2 className="onboarding-title">{step.title}</h2>
          <p className="onboarding-description">{step.description}</p>
          <div className="onboarding-visual">{step.image}</div>
        </div>

        <div className="onboarding-footer">
          <div className="onboarding-dots">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentStep ? 'active' : ''}`}
              />
            ))}
          </div>

          <button className="onboarding-next" onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Kom igång!' : 'Nästa'}
          </button>
        </div>
      </div>
    </div>
  )
}
