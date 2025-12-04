import React, { useState, useEffect } from 'react'
import './OnboardingGuide.css'

export default function OnboardingGuide({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%' })

  const steps = [
    {
      title: 'Välkommen till Svinnstop!',
      icon: '👋',
      description: 'Vi guidar dig genom appens viktigaste funktioner så att du snabbt kan komma igång och minska ditt matsvinn.',
      tip: 'Följ med steg för steg!',
      target: null,
      position: 'center'
    },
    {
      title: 'Lägg till varor',
      icon: '📝',
      description: 'Här lägger du in varor i ditt kylskåp. Skriv namnet på varan så får du smarta förslag.',
      tip: 'Formuläret föreslår automatiskt lämplig enhet baserat på varan',
      target: '.add-item-card',
      position: 'bottom'
    },
    {
      title: 'AI föreslår utgångsdatum',
      icon: '🤖',
      description: 'Tryck på "🤖 AI-förslag" så föreslår systemet ett rimligt utgångsdatum baserat på varan.',
      tip: 'AI:n lär sig och blir bättre med tiden!',
      target: '.ai-suggestion-btn',
      position: 'top'
    },
    {
      title: 'Ändra utgångsdatum',
      icon: '✏️',
      description: 'Behöver du justera datum efter att en vara lagts till? Använd redigeringsläget här.',
      tip: 'Du kan ändra flera varor samtidigt genom att bocka i dem',
      target: '.bulk-edit-toggle',
      position: 'left'
    },
    {
      title: 'Inköpslista',
      icon: '🛒',
      description: 'Planera dina inköp i inköpslistan. Lägg till varor du behöver köpa och bocka av dem när du handlar.',
      tip: 'Perfekt för att planera vad du behöver köpa',
      target: '.tab-button:first-child',
      position: 'bottom'
    },
    {
      title: 'Rensa klara varor',
      icon: '✅',
      description: 'När du bockat av varor i inköpslistan, klicka "Rensa klara" så flyttas matvaror automatiskt till kylskåpet med AI-förslag på utgångsdatum!',
      tip: 'Detta sparar tid - du slipper lägga in varor manuellt',
      target: '.tab-button:first-child',
      position: 'bottom'
    },
    {
      title: 'Färgkodning',
      icon: '🎨',
      description: 'Varorna färgkodas efter utgångsdatum:\\n\\n🔴 Röd = Utgånget\\n🟡 Gul = Går ut inom 3 dagar\\n🟢 Grön = Fräscht!',
      tip: 'Ät det gula först för att undvika svinn!',
      target: '.inventory-card',
      position: 'top'
    },
    {
      title: 'Du är redo!',
      icon: '🎊',
      description: 'Nu kan du börja minska ditt matsvinn! Använd appen varje gång du handlar och när du lagar mat.',
      tip: 'Ju mer du använder appen, desto bättre blir du på att planera!',
      target: null,
      position: 'center'
    }
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  // Hitta och highlighta target element
  useEffect(() => {
    if (currentStepData.target) {
      // Vänta lite så DOM hinner uppdateras
      setTimeout(() => {
        const element = document.querySelector(currentStepData.target)
        if (element) {
          setHighlightedElement(element)
          // Scrolla till elementet
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          
          // Beräkna tooltip-position
          const rect = element.getBoundingClientRect()
          const position = calculateTooltipPosition(rect, currentStepData.position)
          setTooltipPosition(position)
        } else {
          console.warn('Guide: Element not found:', currentStepData.target)
          setHighlightedElement(null)
        }
      }, 100)
    } else {
      setHighlightedElement(null)
      setTooltipPosition({ top: '50%', left: '50%' })
    }
  }, [currentStep, currentStepData])

  // Beräkna var tooltip ska placeras
  const calculateTooltipPosition = (elementRect, position) => {
    const padding = 20
    
    switch (position) {
      case 'top':
        return {
          top: `${elementRect.top - padding}px`,
          left: `${elementRect.left + elementRect.width / 2}px`,
          transform: 'translate(-50%, -100%)'
        }
      case 'bottom':
        return {
          top: `${elementRect.bottom + padding}px`,
          left: `${elementRect.left + elementRect.width / 2}px`,
          transform: 'translateX(-50%)'
        }
      case 'left':
        return {
          top: `${elementRect.top + elementRect.height / 2}px`,
          left: `${elementRect.left - padding}px`,
          transform: 'translate(-100%, -50%)'
        }
      case 'right':
        return {
          top: `${elementRect.top + elementRect.height / 2}px`,
          left: `${elementRect.right + padding}px`,
          transform: 'translateY(-50%)'
        }
      default:
        return { top: '50%', left: '50%' }
    }
  }

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
    <>
      {/* Overlay */}
      <div className="guide-overlay" onClick={(e) => {
        if (e.target.className === 'guide-overlay') {
          handleSkip()
        }
      }} />

      {/* Spotlight */}
      {highlightedElement && (
        <div
          className="guide-spotlight"
          style={{
            top: `${highlightedElement.getBoundingClientRect().top - 8}px`,
            left: `${highlightedElement.getBoundingClientRect().left - 8}px`,
            width: `${highlightedElement.getBoundingClientRect().width + 16}px`,
            height: `${highlightedElement.getBoundingClientRect().height + 16}px`
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className={`guide-tooltip ${!highlightedElement ? 'centered' : ''}`}
        style={!highlightedElement ? {} : tooltipPosition}
      >
        {/* Progress bar */}
        <div className="guide-progress">
          <div
            className="guide-progress-bar"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="guide-tooltip-header">
          <span className="guide-tooltip-icon">{currentStepData.icon}</span>
          <h2 className="guide-tooltip-title">{currentStepData.title}</h2>
        </div>

        {/* Description */}
        <div className="guide-tooltip-description">
          {currentStepData.description.split('\\n').map((line, i) => (
            <p key={i} style={{ margin: line ? '0 0 8px 0' : 0 }}>{line}</p>
          ))}
        </div>

        {/* Tip */}
        {currentStepData.tip && (
          <div className="guide-tooltip-tip">
            💡 <strong>Tips:</strong> {currentStepData.tip}
          </div>
        )}

        {/* Step indicator */}
        <div className="guide-step-indicator">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`guide-step-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="guide-buttons">
          <button
            className="guide-btn guide-btn-secondary"
            onClick={handleSkip}
          >
            {isLastStep ? 'Stäng' : 'Hoppa över'}
          </button>

          <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
            {!isFirstStep && (
              <button
                className="guide-btn guide-btn-secondary"
                onClick={handlePrevious}
              >
                ← Föregående
              </button>
            )}

            <button
              className="guide-btn guide-btn-primary"
              onClick={handleNext}
              style={{ flex: 1 }}
            >
              {isLastStep ? 'Kom igång! 🚀' : 'Nästa →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
