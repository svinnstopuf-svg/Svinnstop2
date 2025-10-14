import React, { useRef, useEffect, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

const BarcodeScanner = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef(null)
  const [codeReader, setCodeReader] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)

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
            handleClose()
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

  const handleClose = () => {
    if (codeReader) {
      codeReader.reset()
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setScanning(false)
    setError(null)
    setHasPermission(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <div className="scanner-header">
          <h3>📱 Scanna streckkod</h3>
          <button onClick={handleClose} className="scanner-close">✕</button>
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
                <div className="scanner-overlay-frame">
                  <div className="scan-line"></div>
                </div>
              </div>
              
              <div className="scanner-instructions">
                <p>🎯 Rikta kameran mot streckkoden</p>
                <p>Håll enheten stadigt och se till att streckkoden är tydligt synlig</p>
              </div>
            </>
          )}
        </div>
        
        <div className="scanner-actions">
          <button onClick={handleClose} className="scanner-cancel">
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScanner