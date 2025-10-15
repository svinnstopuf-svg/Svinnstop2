import React, { useRef, useEffect, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { processReceiptImage } from './receiptProcessor'
import Tesseract from 'tesseract.js'

const BarcodeScanner = ({ isOpen, onClose, onScan, onReceiptScan, onDateScan, isDateScanningMode = false, currentProduct = null, productProgress = null }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [codeReader, setCodeReader] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [scanMode, setScanMode] = useState(isDateScanningMode ? 'date' : 'barcode') // 'barcode', 'receipt' eller 'date'
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false)
  const [focusPoint, setFocusPoint] = useState(null)
  const [showFocusRing, setShowFocusRing] = useState(false)
  const [isProcessingDate, setIsProcessingDate] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [foundDates, setFoundDates] = useState([])

  useEffect(() => {
    if (isOpen && !codeReader) {
      const reader = new BrowserMultiFormatReader()
      setCodeReader(reader)
    }
    
    return () => {
      if (codeReader) {
        codeReader.reset()
      }
    }
  }, [isOpen, codeReader])

  useEffect(() => {
    if (isOpen && codeReader && videoRef.current) {
      startScanning()
    }
    
    return () => {
      if (codeReader && scanning) {
        codeReader.reset()
        setScanning(false)
      }
    }
  }, [isOpen, codeReader])

  // Escape-tangent för att stänga scanner
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        console.log('Escape-tangent tryckt, stänger scanner')
        handleClose()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Automatiskt byta till datumscanning om vi är i automatiskt läge
  useEffect(() => {
    if (isDateScanningMode) {
      setScanMode('date')
    }
  }, [isDateScanningMode])

  const startScanning = async () => {
    try {
      setError(null)
      setScanning(true)
      
      // Begär kamera-tillgång
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Bakre kamera på mobil
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      setHasPermission(true)
      videoRef.current.srcObject = stream
      
      // Starta scanning
      await codeReader.decodeFromVideoDevice(
        null, // Använd default device
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText()
            console.log('Streckkod scannad:', barcode)
            onScan(barcode)
            
            // Vänta lite så att App.jsx hinner processa onScan först
            setTimeout(() => {
              handleClose()
            }, 200)
          }
          
          if (error && !(error.name === 'NotFoundException')) {
            console.error('Scanning error:', error)
          }
        }
      )
      
    } catch (err) {
      console.error('Kamera fel:', err)
      setHasPermission(false)
      
      if (err.name === 'NotAllowedError') {
        setError('Kamera-tillgång nekad. Tillåt kamera-användning för att scanna streckkoder.')
      } else if (err.name === 'NotFoundError') {
        setError('Ingen kamera hittades på denna enhet.')
      } else {
        setError('Kunde inte starta kameran. Försök igen.')
      }
    }
  }

  const handleTapToFocus = async (event) => {
    if (!videoRef.current || !videoRef.current.srcObject) return
    
    try {
      const rect = videoRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      
      console.log('📍 Fokuserar på punkt:', { x, y })
      
      // Visa fokus-ring på tryckpunkten
      setFocusPoint({ x: x * 100, y: y * 100 })
      setShowFocusRing(true)
      
      // Hämta video track för fokusering
      const stream = videoRef.current.srcObject
      const videoTrack = stream.getVideoTracks()[0]
      
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities()
        
        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          // Försök sätta fokuspunkt
          const constraints = {
            advanced: [{
              focusMode: 'continuous',
              pointsOfInterest: [{ x, y }]
            }]
          }
          
          try {
            await videoTrack.applyConstraints(constraints)
            console.log('✅ Fokus satt på punkt')
          } catch (constraintError) {
            console.log('⚠️ Fokusering ej tillgänglig på denna enhet')
            
            // Fallback: Försök med enklare fokusering
            try {
              await videoTrack.applyConstraints({
                advanced: [{ focusMode: 'continuous' }]
              })
            } catch (fallbackError) {
              console.log('ℹ️ Automatisk fokus används')
            }
          }
        } else {
          console.log('ℹ️ Manuell fokusering stöds ej, använder autofokus')
        }
      }
      
      // Göm fokus-ring efter 1.5 sekunder
      setTimeout(() => {
        setShowFocusRing(false)
      }, 1500)
      
    } catch (error) {
      console.error('❌ Tap-to-focus fel:', error)
      setShowFocusRing(false)
    }
  }

  const captureReceipt = async () => {
    if (!videoRef.current) return
    
    try {
      setIsProcessingReceipt(true)
      
      // Skapa canvas och fånga bild från video
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      console.log('📸 Kvittobild tagen, bearbetar med OCR...')
      
      // Processa bilden med OCR
      const products = await processReceiptImage(canvas)
      
      if (products && products.length > 0) {
        console.log(`✅ Hittade ${products.length} produkter på kvittot`)
        onReceiptScan(products)
        
        // Vänta lite innan stängning så användaren ser resultatet
        setTimeout(() => {
          handleClose()
        }, 500)
      } else {
        setError('Inga produkter hittades på kvittot. Försök med bättre ljus eller håll kvittot rakare.')
      }
    } catch (error) {
      console.error('❌ Kvitto-OCR fel:', error)
      setError('Kunde inte läsa kvittot. Kontrollera att det är tydligt och försök igen.')
    } finally {
      setIsProcessingReceipt(false)
    }
  }

  // Scanna utgångsdatum med OCR
  const captureDateScan = async () => {
    if (!videoRef.current) return
    
    try {
      setIsProcessingDate(true)
      setFoundDates([])
      setOcrProgress(0)
      
      // Skapa canvas och fånga bild från video
      const canvas = canvasRef.current
      const video = videoRef.current
      const ctx = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)
      
      console.log('📅 Scannar utgångsdatum med OCR...')
      
      // OCR med Tesseract
      const result = await Tesseract.recognize(
        canvas,
        'eng+swe', // Stöd för svenska och engelska
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100))
            }
          }
        }
      )
      
      console.log('OCR resultat:', result.data.text)
      
      // Extrahera datum från OCR-text
      const dates = extractDatesFromText(result.data.text)
      
      if (dates.length > 0) {
        console.log('✅ Hittade datum:', dates)
        setFoundDates(dates)
      } else {
        setError('Inga utgångsdatum hittades. Försök hålla förpackningen närmare och se till att datumet är tydligt.')
      }
      
    } catch (error) {
      console.error('❌ Datum OCR fel:', error)
      setError('Kunde inte läsa datumet. Kontrollera belysningen och försök igen.')
    } finally {
      setIsProcessingDate(false)
      setOcrProgress(0)
    }
  }

  // Extrahera datum från OCR-text
  const extractDatesFromText = (text) => {
    const dates = []
    
    // Olika datumformat att söka efter
    const datePatterns = [
      // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
      /(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})/g,
      // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/g,
      // DD MMM YYYY, DD MMM YY (svenska månader)
      /(\d{1,2}\s+(?:jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)[a-z]*\s+\d{2,4})/gi,
      // Best före, Bäst före, Use by, Exp datum
      /(?:best\s+före|bäst\s+före|use\s+by|exp\s*:?\s*|expiry\s*:?\s*|expires?\s*:?\s*|förbruka\s+före|sista\s+förbrukningsdag)(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi
    ]
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          const cleanMatch = match.replace(/[^0-9\/\-\.]/g, '')
          if (cleanMatch.length >= 8) {
            const parsedDate = parseAndValidateDate(cleanMatch)
            if (parsedDate) {
              dates.push(parsedDate)
            }
          }
        })
      }
    })
    
    // Ta bort dubletter och sortera
    const uniqueDates = [...new Set(dates)]
    return uniqueDates.sort()
  }

  // Parsa och validera datum
  const parseAndValidateDate = (dateStr) => {
    try {
      let date
      
      // Försök olika format
      if (dateStr.match(/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}$/)) {
        // YYYY-MM-DD format
        date = new Date(dateStr.replace(/[\/\.]/g, '-'))
      } else if (dateStr.match(/^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4}$/)) {
        // DD-MM-YYYY eller MM-DD-YYYY format
        const parts = dateStr.split(/[-\/\.]/)
        // Anta europeiskt format (DD-MM-YYYY)
        date = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
      } else {
        date = new Date(dateStr)
      }
      
      // Validera att det är ett rimligt datum
      const today = new Date()
      const threeYearsFromNow = new Date()
      threeYearsFromNow.setFullYear(threeYearsFromNow.getFullYear() + 3)
      
      if (date >= today && date <= threeYearsFromNow) {
        return date.toISOString().split('T')[0]
      }
      
    } catch (error) {
      console.log('Kunde inte parsa datum:', dateStr)
    }
    
    return null
  }

  // Använd valt datum
  const selectDate = (date) => {
    if (onDateScan) {
      onDateScan(date)
    }
    setTimeout(() => {
      handleClose()
    }, 200)
  }

  const handleClose = () => {
    console.log('Stänger scanner...')
    
    try {
      // Stoppa CodeReader
      if (codeReader) {
        codeReader.reset()
        console.log('CodeReader stoppad')
      }
    } catch (err) {
      console.log('Fel vid CodeReader stop:', err)
    }
    
    try {
      // Stoppa kamera
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks()
        tracks.forEach(track => {
          track.stop()
          console.log('Kamera track stoppad:', track.kind)
        })
        videoRef.current.srcObject = null
        console.log(`Stoppade ${tracks.length} kamera-tracks`)
      }
    } catch (err) {
      console.log('Fel vid kamera stop:', err)
    }
    
    // Rensa state
    setScanning(false)
    setError(null)
    setHasPermission(null)
    setScanMode('barcode')
    setIsProcessingReceipt(false)
    setIsProcessingDate(false)
    setFoundDates([])
    setOcrProgress(0)
    
    // Stäng modal
    onClose()
    console.log('Scanner stängd')
  }

  if (!isOpen) return null

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>
            {isDateScanningMode && currentProduct ? (
              <>
                📅 Scanna utgångsdatum för:<br/>
                <span className="product-name">{currentProduct.name}</span>
                {productProgress && <span className="progress">({productProgress})</span>}
              </>
            ) : (
              <>
                {scanMode === 'barcode' && '📱 Scanna streckkod'}
                {scanMode === 'receipt' && '🧾 Scanna kvitto'}
                {scanMode === 'date' && '📅 Scanna utgångsdatum'}
              </>
            )}
          </h3>
          {!isDateScanningMode && (
            <div className="scanner-mode-toggle">
              <button 
                onClick={() => setScanMode('barcode')}
                className={`mode-btn ${scanMode === 'barcode' ? 'active' : ''}`}
                title="Streckkodsscanning"
              >
                📱
              </button>
              <button 
                onClick={() => setScanMode('receipt')}
                className={`mode-btn ${scanMode === 'receipt' ? 'active' : ''}`}
                title="Kvittoscanning"
              >
                🧾
              </button>
              <button 
                onClick={() => setScanMode('date')}
                className={`mode-btn ${scanMode === 'date' ? 'active' : ''}`}
                title="Datumscanning"
              >
                📅
              </button>
            </div>
          )}
          <button 
            onClick={handleClose} 
            className="scanner-close"
            title="Stäng scanner"
            aria-label="Stäng scanner"
          >
            ✕
          </button>
        </div>
        
        <div className="scanner-content">
          {error ? (
            <div className="scanner-error">
              <div className="error-icon">❌</div>
              <p>{error}</p>
              <button onClick={startScanning} className="retry-btn">
                🔄 Försök igen
              </button>
            </div>
          ) : hasPermission === false ? (
            <div className="scanner-permission">
              <div className="permission-icon">🔒</div>
              <p>Kamera-tillgång krävs för att scanna streckkoder.</p>
              <p>Tillåt kamera-användning i din webbläsare och försök igen.</p>
              <button onClick={startScanning} className="permission-btn">
                📹 Tillåt kamera
              </button>
            </div>
          ) : (
            <>
              <div className="scanner-video-container">
                <video
                  ref={videoRef}
                  className="scanner-video"
                  autoPlay
                  playsInline
                  muted
                  onClick={handleTapToFocus}
                  style={{ cursor: 'crosshair' }}
                />
                <canvas 
                  ref={canvasRef} 
                  style={{ display: 'none' }}
                />
                <div className="scanner-overlay-frame">
                  {scanMode === 'barcode' && (
                    <div className="scan-line"></div>
                  )}
                  {scanMode === 'receipt' && (
                    <div className="receipt-frame">
                      <div className="frame-corners"></div>
                      {isProcessingReceipt && (
                        <div className="processing-overlay">
                          <div className="spinner"></div>
                          <p>Läser kvitto...</p>
                        </div>
                      )}
                    </div>
                  )}
                  {scanMode === 'date' && (
                    <div className="date-scan-frame">
                      <div className="frame-corners"></div>
                      <div className="frame-text">Centrera utgångsdatumet här</div>
                      {isProcessingDate && (
                        <div className="processing-overlay">
                          <div className="spinner"></div>
                          <p>Läser datum... {ocrProgress}%</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Fokus-ring för tap-to-focus */}
                  {showFocusRing && focusPoint && (
                    <div 
                      className="focus-ring"
                      style={{
                        left: `${focusPoint.x}%`,
                        top: `${focusPoint.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  )}
                </div>
              </div>
              
              <div className="scanner-instructions">
                {scanMode === 'barcode' && (
                  <>
                    <p>🎯 Rikta kameran mot streckkoden</p>
                    <p>Håll enheten stadigt och se till att streckkoden är tydligt synlig</p>
                    <p>👆 Tryck på bilden för att fokusera</p>
                  </>
                )}
                {scanMode === 'receipt' && (
                  <>
                    <p>🧾 Centrera kvittot i bildrutan</p>
                    <p>Se till att hela kvittot syns och texten är tydlig</p>
                    <p>👆 Tryck på bilden för att fokusera</p>
                  </>
                )}
                {scanMode === 'date' && (
                  <>
                    {isDateScanningMode && currentProduct ? (
                      <>
                        <div className="auto-scan-info">
                          <p><strong>🎯 Automatisk datumscanning aktiv</strong></p>
                          <p>Scanna utgångsdatumet för: <strong>{currentProduct.name}</strong></p>
                          <p>Progress: {productProgress}</p>
                        </div>
                        <p>📅 Rikta kameran mot utgångsdatumet på förpackningen</p>
                        <p>När du är klar kommer nästa produkt automatiskt</p>
                      </>
                    ) : (
                      <>
                        <p>📅 Rikta kameran mot utgångsdatumet på förpackningen</p>
                        <p>Se till att datumet är tydligt och välbelyst</p>
                      </>
                    )}
                    <p>👆 Tryck på bilden för att fokusera</p>
                  </>
                )}
              </div>
              
              {scanMode === 'receipt' && (
                <div className="scanner-capture">
                  <button 
                    onClick={captureReceipt}
                    disabled={isProcessingReceipt}
                    className="capture-btn"
                  >
                    {isProcessingReceipt ? '⚙️ Bearbetar...' : '📸 Läs kvitto'}
                  </button>
                </div>
              )}
              
              {scanMode === 'date' && (
                <div className="scanner-capture">
                  <button 
                    onClick={captureDateScan}
                    disabled={isProcessingDate}
                    className="capture-btn"
                  >
                    {isProcessingDate ? `⚙️ Läser... ${ocrProgress}%` : '📅 Scanna datum'}
                  </button>
                </div>
              )}
              
              {foundDates.length > 0 && (
                <div className="found-dates">
                  <h4>🎯 Hittade datum:</h4>
                  <div className="date-options">
                    {foundDates.map((date, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectDate(date)}
                        className="date-option-btn"
                      >
                        📅 {date}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner