import React, { useState, useEffect } from 'react'
import './OnboardingGuide.css'

export default function OnboardingGuide({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState(null)

  const steps = [
    {
      title: 'Välkommen till Svinnstop! 🎉',
      description: 'Låt oss visa dig hur appen fungerar!',
      longDescription: 'Vi guidar dig genom de viktigaste funktionerna. Klicka "Nästa" för att börja!',
      icon: '👋',
      target: null,
      position: 'center'
    },
    {
      title: 'Här lägger du till varor',
      description: 'Formuläret för att lägga in nya varor i kylskåpet.',
      longDescription: 'Skriv varans namn här så får du automatiska förslag. Välj sedan antal, enhet och utgångsdatum.',
      icon: '📝',
      target: '.add-item-card',
      position: 'bottom',
      tip: 'Prova skriva några bokstäver - du får smarta förslag!'
    },
    {
      title: 'AI föreslår utgångsdatum',
      description: 'Tryck på 🤖 AI-förslag för smart datering!',
      longDescription: 'AI:n föreslår ett rimligt utgångsdatum baserat på varan. Du kan alltid ändra det själv genom att klicka på datumfältet.',
      icon: '🤖',
      target: '.ai-suggestion-btn',
      position: 'top',
      tip: 'AI:n lär sig och blir bättre med tiden!'
    },
    {
      title: 'Ändra varor efteråt',
      description: 'Behöver du justera ett utgångsdatum?',
      longDescription: 'Tryck här för att aktivera redigeringsläge. Bocka i varor, välj nytt datum och uppdatera. Enkelt!',
      icon: '✏️',
      target: '.bulk-edit-toggle',
      position: 'left',
      tip: 'Du kan ändra flera varor samtidigt!'
    },
    {
      title: 'Inköpslista-fliken',
      description: 'Planera dina inköp här!',
      longDescription: 'Tryck här för att gå till inköpslistan. Lägg till varor du behöver köpa och bocka av dem när du handlat.',
      icon: '🛒',
      target: '[class*="tab-button"]:first-child',
      position: 'bottom',
      tip: 'När du bockar av varor och klickar "Rensa klara" flyttas matvaror automatiskt till kylskåpet!'
    },
    {
      title: 'Så här ser dina varor ut',
      description: 'Varorna sorteras efter utgångsdatum.',
      longDescription: 'Lägg märke till färgerna:\n🔴 Röd = Utgånget\n🟡 Gul = Går ut inom 3 dagar\n🟢 Grön = Fräscht!',
      icon: '📦',
      target: '.inventory-card',
      position: 'top',
      tip: 'Ät det gula först för att undvika svinn!'
    },
    {
      title: 'Profil & Inställningar',
      description: 'Fler funktioner finns här!',
      longDescription: 'I profilen hittar du inställningar, familjegrupp, utmärkelser och denna guide om du vill se den igen.',
      icon: '👤',
      target: '[class*="tab-button"]:last-child',
      position: 'top',
      tip: 'Du kan alltid visa guiden igen från profilen!'
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

  // Hitta och highlighta target element
  useEffect(() => {
    if (currentStepData.target) {
      const element = document.querySelector(currentStepData.target)
      if (element) {
        setHighlightedElement(element)
        // Scrolla till elementet
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        setHighlightedElement(null)
      }
    } else {
      setHighlightedElement(null)
    }
  }, [currentStep, currentStepData])

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

  // Beräkna tooltip position baserat på highlighted element
  const getTooltipStyle = () => {
    if (!highlightedElement || currentStepData.position === 'center') {
      return {}
    }

    const rect = highlightedElement.getBoundingClientRect()
    const position = currentStepData.position || 'bottom'

    switch (position) {
      case 'top':
        return {
          position: 'fixed',
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          position: 'fixed',
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)'
        }
      case 'left':
        return {
          position: 'fixed',
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          position: 'fixed',
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translateY(-50%)'
        }
      default:
        return {}
    }
  }

  return (
    <>
      {/* Overlay med spotlight */}
      <div className="onboarding-overlay" onClick={(e) => e.target.className === 'onboarding-overlay' && handleSkip()}>
        {/* Spotlight effect */}
        {highlightedElement && (
          <div 
            className="spotlight-cutout"
            style={{
              position: 'fixed',
              top: `${highlightedElement.getBoundingClientRect().top - 8}px`,
              left: `${highlightedElement.getBoundingClientRect().left - 8}px`,
              width: `${highlightedElement.getBoundingClientRect().width + 16}px`,
              height: `${highlightedElement.getBoundingClientRect().height + 16}px`,
              border: '3px solid var(--accent)',
              borderRadius: '12px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 20px var(--accent)',
              pointerEvents: 'none',
              zIndex: 10001,
              transition: 'all 0.3s ease'
            }}
          />
        )}
      </div>
      
      {/* Tooltip */}
      <div 
        className={`onboarding-container ${highlightedElement ? 'positioned' : 'centered'}`}
        style={highlightedElement ? getTooltipStyle() : {}}
      >
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
    </>
  )
}
