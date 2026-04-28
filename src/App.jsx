import { useState } from 'react'
import ParentsForm from './pages/ParentsForm'
import ChildrenForm from './pages/ChildrenForm'
import ScheduleForm from './pages/ScheduleForm'
import InvoiceCalculator from './pages/InvoiceCalculator'

const TABS = [
  { id: 'invoice',   label: '🧾 Invoice' },
  { id: 'families',  label: '👨‍👩‍👧 Families' },
  { id: 'schedules', label: '📅 Schedules' },
]

function App() {
  const [activeTab, setActiveTab] = useState('invoice')

  return (
    <div className="min-h-screen bg-base-200">

      {/* Navbar */}
      <div className="navbar bg-primary text-primary-content shadow-md px-6 screen-only">
        <div className="flex-1 flex flex-col items-start justify-center leading-tight py-1">
          <span className="text-lg font-bold tracking-tight">👶 Childminder App</span>
          <span className="text-xs opacity-60 font-normal">Beth Fisher &amp; Callum Fackrell</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-base-100 border-b border-base-300 shadow-sm screen-only">
        <div className="tabs tabs-bordered max-w-2xl mx-auto px-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab tab-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'tab-active text-primary'
                  : 'text-base-content/60 hover:text-base-content'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div className="p-6 max-w-2xl mx-auto">

        {activeTab === 'invoice' && (
          <InvoiceCalculator />
        )}

        {activeTab === 'families' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ParentsForm />
            <ChildrenForm />
          </div>
        )}

        {activeTab === 'schedules' && (
          <div className="max-w-lg mx-auto">
            <ScheduleForm />
          </div>
        )}

      </div>
    </div>
  )
}

export default App
