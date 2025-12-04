import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import './OnboardingGuide.css'

const OnboardingGuide = forwardRef(({ onComplete, onSkip, onStepChange }, ref) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightedElement, setHighlightedElement] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%' })
  const [waitingForAction, setWaitingForAction] = useState(false)

  const steps = [
    {
      title: 'Välkommen till Svinnstop!',
      icon: '👋',
      instruction: 'Låt oss testa appen tillsammans! Vi guidar dig genom de viktigaste funktionerna.',
      action: 'Klicka "Kom igång" för att börja',
      target: null,
      position: 'center',
      waitFor: null
    },
    {
      title: 'Lägg till en vara',
      icon: '📝',
      instruction: 'Prova att skriva "Mjölk" i namnfältet nedan.',
      action: 'Skriv "Mjölk" och tryck sedan på 🤖 AI-förslag',
      target: 'input[name="name"]',
      position: 'bottom',
      waitFor: 'itemNameFilled'
    },
    {
      title: 'AI föreslår utgångsdatum',
      icon: '🤖',
      instruction: 'Bra! Nu trycker du på knappen "🤖 AI-förslag" så får du ett smart datum.',
      action: 'Tryck på 🤖 AI-förslag',
      target: '.ai-suggestion-btn',
      position: 'top',
      waitFor: 'aiSuggestionClicked'
    },
    {
      title: 'Lägg till varan',
      icon: '➕',
      instruction: 'Perfekt! Nu ser du att AI:n har föreslagit ett utgångsdatum. Tryck på "Lägg till" för att spara varan.',
      action: 'Tryck på "Lägg till" knappen',
      target: 'button[type="submit"]',
      position: 'top',
      waitFor: 'itemAdded'
    },
    {
      title: 'Inköpslista',
      icon: '🛒',
      instruction: 'Bra jobbat! Nu har du en vara i kylskåpet. Låt oss testa inköpslistan.',
      action: 'Klicka på "Inköpslista" fliken ovan',
      target: '.tab-button:first-child',
      position: 'bottom',
      waitFor: 'shoppingTabOpened'
    },
    {
      title: 'Lägg till i inköpslistan',
      icon: '🛍️',
      instruction: 'Här planerar du dina inköp. Prova att lägga till "Äpplen" i listan.',
      action: 'Skriv "Äpplen" och lägg till',
      target: '.shopping-list',
      position: 'top',
      waitFor: 'shoppingItemAdded'
    },
    {
      title: 'Färgkodning',
      icon: '🎨',
      instruction: 'Gå tillbaka till Kylskåp-fliken och se hur varan färgkodas!\n\n🔴 Röd = Utgånget\n🟡 Gul = Går ut inom 3 dagar\n🟢 Grön = Fräscht',
      action: 'Klicka på "Kylskåp" fliken',
      target: '.tab-button:nth-child(2)',
      position: 'bottom',
      waitFor: 'inventoryTabOpened'
    },
    {
      title: 'Du är redo!',
      icon: '🎊',
      instruction: 'Grattis! Nu kan du använda Svinnstop för att minska ditt matsvinn!',
      action: 'Tips: När du handlar, bocka av varor i inköpslistan och klicka "Rensa klara" så flyttas de automatiskt till kylskåpet!',
      target: null,
      position: 'center',
      waitFor: null
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
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      setWaitingForAction(steps[nextStep].waitFor !== null)
      if (onStepChange) {
        onStepChange(nextStep, steps[nextStep])
      }
    }
  }

  // Exponera advanceStep-metoden till föräldrakomponenten
  useImperativeHandle(ref, () => ({
    advanceStep: () => {
      if (!isLastStep) {
        handleNext()
      }
    },
    getCurrentStep: () => currentStep
  }))

  // Anropas från App.jsx när användaren utfört rätt action
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep, currentStepData)
    }
  }, [currentStep])

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

        {/* Instruction */}
        <div className="guide-tooltip-description">
          {currentStepData.instruction.split('\n').map((line, i) => (
            <p key={i} style={{ margin: line ? '0 0 8px 0' : 0 }}>{line}</p>
          ))}
        </div>

        {/* Action required */}
        <div className="guide-tooltip-tip">
          {waitingForAction ? '⏳' : '👉'} <strong>{waitingForAction ? 'Gör detta:' : 'Nästa:'}</strong> {currentStepData.action}
        </div>

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

            {!waitingForAction && (
              <button
                className="guide-btn guide-btn-primary"
                onClick={handleNext}
                style={{ flex: 1 }}
              >
                {isLastStep ? 'Kom igång! 🚀' : (currentStep === 0 ? 'Kom igång →' : 'Nästa →')}
              </button>
            )}
            {waitingForAction && (
              <div className="guide-btn guide-btn-waiting" style={{ flex: 1, textAlign: 'center', opacity: 0.6 }}>
                Väntar på din handling...
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
})

export default OnboardingGuide
