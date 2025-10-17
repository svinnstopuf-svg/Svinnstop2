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
      
      // ROBUST bildförbättring för dåligt ljus och suddighet
      const enhancedCanvas = enhanceImageForDateScanning(canvas)
      
      // Flera OCR-strategier för att hitta datum under alla förhållanden
      const strategies = [
        { name: 'Datum-fokuserad', lang: 'eng', psm: 8, whitelist: '0123456789/-.' },
        { name: 'Text och siffror', lang: 'eng+swe', psm: 7, whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789/-.:  ' },
        { name: 'Aggressiv siffror', lang: 'eng', psm: 6, whitelist: '0123456789/-.:' },
        { name: 'Ord och datum', lang: 'swe+eng', psm: 11, whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖabcdefghijklmnopqrstuvwxyzåäö0123456789/-.: ' }
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
              tessedit_ocr_engine_mode: 1 // LSTM + Legacy hybrid
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

  // ROBUST bildförbättring specifik för datumscanning
  const enhanceImageForDateScanning = (canvas) => {
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    
    // Mät genomsnittlig ljusstyrka för att anpassa förbättring
    let avgBrightness = 0
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      avgBrightness += gray
    }
    avgBrightness /= (data.length / 4)
    
    console.log(`💡 Datumscanning - ljusstyrka: ${Math.round(avgBrightness)}/255`)
    
    // Extremt aggressiv förbättring för datumscanning
    const brightnessBoost = avgBrightness < 120 ? 3.0 : avgBrightness < 180 ? 2.2 : 1.5
    const contrastBoost = 2.8 // Hög kontrast för att framhäva siffror
    
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
      
      // Extremt kontrast för att få fram siffror
      let enhanced = (gray - 128) * contrastBoost + 128
      enhanced *= brightnessBoost
      enhanced = Math.max(0, Math.min(255, enhanced))
      
      // Extra skärpning för att få tydliga siffror
      if (enhanced > 60 && enhanced < 200) {
        enhanced = enhanced < 128 ? Math.max(0, enhanced * 0.6) : Math.min(255, enhanced * 1.6)
      }
      
      data[i] = data[i + 1] = data[i + 2] = enhanced
    }
    
    // Skapa ny canvas med förbättrad bild
    const enhancedCanvas = document.createElement('canvas')
    const enhancedCtx = enhancedCanvas.getContext('2d')
    
    // Skalning för bättre OCR-precision på små datum
    const scale = 2.5
    enhancedCanvas.width = canvas.width * scale
    enhancedCanvas.height = canvas.height * scale
    
    enhancedCtx.putImageData(new ImageData(data, canvas.width, canvas.height), 0, 0)
    
    // Skala upp den förbättrade bilden
    const scaledCanvas = document.createElement('canvas')
    const scaledCtx = scaledCanvas.getContext('2d')
    scaledCanvas.width = enhancedCanvas.width
    scaledCanvas.height = enhancedCanvas.height
    
    scaledCtx.imageSmoothingEnabled = false // Bevara skärpa
    scaledCtx.drawImage(enhancedCanvas, 0, 0, enhancedCanvas.width, enhancedCanvas.height)
    
    console.log('✨ Bildförbättring för datumscanning klar')
    return scaledCanvas
  }
  
  // ROBUST datumextraktion med fler mönster och bättre felhantering
  const extractDatesFromTextRobust = (text) => {
    const dates = []
    const cleanText = text.replace(/[^a-zA-Z0-9\s\-\/\.]/g, ' ').replace(/\s+/g, ' ')
    
    console.log('🔍 Robust datumextraktion från text:', cleanText)
    
    // Utökade datummönster för bättre igenkänning
    const datePatterns = [
      // Grundläggande format
      /(\d{4}[-\/\.]\d{1,2}[-\/\.]\d{1,2})/g,           // YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/g,         // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2})/g,          // DD-MM-YY, DD/MM/YY, DD.MM.YY
      
      // Med text-indikatorer
      /(?:best\s+före|bäst\s+före|use\s+by|exp|expiry|expires|förbruka\s+före|sista)[\s:]*([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{2,4})/gi,
      
      // Svenska månader
      /(\d{1,2}\s+(?:jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)\w*\s+\d{2,4})/gi,
      
      // Engelska månader
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{2,4})/gi,
      
      // Kompakta format utan separatorer
      /(\d{8})/g, // YYYYMMDD
      /(\d{6})/g, // YYMMDD eller DDMMYY
      
      // OCR-fel vanliga format (0 som O, 1 som I, etc.)
      /([O0]\d[-\/\.]\d{1,2}[-\/\.]\d{2,4})/g,
      /(\d{1,2}[-\/\.][O0]\d[-\/\.]\d{2,4})/g,
      
      // Med mellanslag mellan siffror (OCR-fel)
      /(\d{1,2}\s+\d{1,2}\s+\d{2,4})/g
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
        .replace(/[Oo]/g, '0')  // OCR-fel: O som 0
        .replace(/[Il|]/g, '1') // OCR-fel: I, l, | som 1
        .replace(/\s+/g, '')    // Ta bort mellanslag
        .trim()
      
      console.log(`🔧 Parsning: "${dateStr}" → "${cleanDateStr}"`)
      
      let date
      
      // Olika parsningsmetoder
      if (cleanDateStr.match(/^\d{8}$/)) {
        // YYYYMMDD format
        const year = cleanDateStr.substring(0, 4)
        const month = cleanDateStr.substring(4, 6)
        const day = cleanDateStr.substring(6, 8)
        date = new Date(`${year}-${month}-${day}`)
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
      } else if (cleanDateStr.match(/^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}$/)) {
        // DD-MM-YYYY eller DD-MM-YY format
        const parts = cleanDateStr.split(/[-\/\.]/)
        let year = parseInt(parts[2])
        
        // Hantera tvåsiffriga år
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year
        }
        
        // Anta europeiskt format (DD-MM-YYYY)
        date = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
      } else {
        // Fallback
        date = new Date(cleanDateStr)
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
