import React, { useState } from 'react'
import './OnboardingGuide.css'

export default function OnboardingGuide({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Välkommen till Svinnstop! 🎉',
      description: 'Din smarta assistent för att minska matsvinn och spara pengar.',
      longDescription: 'Vi hjälper dig hålla koll på dina matvaror och planera dina inköp smart!',
      icon: '👋',
      action: null
    },
    {
      title: 'Lägg till varor i kylskåpet',
      description: 'Börja genom att lägga till dina matvaror.',
      longDescription: 'Tryck på "Lägg till i kylskåp", skriv varans namn och välj antal och enhet. Superenkelt!',
      icon: '📝',
      highlight: 'add-form',
      tip: 'Skriv några bokstäver så får du förslag!'
    },
    {
      title: 'Utgångsdatum - Enkelt och smart',
      description: 'AI-förslag eller välj själv!',
      longDescription: 'Tryck på "🤖 AI-förslag" så föreslår vår AI ett rimligt datum baserat på varan.\n\nVill du ändra? Klicka bara på datumfältet och välj ett annat datum. Superenkelt!',
      icon: '📅',
      highlight: 'expiry-date',
      tip: 'AI:n blir bättre ju mer du använder appen!'
    },
    {
      title: 'Ändra utgångsdatum för befintliga varor',
      description: 'Behöver du justera ett datum?',
      longDescription: 'Om AI:n gissade fel eller om du vill ändra utgångsdatum senare:\n\n1. Tryck på "Redigera varor" i kylskåpet\n2. Bocka i de varor du vill ändra\n3. Välj nytt datum och tryck "Uppdatera"',
      icon: '✏️',
      highlight: 'bulk-edit',
      tip: 'Du kan ändra flera varor samtidigt!'
    },
    {
      title: 'Använd inköpslistan',
      description: 'Planera dina inköp smart.',
      longDescription: 'Gå till Inköpslista-fliken, lägg till varor du behöver köpa. Bocka av dem när du handlat!',
      icon: '🛒',
      highlight: 'shopping-tab',
      tip: 'Du kan spara listor som mallar för återkommande inköp'
    },
    {
      title: 'Rensa klara varor',
      description: 'Varor flyttas automatiskt till kylskåpet.',
      longDescription: 'När du bockat av matvaror i inköpslistan, tryck "Rensa klara" - då flyttas de automatiskt till kylskåpet!',
      icon: '✅',
      highlight: 'clear-completed',
      tip: 'Perfekt efter handlingen!'
    },
    {
      title: 'Färgkodning hjälper dig',
      description: 'Se snabbt vad som går ut.',
      longDescription: '🔴 Röd = Utgånget\n🟡 Gul = Går ut inom 3 dagar\n🟢 Grön = Fräscht!\n\nHåll koll på färgerna för att undvika svinn.',
      icon: '🎨',
      highlight: 'inventory-list',
      tip: 'Ät det gula först!'
    },
    {
      title: 'Du är redo! 🎊',
      description: 'Nu kan du börja minska ditt matsvinn!',
      longDescription: 'Tips: Använd appen varje gång du handlar och när du lagar mat. Ju mer du använder den, desto bättre blir du på att planera!',
      icon: '🌟',
      action: 'finish'
    }
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete()
    }
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        {/* Progress bar */}
        <div className="onboarding-progress">
          <div 
            className="onboarding-progress-bar" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="onboarding-content">
          <div className="onboarding-icon">{currentStepData.icon}</div>
          
          <h2 className="onboarding-title">{currentStepData.title}</h2>
          
          <p className="onboarding-description">{currentStepData.description}</p>
          
          <div className="onboarding-long-description">
            {currentStepData.longDescription.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {currentStepData.tip && (
            <div className="onboarding-tip">
              💡 <strong>Tips:</strong> {currentStepData.tip}
            </div>
          )}

          {/* Step indicator */}
          <div className="onboarding-steps">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`onboarding-step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="onboarding-navigation">
          <button 
            className="onboarding-btn onboarding-btn-secondary"
            onClick={handleSkip}
          >
            {isLastStep ? 'Stäng' : 'Hoppa över'}
          </button>

          <div className="onboarding-nav-right">
            {!isFirstStep && (
              <button 
                className="onboarding-btn onboarding-btn-secondary"
                onClick={handlePrevious}
              >
                ← Föregående
              </button>
            )}
            
            <button 
              className="onboarding-btn onboarding-btn-primary"
              onClick={handleNext}
            >
              {isLastStep ? 'Kom igång! 🚀' : 'Nästa →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
