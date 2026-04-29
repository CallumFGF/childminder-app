import { useState, useEffect } from 'react'
import InvoiceCalculator from './pages/InvoiceCalculator'
import FamilyWorkspace from './pages/FamilyWorkspace'
import Settings from './pages/Settings'

const TABS = [
  { id: 'invoice', label: 'Invoices' },
  { id: 'families', label: 'Families' },
  { id: 'settings', label: 'Settings' },
]

function App() {
  const [activeTab, setActiveTab] = useState('invoice')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')

  // Check if we are already unlocked
  useEffect(() => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

function handleLogin(e) {
    e.preventDefault()
    // Read the secret passcode and remove any accidental invisible spaces
    const correctPasscode = String(import.meta.env.VITE_APP_PASSCODE || '').trim()
    
    if (passcode.trim() === correctPasscode) {
      setIsAuthenticated(true)
      sessionStorage.setItem('isLoggedIn', 'true')
    } else {
      setError(`Error: You typed "${passcode.trim()}". The app expects "${correctPasscode}".`)
      setPasscode('')
    }
  }

  // If not logged in, show the lock screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 px-4">
        <div className="app-panel w-full max-w-sm rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-2">Childminder Desk</h1>
          <p className="text-center text-sm text-base-content/60 mb-6">Please enter your passcode</p>
          
          {error && <div className="alert alert-error mb-4 text-sm py-2">{error}</div>}
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="password"
              className="input input-bordered w-full text-center text-2xl tracking-[0.5em]"
              placeholder="••••"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary w-full">Unlock</button>
          </form>
        </div>
      </div>
    )
  }

  // If logged in, show the main app
  return (
    <div className="app-shell">
      <div className="screen-only px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="app-panel mx-auto max-w-6xl rounded-2xl">
          <div className="border-b border-base-300/80 px-5 py-5 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="app-kicker">Childminding Admin</p>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-neutral sm:text-3xl">Childminder Desk</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/70">
                    A calmer workspace for parent records, weekly schedules, and invoice preparation.
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  sessionStorage.removeItem('isLoggedIn');
                  setIsAuthenticated(false);
                }}
              >
                Lock App 🔒
              </button>
            </div>
          </div>

          <div className="border-b border-base-300/80 px-3 pt-3 sm:px-6">
            <div className="tabs tabs-bordered">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`app-tab tab ${activeTab === tab.id ? 'app-tab-active' : 'text-base-content/60 hover:text-base-content'}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      <div className="px-4 pb-8 pt-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="space-y-6">
            {activeTab === 'invoice' && <InvoiceCalculator />}
            {activeTab === 'families' && <FamilyWorkspace />}
            {activeTab === 'settings' && <Settings />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App