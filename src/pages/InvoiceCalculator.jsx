import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../supabaseClient'

const WEEK_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function CalendarGrid({ year, monthNum, dayStatusMap }) {
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  const firstDayOfWeek = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7

  const cells = Array(firstDayOfWeek).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  function dateStr(day) {
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div className="max-w-[28rem]">
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEK_HEADERS.map((h, i) => (
          <div key={h} className={`text-center text-[11px] font-semibold py-1 ${i >= 5 ? 'text-base-content/25' : 'text-base-content/40'}`}>
            {h}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((day, di) => {
            if (!day) return <div key={di} />
            const isWeekend = di >= 5
            const status = dayStatusMap[dateStr(day)]
            return (
              <div
                key={di}
                className={[
                  'flex h-10 items-center justify-center rounded-md text-[11px] font-medium sm:h-11',
                  isWeekend ? 'text-base-content/20' : '',
                  status === 'funded' ? 'bg-success text-success-content font-bold' : '',
                  status === 'private-term' ? 'bg-warning text-warning-content font-bold' : '',
                  status === 'holiday' ? 'bg-orange-400 text-white font-bold' : '',
                  !status && !isWeekend ? 'text-base-content/35' : '',
                ].join(' ')}
              >
                {day}
              </div>
            )
          })}
        </div>
      ))}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-base-content/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-success inline-block" /> Funded
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-warning inline-block" /> Private (term)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Holiday
        </span>
      </div>
    </div>
  )
}

// Inline calendar for print (no Tailwind, just inline styles)
function PrintCalendar({ year, monthNum, dayStatusMap }) {
  const daysInMonth = new Date(year, monthNum, 0).getDate()
  const firstDayOfWeek = (new Date(year, monthNum - 1, 1).getDay() + 6) % 7

  const cells = Array(firstDayOfWeek).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  function dateStr(day) {
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const cellBase = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: 11, fontWeight: 500 }
  const statusStyle = {
    funded: { background: '#22c55e', color: '#fff', fontWeight: 700 },
    'private-term': { background: '#f59e0b', color: '#fff', fontWeight: 700 },
    holiday: { background: '#fb923c', color: '#fff', fontWeight: 700 },
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 28px)', gap: 3, marginBottom: 4 }}>
        {WEEK_HEADERS.map((h, i) => (
          <div key={h} style={{ ...cellBase, fontSize: 10, color: i >= 5 ? '#ccc' : '#999', fontWeight: 600 }}>{h}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 28px)', gap: 3, marginBottom: 3 }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} style={cellBase} />
            const isWeekend = di >= 5
            const status = dayStatusMap[dateStr(day)]
            return (
              <div key={di} style={{ ...cellBase, color: isWeekend ? '#ccc' : (status ? undefined : '#bbb'), ...(statusStyle[status] || {}) }}>
                {day}
              </div>
            )
          })}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, color: '#687579', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#22c55e', borderRadius: 2, marginRight: 4 }} />Funded</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#f59e0b', borderRadius: 2, marginRight: 4 }} />Private (term)</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, background: '#fb923c', borderRadius: 2, marginRight: 4 }} />Holiday</span>
      </div>
    </div>
  )
}

export default function InvoiceCalculator() {
  const [month, setMonth] = useState('')
  const [parentId, setParentId] = useState('')
  const [parents, setParents] = useState([])
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('calendar')
  const [extraCharges, setExtraCharges] = useState([])
  const [newDescription, setNewDescription] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const printRef = useRef()

  function shiftMonth(offset) {
    const source = month ? new Date(`${month}-01`) : new Date()
    source.setMonth(source.getMonth() + offset)
    const next = `${source.getFullYear()}-${String(source.getMonth() + 1).padStart(2, '0')}`
    setMonth(next)
  }

  async function loadParents() {
    const { data } = await supabase.from('parents').select('id, name').order('name')
    setParents(data || [])
  }

  useState(() => { loadParents() }, [])

  async function calculate() {
    if (!month || !parentId) return
    setLoading(true)
    setResults(null)
    setExtraCharges([])

    const [childrenRes, schedulesRes, termDatesRes, ratesRes, parentRes] = await Promise.all([
      supabase.from('children').select('id, name, parent_id, funding_type').eq('parent_id', parentId),
      supabase.from('child_schedules').select('child_id, day_of_week, schedule_type'),
      supabase.from('term_dates').select('start_date, end_date'),
      supabase.from('rates').select('*').limit(1),
      supabase.from('parents').select('name, address, email, phone').eq('id', parentId).single(),
    ])

    const children = childrenRes.data || []
    const schedules = schedulesRes.data || []
    const termDates = termDatesRes.data || []
    const rates = ratesRes.data?.[0] || { standard_rate: 7.0, consumables_rate: 0.0 }
    const parent = parentRes.data || {}

    const [year, monthNum] = month.split('-').map(Number)
    const startOfMonth = new Date(year, monthNum - 1, 1)
    const endOfMonth = new Date(year, monthNum, 0)

    const scheduleMap = {}
    schedules.forEach(s => {
      if (!scheduleMap[s.child_id]) scheduleMap[s.child_id] = { term: new Set(), holiday: new Set() }
      const type = s.schedule_type === 'holiday' ? 'holiday' : 'term'
      scheduleMap[s.child_id][type].add(s.day_of_week)
    })

    function isInTerm(dateStr) {
      const d = new Date(dateStr)
      return termDates.some(t => d >= new Date(t.start_date) && d <= new Date(t.end_date))
    }

    function getWeekNumber(d) {
      const date = new Date(d)
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
      const week1 = new Date(date.getFullYear(), 0, 4)
      return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
    }

    const childResults = []

    for (const child of children) {
      const childScheduleMap = scheduleMap[child.id]
      if (!childScheduleMap) continue
      if (childScheduleMap.term.size === 0 && childScheduleMap.holiday.size === 0) continue

      const fundingType = child.funding_type || 'None'
      let weeklyCap = 0
      if (fundingType === '15hr') weeklyCap = 15
      else if (fundingType === '30hr') weeklyCap = 30

      const days = []
      for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        const scheduleDay = (d.getDay() + 6) % 7
        if (scheduleDay > 4) continue
        const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        const inTerm = isInTerm(ds)
        const relevantSchedule = inTerm ? childScheduleMap.term : childScheduleMap.holiday
        if (relevantSchedule.has(scheduleDay)) {
          days.push({ date: ds, inTerm })
        }
      }

      // Group by week, tracking day lists for calendar colours
      const weeks = {}
      days.forEach(day => {
        const weekNum = getWeekNumber(day.date)
        if (!weeks[weekNum]) weeks[weekNum] = { termDays: [], holidayDays: [] }
        if (day.inTerm) weeks[weekNum].termDays.push(day.date)
        else weeks[weekNum].holidayDays.push(day.date)
      })

      // Allocate funded vs private per day
      const dayStatusMap = {}
      let totalFundedHours = 0
      let totalPrivateHours = 0
      const fundedDaysPerWeek = Math.floor(weeklyCap / 10)

      for (const week of Object.values(weeks)) {
        week.termDays.forEach((date, idx) => {
          if (idx < fundedDaysPerWeek) {
            dayStatusMap[date] = 'funded'
            totalFundedHours += 10
          } else {
            dayStatusMap[date] = 'private-term'
            totalPrivateHours += 10
          }
        })
        week.holidayDays.forEach(date => {
          dayStatusMap[date] = 'holiday'
          totalPrivateHours += 10
        })
      }

      const privateCost = totalPrivateHours * rates.standard_rate
      const consumablesCost = totalFundedHours * rates.consumables_rate

      childResults.push({
        childName: child.name,
        fundingType,
        totalDays: days.length,
        totalFundedHours,
        totalPrivateHours,
        privateCost: privateCost.toFixed(2),
        consumablesCost: consumablesCost.toFixed(2),
        totalDue: (privateCost + consumablesCost).toFixed(2),
        dayStatusMap,
      })
    }

    setResults({
      children: childResults,
      rates,
      parent,
      year,
      monthNum,
      monthText: new Date(year, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
    })
    setLoading(false)
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${results?.parent?.name || 'unknown'}-${results?.monthText || ''}`,
  })

  function addExtraCharge() {
    if (!newDescription.trim() || !newAmount) return
    setExtraCharges([...extraCharges, { id: Date.now(), description: newDescription.trim(), amount: parseFloat(newAmount) }])
    setNewDescription('')
    setNewAmount('')
  }

  function removeExtraCharge(id) {
    setExtraCharges(extraCharges.filter(c => c.id !== id))
  }

  const baseTotal = results ? results.children.reduce((sum, r) => sum + parseFloat(r.totalDue), 0) : 0
  const extrasTotal = extraCharges.reduce((sum, c) => sum + c.amount, 0)
  const grandTotal = (baseTotal + extrasTotal).toFixed(2)

  const totalFundedHours = results ? results.children.reduce((s, r) => s + r.totalFundedHours, 0) : 0
  const totalPrivateHours = results ? results.children.reduce((s, r) => s + r.totalPrivateHours, 0) : 0

  const fundingBadge = (type) => {
    if (type === '30hr') return <span className="badge badge-success badge-sm">30hr</span>
    if (type === '15hr') return <span className="badge badge-info badge-sm">15hr</span>
    return <span className="badge badge-ghost badge-sm">None</span>
  }

  return (
    <div className="space-y-4">
      <section className="app-panel rounded-2xl screen-only">
        <div className="border-b border-base-300/80 px-6 py-5">
          <p className="app-kicker">Billing Workspace</p>
          <h2 className="app-section-title mt-2">Generate invoice</h2>
        </div>
        <div className="px-6 py-6">
          <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_auto] lg:items-end">
            <label className="app-field">
              <span className="app-field-label">Month</span>
              <div className="join w-full">
                <button type="button" className="btn join-item btn-outline" onClick={() => shiftMonth(-1)}>‹</button>
                <input type="month" className="input input-bordered join-item w-full min-w-0" value={month} onChange={e => setMonth(e.target.value)} />
                <button type="button" className="btn join-item btn-outline" onClick={() => shiftMonth(1)}>›</button>
              </div>
            </label>
            <div className="app-field">
              <span className="app-field-label">Parent</span>
              {parents.length > 0 && parents.length <= 18 ? (
                <div className="flex flex-wrap gap-2">
                  {parents.map((parent) => (
                    <button
                      key={parent.id}
                      type="button"
                      className={`btn btn-sm ${parentId === parent.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setParentId(parent.id)}
                    >
                      {parent.name}
                    </button>
                  ))}
                </div>
              ) : (
                <select className="select select-bordered w-full" value={parentId} onChange={e => setParentId(e.target.value)} onClick={loadParents}>
                  <option value="">Choose parent</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
            <button className="btn btn-primary lg:min-w-36" onClick={calculate} disabled={loading || !month || !parentId}>
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? 'Calculating…' : 'Calculate'}
            </button>
          </div>
        </div>
      </section>

      {/* No children found */}
      {results && results.children.length === 0 && (
        <div className="alert alert-warning screen-only">
          <span>No scheduled children found for this parent. Check the Schedules tab.</span>
        </div>
      )}

      {results && results.children.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="screen-only grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="app-stat">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Amount due</div>
              <div className="app-stat-value mt-3 text-primary">£{grandTotal}</div>
              <div className="mt-2 text-sm text-base-content/60">{results.parent.name} · {results.monthText}</div>
            </div>
            <div className="app-stat">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Funded hours</div>
              <div className="app-stat-value mt-3 text-success">{totalFundedHours}</div>
              <div className="mt-2 text-sm text-base-content/60">Covered by funded childcare</div>
            </div>
            <div className="app-stat">
              <div className="text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Chargeable hours</div>
              <div className="app-stat-value mt-3 text-accent">{totalPrivateHours}</div>
              <div className="mt-2 text-sm text-base-content/60">@ £{results.rates.standard_rate}/hr</div>
            </div>
          </div>

          {/* Per-child breakdown with view toggle */}
          <div className="app-panel rounded-2xl screen-only">
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="app-kicker">Attendance Review</p>
                  <h3 className="mt-2 text-lg font-semibold">Breakdown</h3>
                </div>
                <div className="join">
                  <button className={`btn btn-xs join-item ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('calendar')}>Calendar</button>
                  <button className={`btn btn-xs join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('table')}>Table</button>
                </div>
              </div>

              {viewMode === 'calendar' && (
                <div className="space-y-6">
                  {results.children.map(r => (
                    <div key={r.childName}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.childName}</span>
                          {fundingBadge(r.fundingType)}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-base-content/60">
                          <span className="rounded-full bg-base-200 px-3 py-1">{r.totalDays} days</span>
                          <span className="rounded-full bg-base-200 px-3 py-1">{r.totalDays * 10} hrs booked</span>
                          <span className="rounded-full bg-base-200 px-3 py-1 text-success">{r.totalFundedHours} funded</span>
                          <span className="rounded-full bg-base-200 px-3 py-1 text-accent">{r.totalPrivateHours} chargeable</span>
                        </div>
                      </div>

                      <CalendarGrid year={results.year} monthNum={results.monthNum} dayStatusMap={r.dayStatusMap} />

                      {/* Per-child totals */}
                      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <div className="app-grid-card">
                          <div className="text-base-content/60 text-xs mb-0.5">Total days</div>
                          <div className="font-bold">{r.totalDays} days · {r.totalDays * 10} hrs</div>
                        </div>
                        <div className="app-grid-card">
                          <div className="text-base-content/60 text-xs mb-0.5">Funded</div>
                          <div className="font-bold text-success">{r.totalFundedHours} hrs</div>
                        </div>
                        <div className="app-grid-card">
                          <div className="text-base-content/60 text-xs mb-0.5">Chargeable</div>
                          <div className="font-bold text-accent">{r.totalPrivateHours} hrs</div>
                        </div>
                        <div className="app-grid-card">
                          <div className="text-base-content/60 text-xs mb-0.5">Amount due</div>
                          <div className="font-bold">£{r.totalDue}</div>
                        </div>
                      </div>

                      {results.children.length > 1 && <div className="divider" />}
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'table' && (
                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr>
                        <th>Child</th>
                        <th>Funding</th>
                        <th className="text-right">Days</th>
                        <th className="text-right">Funded hrs</th>
                        <th className="text-right">Chargeable hrs</th>
                        <th className="text-right">Cost</th>
                        <th className="text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.children.map(r => (
                        <tr key={r.childName}>
                          <td className="font-medium">{r.childName}</td>
                          <td>{fundingBadge(r.fundingType)}</td>
                          <td className="text-right">{r.totalDays}</td>
                          <td className="text-right">{r.totalFundedHours}</td>
                          <td className="text-right">{r.totalPrivateHours}</td>
                          <td className="text-right">£{r.privateCost}</td>
                          <td className="text-right font-bold">£{r.totalDue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Extra charges + total + print */}
          <div className="app-panel rounded-2xl screen-only">
            <div className="px-6 py-6">
              <p className="app-kicker">Adjustments</p>
              <h3 className="mt-2 text-lg font-semibold mb-3">Additional charges</h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="app-field flex-1 min-w-[160px]">
                  <span className="app-field-label">Description</span>
                  <input className="input input-bordered" placeholder="e.g. Late collection fee" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                </div>
                <div className="app-field w-28">
                  <span className="app-field-label">Amount (£)</span>
                  <input className="input input-bordered" type="number" step="0.01" placeholder="0.00" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                </div>
                <button className="btn btn-outline btn-primary" onClick={addExtraCharge}>+ Add</button>
              </div>
              <p className="text-xs text-base-content/40 mt-1">Use a negative amount for deductions.</p>

              {extraCharges.length > 0 && (
                <table className="table table-sm mt-3">
                  <thead><tr><th>Description</th><th className="text-right">Amount</th><th /></tr></thead>
                  <tbody>
                    {extraCharges.map(c => (
                      <tr key={c.id}>
                        <td>{c.description}</td>
                        <td className={`text-right font-medium ${c.amount < 0 ? 'text-error' : 'text-success'}`}>
                          {c.amount >= 0 ? '+' : ''}£{c.amount.toFixed(2)}
                        </td>
                        <td><button className="btn btn-xs btn-ghost text-error" onClick={() => removeExtraCharge(c.id)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="divider my-3" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xl font-bold">Grand Total: £{grandTotal}</span>
                <button className="btn btn-secondary gap-2" onClick={handlePrint}>🖨️ Print / Save as PDF</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Printable invoice */}
      <div className="print-only" ref={printRef}>
        {results && (
          <div style={{ fontFamily: 'Manrope, system-ui, sans-serif', color: '#24363b', background: '#fffdfa', padding: '40px', fontSize: '14px', lineHeight: '1.6' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '34px', borderBottom: '1px solid #dde3de', paddingBottom: '18px' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a8788', fontWeight: 700 }}>Childminding Admin</p>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px' }}>Invoice</h1>
                <p style={{ color: '#687579', margin: 0 }}>{results.monthText}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', maxWidth: '260px' }}>
                <p style={{ fontWeight: 600, marginBottom: '2px' }}>Beth Fisher &amp; Callum Fackrell</p>
                <p style={{ color: '#687579', margin: '0 0 2px' }}>Flat 2 Florence House, 4 Lime Place, ME1 3YU</p>
                <p style={{ color: '#687579', margin: 0 }}>Ofsted: 2769014 / 2818829</p>
              </div>
            </div>

            {/* Billed to */}
            <div style={{ marginBottom: '28px', border: '1px solid #dde3de', borderRadius: '14px', padding: '16px 18px', background: '#ffffff' }}>
              <p style={{ fontWeight: 700, marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8788' }}>Billed to</p>
              <p style={{ margin: '0 0 2px' }}>{results.parent.name}</p>
              {results.parent.address && <p style={{ margin: '0 0 2px', color: '#687579' }}>{results.parent.address}</p>}
              {results.parent.email && <p style={{ margin: '0 0 2px', color: '#687579' }}>{results.parent.email}</p>}
              {results.parent.phone && <p style={{ margin: 0, color: '#687579' }}>{results.parent.phone}</p>}
            </div>

            {/* Per-child: calendar + summary */}
            {results.children.map(r => {
              const grossCost = ((r.totalFundedHours + r.totalPrivateHours) * results.rates.standard_rate).toFixed(2)
              const fundedSaving = (r.totalFundedHours * results.rates.standard_rate).toFixed(2)
              return (
                <div key={r.childName} style={{ marginBottom: '24px', border: '1px solid #dde3de', borderRadius: '16px', padding: '18px', background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '20px' }}>
                    {/* Calendar */}
                    <div>
                      <p style={{ fontWeight: 700, marginBottom: '8px' }}>{r.childName}</p>
                      <PrintCalendar year={results.year} monthNum={results.monthNum} dayStatusMap={r.dayStatusMap} />
                    </div>
                    {/* Per-child cost breakdown */}
                    <div style={{ minWidth: '220px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#687579' }}>{r.totalDays} days × 10 hrs × £{results.rates.standard_rate}</span>
                        <span>£{grossCost}</span>
                      </div>
                      {r.totalFundedHours > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
                          <span>Funded ({r.totalFundedHours} hrs)</span>
                          <span>−£{fundedSaving}</span>
                        </div>
                      )}
                      {parseFloat(r.consumablesCost) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#687579' }}>Consumables</span>
                          <span>£{r.consumablesCost}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #dde3de', paddingTop: '8px', marginTop: '8px' }}>
                        <span>Subtotal</span>
                        <span>£{r.totalDue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Extra charges */}
            {extraCharges.length > 0 && (
              <div style={{ border: '1px solid #dde3de', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', background: '#ffffff' }}>
                <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8788' }}>Additional charges</p>
                {extraCharges.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#687579' }}>{c.description}</span>
                    <span style={{ color: c.amount < 0 ? '#dc2626' : '#000' }}>{c.amount >= 0 ? '£' : '−£'}{Math.abs(c.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Grand total */}
            <div style={{ borderTop: '2px solid #24363b', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px', marginBottom: '32px' }}>
              <span>Total Due</span>
              <span>£{grandTotal}</span>
            </div>

            {/* Payment details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px', borderTop: '1px solid #dde3de', paddingTop: '24px' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Payment Details</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Bank: Monzo</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Account holder: Callum Fackrell</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Account number: 74052519</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Sort code: 04-00-03</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>BIC: MONZGB2L</p>
                <p style={{ margin: 0, color: '#687579' }}>IBAN: GB18 MONZ 0400 0374 0525 19</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Payment Terms</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Due: first weekday of the month</p>
                <p style={{ margin: 0, color: '#687579' }}>Bank Transfer or Tax-Free Childcare</p>
              </div>
            </div>

            <div style={{ marginTop: '34px', textAlign: 'center', color: '#93a0a1', fontSize: '12px' }}>
              <p style={{ margin: 0 }}>Thank you for choosing us to care for your child.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
