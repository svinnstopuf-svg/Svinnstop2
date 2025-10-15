import React, { useRef, useEffect, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { processReceiptImage } from './receiptProcessor'

const BarcodeScanner = ({ isOpen, onClose, onScan, onReceiptScan }) => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [codeReader, setCodeReader] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)
  const [scanMode, setScanMode] = useState('barcode') // 'barcode' eller 'receipt'
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false)

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
    
    // Stäng modal
    onClose()
    console.log('Scanner stängd')
  }

  if (!isOpen) return null

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>{scanMode === 'barcode' ? '📱 Scanna streckkod' : '🧾 Scanna kvitto'}</h3>
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
          </div>
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
                />
                <canvas 
                  ref={canvasRef} 
                  style={{ display: 'none' }}
                />
                <div className="scanner-overlay-frame">
                  {scanMode === 'barcode' ? (
                    <div className="scan-line"></div>
                  ) : (
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
                </div>
              </div>
              
              <div className="scanner-instructions">
                {scanMode === 'barcode' ? (
                  <>
                    <p>🎯 Rikta kameran mot streckkoden</p>
                    <p>Håll enheten stadigt och se till att streckkoden är tydligt synlig</p>
                  </>
                ) : (
                  <>
                    <p>🧾 Centrera kvittot i bildrutan</p>
                    <p>Se till att hela kvittot syns och texten är tydlig</p>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner