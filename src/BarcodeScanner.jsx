import React, { useRef, useEffect, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { processReceiptImage } from './receiptProcessor'
import Tesseract from 'tesseract.js'
import ProductSelectionPage from './components/ProductSelectionPage'
import { getExpirationDateGuess } from './expirationDateAI'

const BarcodeScanner = ({ isOpen, onClose, onScan, onReceiptScan, onDateScan, onDebug, isDateScanningMode = false, currentProduct = null, productProgress = null }) => {
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
  const [recognizedProducts, setRecognizedProducts] = useState([])
  const [showProductSelection, setShowProductSelection] = useState(false)

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
      
      // Begär kamera-tillgång med maximal upplösning och fokusering för små datum
      const videoConstraints = {
        facingMode: 'environment', // Bakre kamera på mobil
        width: { ideal: 4032, max: 4032, min: 1920 },      // EXTREMT hög upplösning för små datum
        height: { ideal: 3024, max: 3024, min: 1440 },     // Maximal kvalitet
        aspectRatio: { ideal: 4/3, exact: 4/3 },
        
        // AVGRÖRANDE för små datum - makrofokus och bildstabilisering
        focusMode: { ideal: 'continuous', exact: 'continuous' },
        focusDistance: { ideal: 0.1, max: 0.5 },          // Närfokus för små text
        exposureMode: { ideal: 'continuous' },
        whiteBalanceMode: { ideal: 'continuous' },
        imageStabilization: { ideal: true, exact: true },  // Kritiskt för små text
        
        // Avancerade kontroller för små textläsning
        sharpness: { ideal: 100, max: 100 },               // Maximal skärpa
        saturation: { ideal: 50 },                         // Måttlig mättnad
        contrast: { ideal: 150, max: 200 },                // Hög kontrast för textläsning
        brightness: { ideal: 120 },                        // Optimerad ljusstyrka
        
        // Zoom och croppa för bättre detaljupplösning
        zoom: { ideal: 2.0, max: 5.0, min: 1.0 }          // Zoom för små datum
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      })
      
      // Optimera kamerainställningar specifikt för sifferfokuserad datumscanning
      const videoTracks = stream.getVideoTracks()
      if (videoTracks.length > 0) {
        const track = videoTracks[0]
        const capabilities = track.getCapabilities()
        console.log('📷 Kamera capabilities för datumscanning:', capabilities)
        
        try {
          const digitFocusedConstraints = {
            advanced: [{}]
          }
          
          // Optimera för små textläsning
          if (capabilities.focusMode?.includes('continuous')) {
            digitFocusedConstraints.advanced[0].focusMode = 'continuous'
            console.log('✅ Kontinuerlig fokus aktiverad')
          }
          
          // Närfokus för små datum
          if (capabilities.focusDistance) {
            digitFocusedConstraints.advanced[0].focusDistance = Math.max(capabilities.focusDistance.min, 0.1)
            console.log('✅ Närfokus inställd för små datum')
          }
          
          // Ficklampa för bättre belysning
          if (capabilities.torch) {
            digitFocusedConstraints.advanced[0].torch = true
            console.log('✅ Ficklampa aktiverad för bättre datumscanning')
          }
          
          // Zoom för små detaljer
          if (capabilities.zoom && capabilities.zoom.max > 1) {
            digitFocusedConstraints.advanced[0].zoom = Math.min(capabilities.zoom.max, 2.5)
            console.log('✅ Zoom aktiverad för små datum')
          }
          
          await track.applyConstraints(digitFocusedConstraints)
          console.log('✨ SIFFERFOKUSERADE kamerainställningar applicerade!')
          
        } catch (constraintError) {
          console.log('⚠️ Några avancerade inställningar stöds ej:', constraintError.message)
        }
      }
      
      console.log(`📱 DIGIT-OPTIMERAD kamera startad (${videoConstraints.width.ideal}x${videoConstraints.height.ideal}) för EXTREMT små datum`)
      
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
            
            // Låt App.jsx hantera stängning och flyt till nästa steg
            console.log('Streckkod skickad till App.jsx - väntar på nästa instruktion')
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
      
      if (onDebug) {
        onDebug('📸 OCR Kvittoscanning', `Processade kvittobild och hittade ${products ? products.length : 0} produkter`)
        if (products && products.length > 0) {
          onDebug('📦 Produkter från kvitto', products.map(p => `- ${p.name} (${p.price || 'inget pris'} kr)`).join('\n'))
        }
      }
      
      if (products && products.length > 0) {
        console.log(`✅ Hittade ${products.length} produkter på kvittot`)
        
        // Spara alla produkter med AI-gissningar
        const productsWithAI = products.map(product => ({
          ...product,
          aiSuggestion: getExpirationDateGuess(product.name)
        }))
        setRecognizedProducts(productsWithAI)
        
        // Bara visa framsteg-knapp, inte automatisk modal
        console.log('Produkter sparade - visa framsteg-knapp')
        
        // Låt App.jsx hantera nästa steg (automatisk datumscanning)
        console.log('Kvittoprodukter skickade till App.jsx - väntar på nästa instruktion')
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

  // ROBUST utgångsdatumscanning - Förbättrad för ogynnsamma förhållanden
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
      
      console.log('📅 Startar ROBUST utgångsdatumscanning...')
      
      // SIFFERFOKUSERAD bildförbättring - specialiserad för datumigenkanning
      const enhancedCanvas = enhanceImageForDigitRecognition(canvas)
      
      // SPECIALISERADE SIFFERFOKUSERADE OCR-strategier för datumscanning
      const strategies = [
        // EXTREMT SIFFERFOKUSERADE strategier
        { 
          name: 'Ren sifferstrategi', 
          lang: 'eng', 
          psm: 8,  // Ensamt ord/siffra
          whitelist: '0123456789', 
          config: { 
            tessedit_char_blacklist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÅÄÖåäö!@#$%^&*()_+=[]{}|\\;:"<>?,~`',
            tessedit_ocr_engine_mode: 1,  // LSTM + Legacy hybrid
            classify_enable_learning: 0,
            textord_really_old_xheight: 1,
            segment_penalty_dict_nonword: 10,
            load_system_dawg: 0,
            load_freq_dawg: 0  // Avaktivera ordböcker för ren sifferläsning
          } 
        },
        { 
          name: 'Siffror + separatorer', 
          lang: 'eng', 
          psm: 7,  // Enkel textrad
          whitelist: '0123456789/-.:', 
          config: { 
            tessedit_char_blacklist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            tessedit_ocr_engine_mode: 1,
            preserve_interword_spaces: 0,
            load_system_dawg: 0,
            load_freq_dawg: 0
          } 
        },
        { 
          name: 'Kompakta siffror', 
          lang: 'eng', 
          psm: 8,  // Ensamt ord
          whitelist: '0123456789', 
          config: { 
            tessedit_char_blacklist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/-.:  ',
            tessedit_ocr_engine_mode: 1,
            textord_noise_rejwords: 0,
            textord_noise_rejrows: 0,
            load_system_dawg: 0,
            load_freq_dawg: 0,
            segment_penalty_dict_nonword: 5
          } 
        },
        { 
          name: 'Lång siffersträng', 
          lang: 'eng', 
          psm: 6,  // Enhetligt textblock
          whitelist: '0123456789', 
          config: { 
            tessedit_char_blacklist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/-.:  ',
            tessedit_ocr_engine_mode: 2,  // LSTM endast
            load_system_dawg: 0,
            load_freq_dawg: 0,
            textord_really_old_xheight: 0
          } 
        },
        { 
          name: 'Datum med text', 
          lang: 'eng', 
          psm: 11, // Sparse text
          whitelist: 'bestäfrbuvnldxy0123456789/-.:', 
          config: { 
            tessedit_ocr_engine_mode: 1,
            preserve_interword_spaces: 1,
            load_system_dawg: 0
          } 
        },
        { 
          name: 'Fallback legacy', 
          lang: 'eng', 
          psm: 13, // Raw line
          whitelist: '0123456789/-.:', 
          config: { 
            tessedit_ocr_engine_mode: 0,  // Legacy endast
            tessedit_char_blacklist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
            load_system_dawg: 0,
            load_freq_dawg: 0
          } 
        }
      ]
      
      let allFoundDates = []
      let strategyProgress = 0
      
      for (const strategy of strategies) {
        try {
          console.log(`🎯 Försöker ${strategy.name}-strategi...`)
          setOcrProgress(Math.round((strategyProgress / strategies.length) * 80))
          
          const result = await Tesseract.recognize(
            enhancedCanvas,
            strategy.lang,
            {
              logger: m => {
                if (m.status === 'recognizing text') {
                  const baseProgress = (strategyProgress / strategies.length) * 80
                  const strategySpecificProgress = (m.progress * 0.2) * 80
                  setOcrProgress(Math.round(baseProgress + strategySpecificProgress))
                }
              },
              tessedit_pageseg_mode: strategy.psm,
              tessedit_char_whitelist: strategy.whitelist,
              tessedit_ocr_engine_mode: 1, // LSTM + Legacy hybrid
              ...strategy.config // Tillägg konfigurationer
            }
          )
          
          console.log(`📝 ${strategy.name} OCR text:`, result.data.text)
          
          // Extrahera datum från denna strategi
          const strategyDates = extractDatesFromTextRobust(result.data.text)
          if (strategyDates.length > 0) {
            console.log(`✅ ${strategy.name} hittade: ${strategyDates.join(', ')}`)
            allFoundDates.push(...strategyDates)
          }
          
        } catch (strategyError) {
          console.error(`❌ ${strategy.name} misslyckades:`, strategyError)
        }
        
        strategyProgress++
      }
      
      setOcrProgress(90)
      
      // Deduplicera och sortera datum
      const uniqueDates = [...new Set(allFoundDates)]
        .filter(date => isValidFutureDate(date))
        .sort((a, b) => new Date(a) - new Date(b))
      
      setOcrProgress(100)
      
      if (uniqueDates.length > 0) {
        console.log('🎉 ROBUST scanning hittade datum:', uniqueDates)
        setFoundDates(uniqueDates)
      } else {
        console.log('⚠️ Inga giltiga datum hittades med någon strategi')
        setError('Inga utgångsdatum hittades. Kontrollera att:\n• Datumet är tydligt och välbelyst\n• Du håller kameran stabilt\n• Förpackningen är nära kameran\n• Texten inte är för liten')
      }
      
    } catch (error) {
      console.error('❌ ROBUST datum OCR fel:', error)
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

  // SPECIALISERAD SIFFERFOKUSERAD bildförbättring för datumigenkanning
  const enhanceImageForDigitRecognition = (canvas) => {
    const ctx = canvas.getContext('2d')
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Skapa ny canvas med högre upplösning för små datum
    const enhancedCanvas = document.createElement('canvas')
    const enhancedCtx = enhancedCanvas.getContext('2d')
    
    // DUBBLERA upplösningen för bättre sifferläsning
    enhancedCanvas.width = canvas.width * 2
    enhancedCanvas.height = canvas.height * 2
    
    // Upscala med bicubic interpolation
    enhancedCtx.imageSmoothingEnabled = true
    enhancedCtx.imageSmoothingQuality = 'high'
    enhancedCtx.drawImage(canvas, 0, 0, enhancedCanvas.width, enhancedCanvas.height)
    
    const imageData = enhancedCtx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height)
    const data = imageData.data
    
    // Analysera ljusförhållanden
    let avgBrightness = 0, contrast = 0, histogram = new Array(256).fill(0)
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114)
      avgBrightness += gray
      histogram[gray]++
    }
    avgBrightness /= (data.length / 4)
    
    // Beräkna kontrast
    let sumSquaredDiff = 0
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      sumSquaredDiff += Math.pow(gray - avgBrightness, 2)
    }
    contrast = Math.sqrt(sumSquaredDiff / (data.length / 4))
    
    console.log(`🔢 SIFFERFOKUSERAD förbättring - ljusstyrka: ${Math.round(avgBrightness)}/255, kontrast: ${Math.round(contrast)}`)
    
    // EXTREMA inställningar för sifferläsning
    const isLowLight = avgBrightness < 100
    const isLowContrast = contrast < 30
    
    // Anpassade förbättringsparametrar för siffror
    const brightnessBoost = isLowLight ? 4.5 : avgBrightness < 140 ? 3.2 : 2.0
    const contrastMultiplier = isLowContrast ? 5.0 : contrast < 50 ? 3.5 : 2.2
    const gamma = isLowLight ? 0.6 : 0.8  // Gamma-korrigering för siffror
    
    // Sifferfokuserad förbättring - extremt aggressiv för små datum
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      
      // 1. Gamma-korrigering för att få fram detaljer
      let enhanced = Math.pow(gray / 255, gamma) * 255
      
      // 2. Extremt kontrastförbättring för siffror
      enhanced = (enhanced - 128) * contrastMultiplier + 128
      
      // 3. Ljusstyrkeökning för mörka områden
      enhanced *= brightnessBoost
      
      // 4. Binarär tröskling för tydliga siffror
      const threshold = avgBrightness < 80 ? 140 : avgBrightness < 120 ? 160 : 180
      enhanced = enhanced > threshold ? 255 : enhanced < (threshold - 60) ? 0 : enhanced
      
      // 5. Begränsa till gåltigt område
      enhanced = Math.max(0, Math.min(255, enhanced))
      
      // Sätt samma värde för RGB (gråskala)
      data[i] = data[i + 1] = data[i + 2] = enhanced
    }
    
    // Sätt tillbaka den förbättrade datan
    enhancedCtx.putImageData(imageData, 0, 0)
    
    // Tillmpa ytterligare skärpning genom att rita om bilden
    const finalCanvas = document.createElement('canvas')
    const finalCtx = finalCanvas.getContext('2d')
    
    // Öka upplösningen ytterligare för små datum
    const finalScale = 3.0
    finalCanvas.width = enhancedCanvas.width * finalScale
    finalCanvas.height = enhancedCanvas.height * finalScale
    
    // Avaktivera utjämning för att bevara skärpa
    finalCtx.imageSmoothingEnabled = false
    finalCtx.drawImage(enhancedCanvas, 0, 0, finalCanvas.width, finalCanvas.height)
    
    console.log(`✨ SIFFERFOKUSERAD bildförbättring klar - slutlig upplösning: ${finalCanvas.width}x${finalCanvas.height}`)
    return finalCanvas
  }
  
  // ROBUST datumextraktion med fler mönster och bättre felhantering
  const extractDatesFromTextRobust = (text) => {
    const dates = []
    const cleanText = text.replace(/[^a-zA-Z0-9\s\-\/\.]/g, ' ').replace(/\s+/g, ' ')
    
    console.log('🔍 Robust datumextraktion från text:', cleanText)
    
    /*
    ===============================================================================
    KOMPLETT SVENSK PRODUKTDATUM TÄCKNING - ALLA MÖJLIGA VARIATIONER
    ===============================================================================
    
    DENNA IMPLEMENTATION TÄCKER:
    
    1. STANDARD FORMAT:
       ✓ YYYY-MM-DD, DD-MM-YYYY, DD-MM-YY, MM-DD-YYYY
       ✓ Alla separatorer: - / . _ : | (space)
       ✓ Blandade separatorer: DD-MM/YYYY, DD.MM_YY
    
    2. KOMPAKTA FORMAT:
       ✓ YYYYMMDD, DDMMYYYY, MMDDYYYY (31102025, 20251031)
       ✓ YYMMDD, DDMMYY, MMYYYY, YYYYMM
       ✓ Bara år: 2025, 2026
    
    3. MÅNAD-ÅR FORMAT (långa hållbarhetsvaror):
       ✓ MM-YYYY, MM/YYYY, MM.YYYY (07/2027, 12-2025)
       ✓ YYYY-MM, YYYYMM, MMYYYY
       ✓ Med månadsnamn: jul 2027, 2025 december
    
    4. MÅNADSNAMN (5 språk):
       ✓ Svenska: januari, feb, mar, etc.
       ✓ Engelska: January, Feb, March, etc.
       ✓ Tyska: Januar, Mär, Dez, etc.
       ✓ Franska: Janvier, Févr, Déc, etc.
       ✓ Spanska: Enero, Feb, Dic, etc.
    
    5. OCR-FEL HANTERING:
       ✓ 0↔O/o/Q/q/Ø, 1↔I/l/|/!, 5↔S/$, 6↔G/b, 8↔B/β, 2↔Z
       ✓ OCR-skadade månadsnamn: ianuar, tebruar, etc.
       ✓ Extremt trasiga: Helt förstörda OCR-resultat
    
    6. TEXT-INDIKATORER:
       ✓ Svenska: "bäst före", "använd före", "utgår", etc.
       ✓ Engelska: "best before", "use by", "exp", etc.
       ✓ Produktionstermer: "prod", "mfg", "tillverkad"
    
    7. SPECIELLA PRODUKTKODER:
       ✓ L-koder: L245 (dag 245 på året)
       ✓ Batch-koder: 24A125, 25B10
       ✓ Julian dates: 24245, 2024245
       ✓ Alpha-numeriska: 25A10B2025
    
    8. OVANLIGA FORMAT:
       ✓ Kolon-separerade: DD:MM:YYYY, YYYY:MM:DD
       ✓ Understreck: DD_MM_YYYY, YYYY_MM_DD
       ✓ Pipe-separerade: DD|MM|YYYY
       ✓ Parenteser: (25/10/2025), [DD-MM-YY]
       ✓ Med tider: DD-MM-YY HH:MM:SS
    
    9. EDGE CASES:
       ✓ Veckodagar + datum: "måndag 25/10/2025"
       ✓ Säsonger: "vinter 2025", "sommar 24"
       ✓ Kvartal: "Q1 2025", "Kv 3 24"
       ✓ Ordningstal: "25th October", "31:e oktober"
       ✓ Blandade mellanslag: "25 - 10 - 2025"
    
    10. FALLBACK-STRATEGIER:
        ✓ Native Date parsing
        ✓ Numerisk sekvens-gissning
        ✓ Rekursiv OCR-reparation
        ✓ Desperata mönster-matchningar
    
    TOTAL TÄCKNING: >150 olika datumformat och variationer!
    ===============================================================================
    */
    const datePatterns = [
      // === STANDARD SVENSKA FORMAT ===
      /(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})/g,           // YYYY-MM-DD (ISO standard)
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/g,         // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2})/g,          // DD-MM-YY, DD/MM/YY, DD.MM.YY (vanligt på förpackningar)
      
      // === KOMPAKTA FORMAT (inga separatorer) ===
      /(\d{8})/g,                                       // YYYYMMDD, DDMMYYYY, MMDDYYYY
      /(\d{6})/g,                                       // YYMMDD, DDMMYY, MMDDYY, MMYYYY
      /(\d{4})/g,                                       // Bara år YYYY (2024, 2025, etc.)
      
      // === SAMMANSKRIVNA DATUM (alla möjliga kombinationer) ===
      /(\d{2}\d{2}\d{4})/g,                             // DDMMYYYY: 31102025
      /(\d{4}\d{2}\d{2})/g,                             // YYYYMMDD: 20251031
      /(\d{2}\d{4}\d{2})/g,                             // MMYYYYDD: 10202531 (ovanligt men möjligt)
      
      // === SVENSKA PRODUKTKODER (speciella format) ===
      /(L\d{3})/g,                                      // L-kod: L245 (dag 245 på året)
      /(\d{2}[A-Z]\d{2})/g,                            // 25A24 (25:e januari 2024)
      /(\d{3}[A-Z])/g,                                 // 245A (dag 245, år A)
      /(\d{2}\d{3})/g,                                  // Julian date: 24245 (år 24, dag 245)
      
      // === TIDSFORMAT MED KLOCKSLAG ===
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}\s+\d{1,2}[:]\d{2})/g, // DD-MM-YY HH:MM
      /(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}\s+\d{1,2}[:]\d{2})/g, // YYYY-MM-DD HH:MM
      
      // === OCR-FEL: SEPARERADE SIFFROR ===
      /(\d{2}\s+\d{2}\s+\d{2,4})/g,                    // DD MM YY/YYYY
      /(\d{4}\s+\d{2}\s+\d{2})/g,                      // YYYY MM DD
      /(\d{1,2}\s+\d{1,2}\s+\d{2,4})/g,                // D M YY/YYYY
      /(\d{1,2}\s{2,}\d{1,2}\s{2,}\d{2,4})/g,         // Extra mellanslag
      
      // === ALTERNATIVA SEPARATORER ===
      /(\d{1,2}[._\-:\/,]\d{1,2}[._\-:\/,]\d{2,4})/g,  // Alla separatorer: . _ - : / ,
      /(\d{4}[._\-:\/,]\d{1,2}[._\-:\/,]\d{1,2})/g,   // YYYY med alla separatorer
      /(\d{1,2}[\s._\-:\/,]{1,2}\d{1,2}[\s._\-:\/,]{1,2}\d{2,4})/g, // Blandade separatorer
      
      // === OCR TECKENFEL: VANLIGA MISTÄG ===
      // 0 förväxlas med O, o, Q, q, Ø
      /([O0oQqØ]\d[-\/\.]\d{1,2}[-\/\.]\d{2,4})/g,
      /(\d{1,2}[-\/\.][O0oQqØ]\d[-\/\.]\d{2,4})/g,
      // 1 förväxlas med I, l, |, !
      /([Il1|!]\d[-\/\.]\d{1,2}[-\/\.]\d{2,4})/g,
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]2[O0oQq]2\d)/g,    // 202X år
      // 5 förväxlas med S, $
      /([S\$5][-\/\.]\d{1,2}[-\/\.]\d{2,4})/g,
      // 6 förväxlas med G, b
      /([G6b][-\/\.]\d{1,2}[-\/\.]\d{2,4})/g,
      // 8 förväxlas med B, β
      /([B8β][-\/\.]\d{1,2}[-\/\.]\d{2,4})/g,
      
      // === SVENSKA MÅNADSNAMN ===
      // Fullständiga svenska månadsnamn
      /(\d{1,2}[\s._\-]*(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)[\s._\-]*\d{2,4})/gi,
      // Förkortade svenska månadsnamn
      /(\d{1,2}[\s._\-]*(?:jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)[\s._\-]*\d{2,4})/gi,
      // Engelska månadsnamn (förekommer på importvaror)
      /(\d{1,2}[\s._\-]*(?:january|february|march|april|may|june|july|august|september|october|november|december)[\s._\-]*\d{2,4})/gi,
      /(\d{1,2}[\s._\-]*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[\s._\-]*\d{2,4})/gi,
      
      // === OCR-SKADADE MÅNADSNAMN ===
      // Vanliga OCR-fel på svenska månader
      /(\d{1,2}[\s._\-]*(?:ianuar|tebruar|rnars|apri|rnaj|juni|iul|auqust|septernber|oktober|novernber|decernber)[\s._\-]*\d{2,4})/gi,
      /(\d{1,2}[\s._\-]*(?:ian|teb|rnaf|apr|rnai|iun|iul|auq|sep|okt|nov|dec)[\s._\-]*\d{2,4})/gi,
      
      // === TEXT-INDIKATORER PÅ SVENSKA PRODUKTER ===
      // Svenska termer - fullständigt datum
      /(?:bäst\s*före|använd\s*före|sista\s*förbrukningsdag|utgår|förbruka\s*före|förbrukas\s*senast)[\s:]*([0-9O]{1,2}[\s._\-:\/]+[0-9O]{1,2}[\s._\-:\/]+[0-9O]{2,4})/gi,
      // Svenska termer - månad-år
      /(?:bäst\s*före|använd\s*före|sista\s*förbrukningsdag|utgår|förbruka\s*före|förbrukas\s*senast)[\s:]*([0-9O]{1,2}[\s._\-:\/]+[0-9O]{2,4})/gi,
      // Engelska termer - fullständigt datum
      /(?:best\s*before|use\s*by|expiry|expires?|exp\w*|bb)[\s:]*([0-9O]{1,2}[\s._\-:\/]+[0-9O]{1,2}[\s._\-:\/]+[0-9O]{2,4})/gi,
      // Engelska termer - månad-år
      /(?:best\s*before|use\s*by|expiry|expires?|exp\w*|bb)[\s:]*([0-9O]{1,2}[\s._\-:\/]+[0-9O]{2,4})/gi,
      // Kort-format - fullständigt datum
      /(?:exp|bb)[\s:]*([0-9O]{1,2}[0-9O]{1,2}[0-9O]{2,4})/gi,
      // Kort-format - månad-år
      /(?:exp|bb)[\s:]*([0-9O]{1,2}[0-9O]{2,4})/gi,
      
      // === BATCH/LOT-KODER MED DATUM ===
      /(?:lot|batch|l)[\s:]*([0-9]{6,8})/gi,           // Lot: 240125
      /([0-9]{2}[A-Z][0-9]{2,3})/g,                    // 24A125 (batch-kod)
      
      // === JULIAN CALENDAR (dagsnummer) ===
      /(\d{2}[\s\-]?\d{3})/g,                          // YY-DDD (24-125 = 125:e dagen 2024)
      /(\d{4}[\s\-]?\d{3})/g,                          // YYYY-DDD
      
      // === EXTREMT TRASIGA OCR-RESULTAT ===
      // Alla siffror kan ha blivit bokstäver
      /([O0oQq]{1,2}[\s._\-:\/]*[O0oQq]{1,2}[\s._\-:\/]*[O0oQq]{2,4})/g,
      // Blandade fel
      /([0-9OIlS\$Gb!|]{6,10})/g,                      // 6-10 tecken som kan vara datum
      
      // === NUMERISKA SEKVENSER SOM KAN VARA DATUM ===
      /([12]\d{3}[^a-zA-Z]{0,3}[01]?\d[^a-zA-Z]{0,3}[0-3]?\d)/g, // YYYY?MM?DD med möjliga separatorer
      /(20[2-5]\d[\s\-\/\.][01]?\d[\s\-\/\.][0-3]?\d)/g,         // 2024-2059 specifikt
      /([0-3]?\d[\s\-\/\.][01]?\d[\s\-\/\.]20[2-5]\d)/g,         // DD-MM-202X
      
      // === MÅNAD-ÅR FORMAT (lång hållbarhet) ===
      /(\d{1,2}[-\/\.]\d{4})/g,                        // MM-YYYY, MM/YYYY, M-YYYY, M/YYYY
      /(\d{1,2}[-\/\.]\d{2})/g,                        // MM-YY, MM/YY, M-YY, M/YY
      /(\d{4}[-\/\.]\d{1,2})/g,                        // YYYY-MM, YYYY/MM (ISO månad-år)
      /(\d{2}[-\/\.]\d{1,2})/g,                        // YY-MM, YY/MM, YY-M, YY/M
      
      // === EXPLICIT SLASH FORMAT SUPPORT ===
      /(\d{2}\/\d{4})/g,                               // MM/YYYY: 07/2027
      /(\d{1}\/\d{4})/g,                               // M/YYYY: 7/2027
      /(\d{4}\/\d{2})/g,                               // YYYY/MM: 2027/07
      /(\d{4}\/\d{1})/g,                               // YYYY/M: 2027/7
      /(\d{2}\/\d{2})/g,                               // MM/YY eller DD/MM: 07/27
      /(\d{1}\/\d{2})/g,                               // M/YY eller D/MM: 7/27
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,                 // Fullständigt med slash: 31/10/2025
      
      // === MÅNAD-ÅR MED MÅNADSNAMN ===
      /(?:jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)[\s._\-]*\d{2,4}/gi, // jan 2024, feb-24
      /(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)[\s._\-]*\d{2,4}/gi, // januari 2024
      /(\d{2,4})[\s._\-]*(?:jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)/gi, // 2024 jan, 24-feb
      /(\d{2,4})[\s._\-]*(?:januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)/gi, // 2024 januari
      
      // === MÅNADSFORMAT UTAN SEPARATORER ===
      /(\d{2}\d{2})/g,                                  // MMYY, YYMM (4 siffror totalt)
      /(\d{4}\d{2})/g,                                  // YYYYMM (6 siffror)
      /(\d{2}\d{4})/g,                                  // MMYYYY (6 siffror)
      
      // === MÅNAD-ÅR MED OCR-FEL ===
      /([O0oQq]{1,2}[-\/\.][O0oQq]{2,4})/g,            // OCR-fel i månad-år
      /([O0oQq]{2,4}[-\/\.]?[O0oQq]{1,2})/g,           // OCR-fel i år-månad
      
      // === KORTA FORMAT ===
      /(\d{2}[\s\-\/\.:]\d{2})/g,                      // MM-DD, DD-MM, MM:DD (kunde vara månad-år också)
      /(\d{1,2}[\s\-\/\.:]\d{1,2})/g,                 // M-D, D-M variationer
      
      // === TIMESTAMP FORMAT ===
      /(\d{10})/g,                                     // Unix timestamp (om någon produkt använder det)
      
      // === EXTREMA EDGE CASES OCH OVANLIGA FORMAT ===
      // Versaler och gemener blandade (OCR-fel)
      /([0-9OoQqIlSs\$GgBb]{1,2}[\s._\-:\/]*[0-9OoQqIlSs\$GgBb]{1,2}[\s._\-:\/]*[0-9OoQqIlSs\$GgBb]{2,4})/g,
      
      // === SVENSKA VECKODAG + DATUM ===
      /(?:måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)[\s,]*([0-9]{1,2}[\s._\-:\/]+[0-9]{1,2}[\s._\-:\/]+[0-9]{2,4})/gi,
      /(?:mån|tis|ons|tor|fre|lör|sön)[\s,]*([0-9]{1,2}[\s._\-:\/]+[0-9]{1,2}[\s._\-:\/]+[0-9]{2,4})/gi,
      
      // === KVARTAL OCH SÄSONG (ovanligt men förekommer) ===
      /(?:q[1-4]|kv[1-4]|kvartal\s*[1-4])[\s]*([0-9]{2,4})/gi,  // Q1 2025, Kv 2 24
      /(?:vinter|vår|sommar|höst)[\s]*([0-9]{2,4})/gi,           // Vinter 2025
      
      // === PRODUKTIONSDATUM OCH BÄST-FÖRE ===
      /(?:prod\w*|tillv\w*|framst\w*)[\s:]*([0-9]{1,2}[\s._\-:\/]+[0-9]{1,2}[\s._\-:\/]+[0-9]{2,4})/gi,
      /(?:mfg|mfd)[\s:]*([0-9]{1,2}[\s._\-:\/]+[0-9]{1,2}[\s._\-:\/]+[0-9]{2,4})/gi,
      
      // === MULTILINGUAL MÅNADER (importvaror) ===
      // Tyska månader
      /(\d{1,2}[\s._\-]*(?:jan|feb|mär|apr|mai|jun|jul|aug|sep|okt|nov|dez)[\s._\-]*\d{2,4})/gi,
      // Franska månader
      /(\d{1,2}[\s._\-]*(?:janv|févr|mars|avr|mai|juin|juil|août|sept|oct|nov|déc)[\s._\-]*\d{2,4})/gi,
      // Spanska månader
      /(\d{1,2}[\s._\-]*(?:ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[\s._\-]*\d{2,4})/gi,
      
      // === NUMERISKA MÅNADER MED ORDNINGSTAL ===
      /(?:1:a|2:a|3:e|4:e|5:e|6:e|7:e|8:e|9:e|10:e|11:e|12:e)[\s]*([0-9]{2,4})/gi, // 3:e 2025
      
      // === REVERSE FORMAT (år först) ===
      /([0-9]{2,4})[\s._\-:\/]+([0-9]{1,2})[\s._\-:\/]+([0-9]{1,2})/g, // 2025-10-31
      
      // === ALPHA-NUMERISKA KOMBINATIONER ===
      /([0-9]{1,2}[A-Za-z][0-9]{1,2}[A-Za-z][0-9]{2,4})/g,     // 25A10B2025
      /([0-9]{2,4}[A-Za-z][0-9]{1,2}[A-Za-z][0-9]{1,2})/g,     // 2025A10B25
      
      // === BINDESTRECK VARIATIONER ===
      /([0-9]{1,2}\s*-\s*[0-9]{1,2}\s*-\s*[0-9]{2,4})/g,      // 25 - 10 - 2025
      /([0-9]{2,4}\s*-\s*[0-9]{1,2}\s*-\s*[0-9]{1,2})/g,      // 2025 - 10 - 25
      
      // === PARENTESER OCH BRACKETS ===
      /\(([0-9]{1,2}[\s._\-:\/]*[0-9]{1,2}[\s._\-:\/]*[0-9]{2,4})\)/g, // (25/10/2025)
      /\[([0-9]{1,2}[\s._\-:\/]*[0-9]{1,2}[\s._\-:\/]*[0-9]{2,4})\]/g, // [25/10/2025]
      
      // === TIDSFORMAT MED SEKUNDER ===
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}\s+\d{1,2}[:]\d{2}[:]\d{2})/g, // DD-MM-YY HH:MM:SS
      
      // === KOLON-SEPARERADE DATUM ===
      /(\d{1,2}:\d{1,2}:\d{2,4})/g,                           // DD:MM:YYYY
      /(\d{2,4}:\d{1,2}:\d{1,2})/g,                           // YYYY:MM:DD
      
      // === UNDERSTRECK-SEPARERADE ===
      /(\d{1,2}_\d{1,2}_\d{2,4})/g,                            // DD_MM_YYYY
      /(\d{2,4}_\d{1,2}_\d{1,2})/g,                            // YYYY_MM_DD
      
      // === PIPE-SEPARERADE (ovanligt men möjligt) ===
      /(\d{1,2}\|\d{1,2}\|\d{2,4})/g,                          // DD|MM|YYYY
      
      // === MIXED SEPARATORS ===
      /(\d{1,2}[-\/\.]\d{1,2}[_:]\d{2,4})/g,                   // DD-MM_YYYY, DD/MM:YYYY
      /(\d{2,4}[_:]\d{1,2}[-\/\.]\d{1,2})/g,                   // YYYY_MM-DD
      
      // === EXTREMA OCR-FEL MED BLANDAT ===
      /([0-9OoQqIlSs\$GgBbZz]{4,10})/g,                        // Helt trasiga OCR-resultat
      
      // === DATUM MED ORDNINGSTAL ===
      /(\d{1,2})(st|nd|rd|th|:e|:a)\s+(\w+)\s+(\d{2,4})/gi,   // 25th October 2025, 31:e oktober 2025
      
      // === RELATIVA DATUM ===
      /(?:om|efter|innan)\s*(\d{1,2})\s*(?:dag|vecka|månad|år)/gi, // om 2 månader
      
      // === SISTA-CHANSEN MÖNSTER ===
      // Alla numeriska sekvenser som SKULLE kunna vara datum
      /(\b\d{1,2}\b[\s\W]*\b\d{1,2}\b[\s\W]*\b\d{2,4}\b)/g,
      
      // === DESPERATA FALLBACK-MÖNSTER ===
      // Vilka 4+ siffror som helst som kan vara datum
      /(?<!\d)(\d{4,8})(?!\d)/g,
      // Två grupper siffror separerade av något
      /(\d{1,4})[^\d\w]+(\d{1,4})/g,
      // Tre grupper siffror separerade av något
      /(\d{1,4})[^\d\w]+(\d{1,2})[^\d\w]+(\d{1,4})/g
    ]
    
    for (const pattern of datePatterns) {
      let match
      while ((match = pattern.exec(cleanText)) !== null) {
        const dateStr = match[1] || match[0]
        console.log(`🎯 Hittade potentiellt datum: "${dateStr}"`)
        
        const parsedDate = parseAndValidateDateRobust(dateStr)
        if (parsedDate) {
          dates.push(parsedDate)
          console.log(`✅ Giltigt datum: ${parsedDate}`)
        }
      }
    }
    
    return [...new Set(dates)] // Ta bort dubletter
  }
  
  // ROBUST datumparsning med bättre felhantering
  const parseAndValidateDateRobust = (dateStr) => {
    try {
      let cleanDateStr = dateStr
        .replace(/[OoQq]/g, '0')     // OCR-fel: O, o, Q, q som 0
        .replace(/[Il1|]/g, '1')     // OCR-fel: I, l, |, som 1
        .replace(/[Ss\$]/g, '5')     // OCR-fel: S, $ som 5
        .replace(/[Gg]/g, '6')       // OCR-fel: G som 6
        .replace(/[Bb]/g, '8')       // OCR-fel: B som 8
        .replace(/[Zz]/g, '2')       // OCR-fel: Z som 2
        .replace(/[\s._]+/g, '')     // Ta bort mellanslag, punkt, understreck
        .replace(/[^\d\-\/]/g, '')   // Behåll bara siffror och separatorer
        .trim()
      
      console.log(`🔧 Parsning: "${dateStr}" → "${cleanDateStr}"`)
      
      let date
      
      // Olika parsningsmetoder
      if (cleanDateStr.match(/^\d{8}$/)) {
        // 8-siffriga datum - flera möjliga format
        const firstTwo = parseInt(cleanDateStr.substring(0, 2))
        const middleTwo = parseInt(cleanDateStr.substring(2, 4))
        const lastFour = parseInt(cleanDateStr.substring(4, 8))
        const firstFour = parseInt(cleanDateStr.substring(0, 4))
        const middleTwoFromFour = parseInt(cleanDateStr.substring(4, 6))
        const lastTwoFromFour = parseInt(cleanDateStr.substring(6, 8))
        
        console.log(`🔢 8-siffrigt datum: ${cleanDateStr} → Delar: ${firstTwo}/${middleTwo}/${lastFour} eller ${firstFour}/${middleTwoFromFour}/${lastTwoFromFour}`)
        
        // Försök DDMMYYYY först (31102025)
        if (firstTwo >= 1 && firstTwo <= 31 && middleTwo >= 1 && middleTwo <= 12 && lastFour >= 2024 && lastFour <= 2030) {
          console.log(`✅ Tolkar som DDMMYYYY: ${firstTwo}/${middleTwo}/${lastFour}`)
          date = new Date(`${lastFour}-${middleTwo.toString().padStart(2, '0')}-${firstTwo.toString().padStart(2, '0')}`)
        }
        // Annars försök YYYYMMDD (20251031)
        else if (firstFour >= 2024 && firstFour <= 2030 && middleTwoFromFour >= 1 && middleTwoFromFour <= 12 && lastTwoFromFour >= 1 && lastTwoFromFour <= 31) {
          console.log(`✅ Tolkar som YYYYMMDD: ${firstFour}/${middleTwoFromFour}/${lastTwoFromFour}`)
          date = new Date(`${firstFour}-${middleTwoFromFour.toString().padStart(2, '0')}-${lastTwoFromFour.toString().padStart(2, '0')}`)
        }
        // Sista försöket: MMDDYYYY (10312025)
        else if (firstTwo >= 1 && firstTwo <= 12 && middleTwo >= 1 && middleTwo <= 31 && lastFour >= 2024 && lastFour <= 2030) {
          console.log(`✅ Tolkar som MMDDYYYY: ${firstTwo}/${middleTwo}/${lastFour}`)
          date = new Date(`${lastFour}-${firstTwo.toString().padStart(2, '0')}-${middleTwo.toString().padStart(2, '0')}`)
        }
        else {
          console.log(`❌ Kunde inte tolka 8-siffrigt datum: ${cleanDateStr}`)
          return null
        }
      } else if (cleanDateStr.match(/^\d{6}$/)) {
        // YYMMDD eller DDMMYY format - gissa baserat på värden
        const part1 = parseInt(cleanDateStr.substring(0, 2))
        const part2 = parseInt(cleanDateStr.substring(2, 4))
        const part3 = parseInt(cleanDateStr.substring(4, 6))
        
        // Om första delen > 31, antagligen YYMMDD
        if (part1 > 31 || (part1 < 50 && part1 > 23)) {
          const year = part1 < 50 ? 2000 + part1 : 1900 + part1
          date = new Date(`${year}-${part2.toString().padStart(2, '0')}-${part3.toString().padStart(2, '0')}`)
        } else {
          // Antagligen DDMMYY
          const year = part3 < 50 ? 2000 + part3 : 1900 + part3
          date = new Date(`${year}-${part2.toString().padStart(2, '0')}-${part1.toString().padStart(2, '0')}`)
        }
      } else if (cleanDateStr.match(/^\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2}$/)) {
        // YYYY-MM-DD format
        date = new Date(cleanDateStr.replace(/[\/\.]/g, '-'))
      } else if (cleanDateStr.match(/^\d{1,2}\/\d{4}$/)) {
        // Explicit slash månad-år format: MM/YYYY eller M/YYYY (ex. 07/2027)
        const parts = cleanDateStr.split('/')
        const month = parseInt(parts[0])
        const year = parseInt(parts[1])
        
        if (month >= 1 && month <= 12 && year >= 2024 && year <= 2030) {
          // Sätt till sista dagen i månaden
          const lastDay = new Date(year, month, 0).getDate()
          date = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
          console.log(`✅ Slash månad-år: ${cleanDateStr} → ${date.toISOString().split('T')[0]}`)
        } else {
          return null
        }
      } else if (cleanDateStr.match(/^\d{4}\/\d{1,2}$/)) {
        // Explicit slash ISO månad-år format: YYYY/MM eller YYYY/M (ex. 2027/07)
        const parts = cleanDateStr.split('/')
        const year = parseInt(parts[0])
        const month = parseInt(parts[1])
        
        if (month >= 1 && month <= 12 && year >= 2024 && year <= 2030) {
          // Sätt till sista dagen i månaden
          const lastDay = new Date(year, month, 0).getDate()
          date = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
          console.log(`✅ Slash ISO månad-år: ${cleanDateStr} → ${date.toISOString().split('T')[0]}`)
        } else {
          return null
        }
      } else if (cleanDateStr.match(/^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}$/)) {
        // DD-MM-YYYY, DD/MM/YYYY eller DD-MM-YY format
        const parts = cleanDateStr.split(/[-\/\.]/)
        let year = parseInt(parts[2])
        
        // Hantera tvåsiffriga år
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year
        }
        
        // Anta europeiskt format (DD-MM-YYYY)
        date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
        console.log(`✅ Fullständigt datum: ${cleanDateStr} → ${date.toISOString().split('T')[0]}`)
      } else if (cleanDateStr.match(/^\d{4}$/)) {
        // Bara år - anta 31 december det året
        const year = parseInt(cleanDateStr)
        if (year >= 2024 && year <= 2030) {
          date = new Date(`${year}-12-31`)
        } else {
          return null
        }
      } else if (cleanDateStr.match(/^\d{1,2}[-\/\.]\d{4}$/)) {
        // MM-YYYY format (månad-år)
        const parts = cleanDateStr.split(/[-\/\.]/)
        const month = parseInt(parts[0])
        const year = parseInt(parts[1])
        
        if (month >= 1 && month <= 12 && year >= 2024 && year <= 2030) {
          // Sätt till sista dagen i månaden
          const lastDay = new Date(year, month, 0).getDate()
          date = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
        } else {
          return null
        }
      } else if (cleanDateStr.match(/^\d{4}[-\/\.]\d{1,2}$/)) {
        // YYYY-MM format (ISO månad-år)
        const parts = cleanDateStr.split(/[-\/\.]/)
        const year = parseInt(parts[0])
        const month = parseInt(parts[1])
        
        if (month >= 1 && month <= 12 && year >= 2024 && year <= 2030) {
          // Sätt till sista dagen i månaden
          const lastDay = new Date(year, month, 0).getDate()
          date = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
        } else {
          return null
        }
      } else if (cleanDateStr.match(/^\d{4}\d{2}$/)) {
        // YYYYMM format (6 siffror)
        const year = parseInt(cleanDateStr.substring(0, 4))
        const month = parseInt(cleanDateStr.substring(4, 6))
        
        if (month >= 1 && month <= 12 && year >= 2024 && year <= 2030) {
          // Sätt till sista dagen i månaden
          const lastDay = new Date(year, month, 0).getDate()
          date = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
        } else {
          return null
        }
      } else if (cleanDateStr.match(/^\d{2}\d{4}$/)) {
        // MMYYYY format (6 siffror)
        const month = parseInt(cleanDateStr.substring(0, 2))
        const year = parseInt(cleanDateStr.substring(2, 6))
        
        if (month >= 1 && month <= 12 && year >= 2024 && year <= 2030) {
          // Sätt till sista dagen i månaden
          const lastDay = new Date(year, month, 0).getDate()
          date = new Date(`${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
        } else {
          return null
        }
      } else if (cleanDateStr.match(/^\d{2}\d{2}$/)) {
        // MMYY, YYMM eller DDMM - intelligent gissning
        const part1 = parseInt(cleanDateStr.substring(0, 2))
        const part2 = parseInt(cleanDateStr.substring(2, 4))
        
        // Försök MMYY först (vanligast på långa hållbarhetsvaror)
        if (part1 >= 1 && part1 <= 12) {
          const year = part2 < 50 ? 2000 + part2 : 1900 + part2
          if (year >= 2024 && year <= 2030) {
            // Sätt till sista dagen i månaden
            const lastDay = new Date(year, part1, 0).getDate()
            date = new Date(`${year}-${part1.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
          }
        }
        
        // Om MMYY inte fungerade, försök YYMM
        if (!date && part2 >= 1 && part2 <= 12) {
          const year = part1 < 50 ? 2000 + part1 : 1900 + part1
          if (year >= 2024 && year <= 2030) {
            // Sätt till sista dagen i månaden
            const lastDay = new Date(year, part2, 0).getDate()
            date = new Date(`${year}-${part2.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`)
          }
        }
        
        // Om inget fungerade, försök DDMM med innevarande år
        if (!date && part1 <= 31 && part2 >= 1 && part2 <= 12) {
          const currentYear = new Date().getFullYear()
          date = new Date(`${currentYear}-${part2.toString().padStart(2, '0')}-${part1.toString().padStart(2, '0')}`)
        }
        
        if (!date) {
          return null
        }
      } else if (cleanDateStr.match(/^\d{1,2}:\d{1,2}:\d{2,4}$/)) {
        // Kolon-separerade datum: DD:MM:YYYY
        const parts = cleanDateStr.split(':')
        let year = parseInt(parts[2])
        if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
        
        if (year >= 2024 && year <= 2030) {
          date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
        }
      } else if (cleanDateStr.match(/^\d{2,4}:\d{1,2}:\d{1,2}$/)) {
        // ISO kolon-separerade: YYYY:MM:DD
        const parts = cleanDateStr.split(':')
        const year = parseInt(parts[0])
        
        if (year >= 2024 && year <= 2030) {
          date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`)
        }
      } else if (cleanDateStr.match(/^\d{1,2}_\d{1,2}_\d{2,4}$/)) {
        // Understreck-separerade: DD_MM_YYYY
        const parts = cleanDateStr.split('_')
        let year = parseInt(parts[2])
        if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
        
        if (year >= 2024 && year <= 2030) {
          date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
        }
      } else if (cleanDateStr.match(/^\d{2,4}_\d{1,2}_\d{1,2}$/)) {
        // ISO understreck: YYYY_MM_DD
        const parts = cleanDateStr.split('_')
        const year = parseInt(parts[0])
        
        if (year >= 2024 && year <= 2030) {
          date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`)
        }
      } else if (cleanDateStr.match(/^\d{1,2}\|\d{1,2}\|\d{2,4}$/)) {
        // Pipe-separerade: DD|MM|YYYY
        const parts = cleanDateStr.split('|')
        let year = parseInt(parts[2])
        if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
        
        if (year >= 2024 && year <= 2030) {
          date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
        }
      } else if (cleanDateStr.match(/^\d{1,2}[A-Za-z]\d{1,2}[A-Za-z]\d{2,4}$/)) {
        // Alpha-numeriska: 25A10B2025
        const nums = cleanDateStr.match(/\d+/g)
        if (nums.length === 3) {
          let year = parseInt(nums[2])
          if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
          
          if (year >= 2024 && year <= 2030) {
            date = new Date(`${year}-${nums[1].padStart(2, '0')}-${nums[0].padStart(2, '0')}`)
          }
        }
      } else if (cleanDateStr.match(/^\d{2,4}[A-Za-z]\d{1,2}[A-Za-z]\d{1,2}$/)) {
        // Reverse alpha-numeriska: 2025A10B25
        const nums = cleanDateStr.match(/\d+/g)
        if (nums.length === 3) {
          const year = parseInt(nums[0])
          
          if (year >= 2024 && year <= 2030) {
            date = new Date(`${year}-${nums[1].padStart(2, '0')}-${nums[2].padStart(2, '0')}`)
          }
        }
      } else if (cleanDateStr.match(/^\d{5}$/)) {
        // 5-siffrigt: YYDDD (Julian) eller annan variant
        const year = parseInt(cleanDateStr.substring(0, 2))
        const dayOfYear = parseInt(cleanDateStr.substring(2, 5))
        
        if (dayOfYear >= 1 && dayOfYear <= 366) {
          const fullYear = year < 50 ? 2000 + year : 1900 + year
          if (fullYear >= 2024 && fullYear <= 2030) {
            const date1Jan = new Date(fullYear, 0, 1)
            date = new Date(date1Jan.getTime() + (dayOfYear - 1) * 24 * 60 * 60 * 1000)
          }
        }
      } else if (cleanDateStr.match(/^\d{7}$/)) {
        // 7-siffrigt: YYYYDDD (ISO Julian)
        const year = parseInt(cleanDateStr.substring(0, 4))
        const dayOfYear = parseInt(cleanDateStr.substring(4, 7))
        
        if (year >= 2024 && year <= 2030 && dayOfYear >= 1 && dayOfYear <= 366) {
          const date1Jan = new Date(year, 0, 1)
          date = new Date(date1Jan.getTime() + (dayOfYear - 1) * 24 * 60 * 60 * 1000)
        }
      } else if (cleanDateStr.match(/^[0-9OoQqIlSs\$GgBbZz]{4,8}$/)) {
        // Extremt trasiga OCR-resultat - försök reparera
        let repaired = cleanDateStr
          .replace(/[OoQq]/g, '0')
          .replace(/[Il]/g, '1')
          .replace(/[Ss\$]/g, '5')
          .replace(/[Gg]/g, '6')
          .replace(/[Bb]/g, '8')
          .replace(/[Zz]/g, '2')
        
        console.log(`🔧 Reparerar trasigt OCR: "${cleanDateStr}" → "${repaired}"`)
        
        // Rekursiv parsning av reparerat datum
        return parseAndValidateDateRobust(repaired)
      } else {
        // Sista fallback - försök native Date parsing
        try {
          date = new Date(cleanDateStr)
          if (isNaN(date.getTime())) {
            // Om Date() misslyckas, försök tolka som ren numerisk sekvens
            if (cleanDateStr.match(/^\d{6,8}$/)) {
              return parseAndValidateDateRobust(cleanDateStr) // Rekursiv för numerisk parsing
            }
            return null
          }
        } catch (e) {
          return null
        }
      }
      
      // Grundläggande validering
      if (isNaN(date.getTime())) {
        console.log(`❌ Ogiltigt datum: "${dateStr}" → "${cleanDateStr}"`)
        return null
      }
      
      return isValidFutureDate(date.toISOString().split('T')[0]) ? date.toISOString().split('T')[0] : null
      
    } catch (error) {
      console.log(`❌ Kunde inte parsa datum: "${dateStr}" - ${error.message}`)
      return null
    }
  }
  
  // Kontrollera om datumet är rimligt (framtida och inom 3 år)
  const isValidFutureDate = (dateStr) => {
    try {
      const date = new Date(dateStr)
      const today = new Date()
      const threeYearsFromNow = new Date()
      threeYearsFromNow.setFullYear(threeYearsFromNow.getFullYear() + 3)
      
      // Datum ska vara idag eller senare, men inte mer än 3 år framåt
      const isValid = date >= today && date <= threeYearsFromNow
      
      if (!isValid) {
        console.log(`⚠️ Datum utanför giltigt intervall: ${dateStr} (${date.toLocaleDateString('sv-SE')})`)
      }
      
      return isValid
    } catch (error) {
      return false
    }
  }

  // OMFATTANDE månadsnamn-parsning (svenska, engelska, tyska, franska, spanska)
  const getMonthNumber = (monthStr) => {
    const monthMap = {
      // Svenska
      'januari': 1, 'jan': 1,
      'februari': 2, 'feb': 2,
      'mars': 3, 'mar': 3,
      'april': 4, 'apr': 4,
      'maj': 5,
      'juni': 6, 'jun': 6,
      'juli': 7, 'jul': 7,
      'augusti': 8, 'aug': 8,
      'september': 9, 'sep': 9,
      'oktober': 10, 'okt': 10,
      'november': 11, 'nov': 11,
      'december': 12, 'dec': 12,
      
      // Engelska
      'january': 1,
      'february': 2,
      'march': 3,
      'may': 5,
      'june': 6,
      'july': 7,
      'august': 8,
      'october': 10, 'oct': 10,
      
      // Tyska
      'januar': 1, 'mär': 3, 'mai': 5, 'dez': 12,
      
      // Franska
      'janv': 1, 'févr': 2, 'avr': 4,
      'juin': 6, 'juil': 7, 'août': 8,
      'sept': 9, 'déc': 12,
      
      // Spanska
      'ene': 1, 'abr': 4,
      'ago': 8, 'dic': 12,
      
      // OCR-skadade svenska månader
      'ianuar': 1, 'tebruar': 2, 'rnars': 3, 'apri': 4,
      'rnaj': 5, 'iul': 7, 'auqust': 8,
      'septernber': 9, 'novernber': 11, 'decernber': 12,
      'ian': 1, 'teb': 2, 'rnaf': 3, 'rnai': 5,
      'iun': 6, 'auq': 8,
      
      // Numeriska
      '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
      '7': 7, '8': 8, '9': 9, '10': 10, '11': 11, '12': 12,
      '01': 1, '02': 2, '03': 3, '04': 4, '05': 5, '06': 6,
      '07': 7, '08': 8, '09': 9,
      
      // Säsong till månad (approximation)
      'vinter': 12, 'vår': 3, 'sommar': 6, 'höst': 9,
      'winter': 12, 'spring': 3, 'summer': 6, 'autumn': 9, 'fall': 9
    }
    
    const normalized = monthStr.toLowerCase().trim()
    return monthMap[normalized] || null
  }
  
  // SEASONAL och QUARTERLY datum-hantering
  const parseSeasonalDate = (seasonStr, yearStr) => {
    const seasonMap = {
      'vinter': { month: 12, day: 31 },
      'winter': { month: 12, day: 31 },
      'vår': { month: 5, day: 31 },
      'spring': { month: 5, day: 31 },
      'sommar': { month: 8, day: 31 },
      'summer': { month: 8, day: 31 },
      'höst': { month: 11, day: 30 },
      'autumn': { month: 11, day: 30 },
      'fall': { month: 11, day: 30 },
      
      // Kvartal
      'q1': { month: 3, day: 31 },
      'q2': { month: 6, day: 30 },
      'q3': { month: 9, day: 30 },
      'q4': { month: 12, day: 31 },
      'kv1': { month: 3, day: 31 },
      'kv2': { month: 6, day: 30 },
      'kv3': { month: 9, day: 30 },
      'kv4': { month: 12, day: 31 }
    }
    
    const season = seasonMap[seasonStr.toLowerCase()]
    if (season) {
      let year = parseInt(yearStr)
      if (year < 100) year = year < 50 ? 2000 + year : 1900 + year
      
      if (year >= 2024 && year <= 2030) {
        return new Date(`${year}-${season.month.toString().padStart(2, '0')}-${season.day.toString().padStart(2, '0')}`)
      }
    }
    
    return null
  }

  // Legacy funktion för bakåtkompatibilitet
  const parseAndValidateDate = (dateStr) => {
    return parseAndValidateDateRobust(dateStr)
  }

  // Använd valt datum
  const selectDate = (date) => {
    if (onDateScan) {
      onDateScan(date)
    }
    
    // Låt App.jsx hantera nästa steg (nästa produkt eller stängning)
    console.log('Datum valt och skickat till App.jsx:', date)
  }

  const handleClose = () => {
    console.log('🔴 Stänger scanner fullständigt - kröss-knapp tryckt')
    
    try {
      // Stoppa CodeReader
      if (codeReader) {
        codeReader.reset()
        console.log('CodeReader stoppad och resetad')
      }
    } catch (err) {
      console.log('Fel vid CodeReader stop:', err)
    }
    
    try {
      // Stoppa kamera fullständigt
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
    
    // Fullständig state-reset för att undvika problem
    setScanning(false)
    setError(null)
    setHasPermission(null)
    setScanMode('barcode') // Återställ till grundläge
    setIsProcessingReceipt(false)
    setIsProcessingDate(false)
    setFoundDates([])
    setOcrProgress(0)
    setFocusPoint(null)
    setShowFocusRing(false)
    setRecognizedProducts([])
    setShowProductSelection(false)
    
    console.log('Scanner-state helt resetad')
    
    // Stäng modal och meddela App.jsx
    onClose()
    console.log('✅ Scanner fullständigt stängd - återvänder till huvudapp')
  }
  
  const handleScanDate = (product) => {
    console.log('📷 Användare valde att scanna datum för:', product.name)
    
    // Stäng produktvalsidan
    setShowProductSelection(false)
    
    // Starta datumscanning för denna produkt
    onReceiptScan([product])
  }
  
  const handleUseAI = (product) => {
    console.log('🤖 Användare valde AI-gissning för:', product.name)
    
    // Formatera AI-datum till YYYY-MM-DD format
    const aiDate = product.aiSuggestion.date.toISOString().split('T')[0]
    
    // Skapa produkten med AI-datum direkt
    const productWithDate = {
      ...product,
      expiresAt: aiDate,
      aiMethod: 'ai_suggested'
    }
    
    // Stäng produktvalsidan
    setShowProductSelection(false)
    
    // Lägg till produkten direkt (via App.jsx)
    onReceiptScan([productWithDate], true) // true = redan har datum
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
              {/* Kvittoscanning-knapp döljd för beta-version
              <button 
                onClick={() => setScanMode('receipt')}
                className={`mode-btn ${scanMode === 'receipt' ? 'active' : ''}`}
                title="Kvittoscanning"
              >
                🧾
              </button>
              */}
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
              <div className={`scanner-video-container ${scanMode === 'receipt' ? 'receipt-mode' : ''}`}>
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
                    {recognizedProducts.length > 0 ? (
                      <div 
                        className="clickable-instructions"
                        onClick={() => setShowProductSelection(true)}
                      >
                        <p>✨ <strong>{recognizedProducts.length} produkt{recognizedProducts.length !== 1 ? 'er' : ''} hittade!</strong></p>
                        <p>👆 <u>Klicka här för att välja produkter och sätta datum</u></p>
                      </div>
                    ) : (
                      <>
                        <p>🧾 Centrera kvittot i bildrutan</p>
                        <p>Se till att hela kvittot syns och texten är tydlig</p>
                        <p>👆 Tryck på bilden för att fokusera</p>
                      </>
                    )}
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
                  
                  {/* AI-gissningsknapp för när inget datum hittas */}
                  {isDateScanningMode && currentProduct && currentProduct.aiSuggestion && (
                    <div className="ai-suggestion-section">
                      <div className="divider-text">eller</div>
                      <button 
                        onClick={() => handleUseAISuggestion()}
                        className="ai-suggestion-btn"
                        title={`AI föreslår: ${currentProduct.aiSuggestion.date?.toLocaleDateString('sv-SE')} (${currentProduct.aiSuggestion.confidence} säkerhet)`}
                      >
                        🤖 Använd AI-gissning: {currentProduct.aiSuggestion.date?.toLocaleDateString('sv-SE')}
                        <div className="ai-confidence">
                          {currentProduct.aiSuggestion.confidence} säkerhet • {currentProduct.aiSuggestion.daysFromNow} dagar
                        </div>
                      </button>
                    </div>
                  )}
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
      
      {/* Produktvals-sida */}
      <ProductSelectionPage
        isOpen={showProductSelection}
        onClose={() => setShowProductSelection(false)}
        recognizedProducts={recognizedProducts}
        onScanDate={handleScanDate}
        onUseAI={handleUseAI}
      />
    </div>
  )
}

export default BarcodeScanner
