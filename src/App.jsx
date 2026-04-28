import { useState } from 'react'
import ParentsForm from './pages/ParentsForm'
import ChildrenForm from './pages/ChildrenForm'
import ScheduleForm from './pages/ScheduleForm'
import InvoiceCalculator from './pages/InvoiceCalculator'

const TABS = [
  { id: 'invoice', label: 'Invoices', hint: 'Monthly billing and printouts' },
  { id: 'families', label: 'Families', hint: 'Parent and child records' },
  { id: 'schedules', label: 'Schedules', hint: 'Weekly attendance planning' },
]

function App() {
  const [activeTab, setActiveTab] = useState('invoice')

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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[26rem]">
                <div className="app-stat">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Purpose</div>
                  <div className="mt-2 text-sm font-semibold">Admin first</div>
                </div>
                <div className="app-stat">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Tone</div>
                  <div className="mt-2 text-sm font-semibold">Professional</div>
                </div>
                <div className="app-stat col-span-2 sm:col-span-1">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Operators</div>
                  <div className="mt-2 text-sm font-semibold">Beth Fisher &amp; Callum Fackrell</div>
                </div>
              </div>
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

          <div className="px-5 py-3 sm:px-8">
            <p className="text-sm text-base-content/60">
              {TABS.find(tab => tab.id === activeTab)?.hint}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-8 pt-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="screen-only mb-5 grid gap-3 sm:grid-cols-3">
            <div className="app-stat">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Spacing</div>
              <div className="mt-2 text-sm font-semibold">Comfortable fields, compact summaries</div>
            </div>
            <div className="app-stat">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Shape</div>
              <div className="mt-2 text-sm font-semibold">Rounded enough to feel modern, not toy-like</div>
            </div>
            <div className="app-stat">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Colour</div>
              <div className="mt-2 text-sm font-semibold">Quiet sage, slate, and warm amber cues</div>
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === 'invoice' && <InvoiceCalculator />}

            {activeTab === 'families' && (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ParentsForm />
                <ChildrenForm />
              </div>
            )}

            {activeTab === 'schedules' && (
              <div className="max-w-3xl">
                <ScheduleForm />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
