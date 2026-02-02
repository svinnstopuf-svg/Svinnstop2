import { useState, useEffect, Component } from 'react'
import { auth } from '../firebaseConfig'
import './AuthModal.css'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'

/**
 * Error Boundary för att fånga React-fel
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 React Error Boundary caught error:')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', border: '2px solid red' }}>
          <h3>❌ Ett fel uppstod</h3>
          <p>Kolla konsolen för detaljer</p>
          <button onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}>
            Försök igen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Google Sign-In Button Component
 */
function GoogleSignInButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        backgroundColor: 'white',
        color: '#000',
        fontSize: '16px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#f8f8f8')}
      onMouseLeave={(e) => !disabled && (e.target.style.backgroundColor = 'white')}
    >
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
        <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
      </svg>
      Fortsätt med Google
    </button>
  )
}

/**
 * AuthModal - Hanterar inloggning och registrering med email/password
 * Stödjer också länkning av anonymt konto till email/password
 */
export default function AuthModal({ isOpen, onClose, mode = 'login' }) {
  const [currentMode, setCurrentMode] = useState(mode) // 'login', 'signup', eller 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  // Synka currentMode med mode prop när modalen öppnas
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(mode)
      setError('')
      setResetSent(false)
      console.log('🔄 Mode synced to:', mode)
    }
  }, [isOpen, mode])

  console.log('🔵 AuthModal rendered - isOpen:', isOpen, 'mode:', mode, 'currentMode:', currentMode)

  if (!isOpen) {
    console.log('❌ AuthModal not rendering (isOpen = false)')
    return null
  }
  
  console.log('✅ AuthModal IS rendering! currentMode:', currentMode)

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setResetSent(false)
    onClose()
  }

  // Logga in med befintligt konto
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Login successful')
      handleClose()
      window.location.reload() // Reload för att synka all data
    } catch (err) {
      console.error('❌ Login error:', err)
      if (err.code === 'auth/invalid-credential') {
        setError('Felaktig email eller lösenord')
      } else if (err.code === 'auth/user-not-found') {
        setError('Inget konto hittades med denna email')
      } else if (err.code === 'auth/wrong-password') {
        setError('Felaktigt lösenord')
      } else if (err.code === 'auth/too-many-requests') {
        setError('För många försök. Vänta en stund innan du försöker igen')
      } else {
        setError('Kunde inte logga in. Försök igen')
      }
    } finally {
      setLoading(false)
    }
  }

  // Skapa nytt konto eller länka anonymt konto
  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')

    // Validering
    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken')
      return
    }
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte')
      return
    }

    setLoading(true)

    try {
      const currentUser = auth.currentUser
      
      // Om användaren är anonym, länka kontot istället för att skapa nytt
      if (currentUser && currentUser.isAnonymous) {
        console.log('🔗 Linking anonymous account to email/password...')
        const credential = EmailAuthProvider.credential(email, password)
        await linkWithCredential(currentUser, credential)
        console.log('✅ Account linked successfully')
        alert('Ditt konto har skapats! Du kan nu logga in på flera enheter.')
      } else {
        // Skapa helt nytt konto
        await createUserWithEmailAndPassword(auth, email, password)
        console.log('✅ New account created')
        alert('Konto skapat! Du är nu inloggad.')
      }
      
      handleClose()
      window.location.reload() // Reload för att synka all data
    } catch (err) {
      console.error('❌ Signup error:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('Det finns redan ett konto med denna email')
      } else if (err.code === 'auth/invalid-email') {
        setError('Ogiltig email-adress')
      } else if (err.code === 'auth/weak-password') {
        setError('Lösenordet är för svagt')
      } else if (err.code === 'auth/credential-already-in-use') {
        setError('Denna email är redan kopplad till ett annat konto')
      } else {
        setError('Kunde inte skapa konto. Försök igen')
      }
    } finally {
      setLoading(false)
    }
  }

  // Logga in med Google
  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      const currentUser = auth.currentUser
      
      // Signera in med Google först
      const result = await signInWithPopup(auth, provider)
      const credential = GoogleAuthProvider.credentialFromResult(result)
      
      // Om användaren var anonym innan, länka kontot
      if (currentUser && currentUser.isAnonymous) {
        console.log('🔗 Linking anonymous account to Google...')
        try {
          await linkWithCredential(currentUser, credential)
          console.log('✅ Account linked to Google successfully')
          alert('Ditt konto har kopplats till Google! Du kan nu logga in på flera enheter.')
        } catch (linkError) {
          console.log('ℹ️ Account linking skipped:', linkError.message)
          // Om länkning misslyckas, fortsätt ändå - användaren är inloggad
        }
      } else {
        console.log('✅ Google sign-in successful')
      }
      
      handleClose()
      window.location.reload() // Reload för att synka all data
    } catch (err) {
      console.error('❌ Google sign-in error:', err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Inloggning avbruten')
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blockerad av webbläsaren. Tillåt popups och försök igen.')
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Det finns redan ett konto med denna email')
      } else if (err.code === 'auth/credential-already-in-use') {
        setError('Detta Google-konto är redan kopplat till ett annat konto')
      } else {
        setError('Kunde inte logga in med Google. Försök igen')
      }
    } finally {
      setLoading(false)
    }
  }

  // Skicka återställnings-email
  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
      console.log('✅ Password reset email sent')
    } catch (err) {
      console.error('❌ Password reset error:', err)
      if (err.code === 'auth/user-not-found') {
        setError('Ingen användare hittades med denna email')
      } else if (err.code === 'auth/invalid-email') {
        setError('Ogiltig email-adress')
      } else {
        setError('Kunde inte skicka återställnings-email. Försök igen')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>
            {currentMode === 'login' && 'Logga in'}
            {currentMode === 'signup' && 'Skapa konto'}
            {currentMode === 'reset' && 'Återställ lösenord'}
          </h2>
          <button className="btn-close" onClick={handleClose}>✕</button>
        </div>

        <ErrorBoundary>
          <div className="modal-body">
            {/* Tabs för att växla mellan login och signup */}
            {currentMode !== 'reset' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button
                  className={currentMode === 'login' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => {
                    // Stäng modalen
                    onClose()
                    // Öppna på nytt med login mode
                    setTimeout(() => {
                      // Detta kommer trigga App.jsx att öppna modalen igen
                      const event = new CustomEvent('reopenAuthModal', { detail: { mode: 'login' } })
                      window.dispatchEvent(event)
                    }, 50)
                  }}
                  style={{ flex: 1 }}
                >
                  Logga in
                </button>
                <button
                  className={currentMode === 'signup' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => {
                    // Stäng modalen
                    onClose()
                    // Öppna på nytt med signup mode
                    setTimeout(() => {
                      // Detta kommer trigga App.jsx att öppna modalen igen
                      const event = new CustomEvent('reopenAuthModal', { detail: { mode: 'signup' } })
                      window.dispatchEvent(event)
                    }, 50)
                  }}
                  style={{ flex: 1 }}
                >
                  Skapa konto
                </button>
              </div>
            )}

          {/* Login-formulär */}
          {currentMode === 'login' ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="din@email.se"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px'
                  }}
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Lösenord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px'
                  }}
                  disabled={loading}
                />
              </div>

              <button
                type="button"
                onClick={() => setCurrentMode('reset')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginBottom: '16px',
                  padding: '0'
                }}
              >
                Glömt lösenord?
              </button>

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  color: '#c00',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Loggar in...' : 'Logga in'}
              </button>

              {/* Eller-separator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                gap: '12px'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>eller</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              </div>

              {/* Google Sign-In knapp */}
              <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />
            </form>
          ) : null}

          {/* Signup-formulär */}
          {currentMode === 'signup' ? (
            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="din@email.se"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px'
                  }}
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Lösenord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minst 6 tecken"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px'
                  }}
                  disabled={loading}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Bekräfta lösenord
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Ange lösenordet igen"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px'
                  }}
                  disabled={loading}
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  color: '#c00',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              {auth.currentUser?.isAnonymous && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e7f3ff',
                  border: '1px solid #b3d9ff',
                  borderRadius: '8px',
                  color: '#004085',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  💡 Genom att skapa ett konto sparas all din data och du kan logga in på flera enheter
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'Skapar konto...' : 'Skapa konto'}
              </button>

              {/* Eller-separator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '20px 0',
                gap: '12px'
              }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>eller</span>
                <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              </div>

              {/* Google Sign-In knapp */}
              <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />
            </form>
          ) : null}

          {/* Password reset-formulär */}
          {currentMode === 'reset' ? (
            <form onSubmit={handlePasswordReset}>
              <p style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Ange din email så skickar vi instruktioner för att återställa ditt lösenord.
              </p>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="din@email.se"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '16px'
                  }}
                  disabled={loading || resetSent}
                />
              </div>

              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee',
                  border: '1px solid #fcc',
                  borderRadius: '8px',
                  color: '#c00',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {error}
                </div>
              )}

              {resetSent && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e7f9e7',
                  border: '1px solid #b3e6b3',
                  borderRadius: '8px',
                  color: '#155724',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  ✅ Email skickat! Kolla din inkorg för instruktioner.
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentMode('login')}
                  style={{ flex: 1 }}
                >
                  Tillbaka
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || resetSent}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Skickar...' : resetSent ? 'Skickat' : 'Skicka'}
                </button>
              </div>
            </form>
          ) : null}
          </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}
