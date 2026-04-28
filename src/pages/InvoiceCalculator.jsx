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
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEK_HEADERS.map((h, i) => (
          <div key={h} className={`text-center text-xs font-semibold py-1 ${i >= 5 ? 'text-base-content/25' : 'text-base-content/40'}`}>
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
                  'flex items-center justify-center rounded-md aspect-square text-xs font-medium',
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
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 10, color: '#6b7280' }}>
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

      {/* Controls */}
      <div className="card bg-base-100 shadow-sm border border-base-300 screen-only">
        <div className="card-body pb-5">
          <h2 className="card-title text-base-content mb-1">Generate Invoice</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Month</span></label>
              <input type="month" className="input input-bordered w-40" value={month} onChange={e => setMonth(e.target.value)} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-medium">Parent</span></label>
              <select className="select select-bordered" value={parentId} onChange={e => setParentId(e.target.value)} onClick={loadParents}>
                <option value="">— Choose Parent —</option>
                {parents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={calculate} disabled={loading || !month || !parentId}>
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? 'Calculating…' : 'Calculate'}
            </button>
          </div>
        </div>
      </div>

      {/* No children found */}
      {results && results.children.length === 0 && (
        <div className="alert alert-warning screen-only">
          <span>No scheduled children found for this parent. Check the Schedules tab.</span>
        </div>
      )}

      {results && results.children.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="stats stats-vertical shadow w-full bg-base-100 border border-base-300 screen-only">
            <div className="stat">
              <div className="stat-title">Amount Due</div>
              <div className="stat-value text-secondary">£{grandTotal}</div>
              <div className="stat-desc">{results.parent.name} · {results.monthText}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Funded Hours</div>
              <div className="stat-value text-success">{totalFundedHours}</div>
              <div className="stat-desc">Covered by government</div>
            </div>
            <div className="stat">
              <div className="stat-title">Chargeable Hours</div>
              <div className="stat-value text-warning">{totalPrivateHours}</div>
              <div className="stat-desc">@ £{results.rates.standard_rate}/hr</div>
            </div>
          </div>

          {/* Per-child breakdown with view toggle */}
          <div className="card bg-base-100 shadow-sm border border-base-300 screen-only">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Breakdown</h3>
                <div className="join">
                  <button className={`btn btn-xs join-item ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('calendar')}>Calendar</button>
                  <button className={`btn btn-xs join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('table')}>Table</button>
                </div>
              </div>

              {viewMode === 'calendar' && (
                <div className="space-y-6">
                  {results.children.map(r => (
                    <div key={r.childName}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="font-medium">{r.childName}</span>
                        {fundingBadge(r.fundingType)}
                      </div>

                      <CalendarGrid year={results.year} monthNum={results.monthNum} dayStatusMap={r.dayStatusMap} />

                      {/* Per-child totals */}
                      <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                        <div className="bg-base-200 rounded-lg p-3">
                          <div className="text-base-content/60 text-xs mb-0.5">Total days</div>
                          <div className="font-bold">{r.totalDays} days · {r.totalDays * 10} hrs</div>
                        </div>
                        <div className="bg-base-200 rounded-lg p-3">
                          <div className="text-base-content/60 text-xs mb-0.5">Funded</div>
                          <div className="font-bold text-success">{r.totalFundedHours} hrs</div>
                        </div>
                        <div className="bg-base-200 rounded-lg p-3">
                          <div className="text-base-content/60 text-xs mb-0.5">Chargeable</div>
                          <div className="font-bold text-warning">{r.totalPrivateHours} hrs</div>
                        </div>
                        <div className="bg-base-200 rounded-lg p-3">
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
          <div className="card bg-base-100 shadow-sm border border-base-300 screen-only">
            <div className="card-body">
              <h3 className="font-semibold mb-3">Additional Charges</h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="form-control flex-1 min-w-[160px]">
                  <label className="label py-1"><span className="label-text">Description</span></label>
                  <input className="input input-bordered" placeholder="e.g. Late collection fee" value={newDescription} onChange={e => setNewDescription(e.target.value)} />
                </div>
                <div className="form-control w-28">
                  <label className="label py-1"><span className="label-text">Amount (£)</span></label>
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
              <div className="flex items-center justify-between">
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
          <div style={{ fontFamily: 'system-ui, sans-serif', color: '#000', background: '#fff', padding: '48px', fontSize: '14px', lineHeight: '1.6' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 4px' }}>Invoice</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>{results.monthText}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px' }}>
                <p style={{ fontWeight: 600, marginBottom: '2px' }}>Beth Fisher &amp; Callum Fackrell</p>
                <p style={{ color: '#6b7280', margin: '0 0 2px' }}>Flat 2 Florence House, 4 Lime Place, ME1 3YU</p>
                <p style={{ color: '#6b7280', margin: 0 }}>Ofsted: 2769014 / 2818829</p>
              </div>
            </div>

            {/* Billed to */}
            <div style={{ marginBottom: '32px' }}>
              <p style={{ fontWeight: 600, marginBottom: '4px' }}>Billed to:</p>
              <p style={{ margin: '0 0 2px' }}>{results.parent.name}</p>
              {results.parent.address && <p style={{ margin: '0 0 2px', color: '#6b7280' }}>{results.parent.address}</p>}
              {results.parent.email && <p style={{ margin: '0 0 2px', color: '#6b7280' }}>{results.parent.email}</p>}
              {results.parent.phone && <p style={{ margin: 0, color: '#6b7280' }}>{results.parent.phone}</p>}
            </div>

            {/* Per-child: calendar + summary */}
            {results.children.map(r => {
              const grossCost = ((r.totalFundedHours + r.totalPrivateHours) * results.rates.standard_rate).toFixed(2)
              const fundedSaving = (r.totalFundedHours * results.rates.standard_rate).toFixed(2)
              return (
                <div key={r.childName} style={{ marginBottom: '28px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    {/* Calendar */}
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '8px' }}>{r.childName}</p>
                      <PrintCalendar year={results.year} monthNum={results.monthNum} dayStatusMap={r.dayStatusMap} />
                    </div>
                    {/* Per-child cost breakdown */}
                    <div style={{ minWidth: '200px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#6b7280' }}>{r.totalDays} days × 10 hrs × £{results.rates.standard_rate}</span>
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
                          <span style={{ color: '#6b7280' }}>Consumables</span>
                          <span>£{r.consumablesCost}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #e5e7eb', paddingTop: '6px', marginTop: '4px' }}>
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
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginBottom: '12px' }}>
                <p style={{ fontWeight: 600, marginBottom: '8px' }}>Additional Charges</p>
                {extraCharges.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#6b7280' }}>{c.description}</span>
                    <span style={{ color: c.amount < 0 ? '#dc2626' : '#000' }}>{c.amount >= 0 ? '£' : '−£'}{Math.abs(c.amount).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Grand total */}
            <div style={{ borderTop: '2px solid #000', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '17px', marginBottom: '40px' }}>
              <span>Total Due</span>
              <span>£{grandTotal}</span>
            </div>

            {/* Payment details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Payment Details</p>
                <p style={{ margin: '0 0 2px', color: '#6b7280' }}>Bank: Monzo</p>
                <p style={{ margin: '0 0 2px', color: '#6b7280' }}>Account holder: Callum Fackrell</p>
                <p style={{ margin: '0 0 2px', color: '#6b7280' }}>Account number: 74052519</p>
                <p style={{ margin: '0 0 2px', color: '#6b7280' }}>Sort code: 04-00-03</p>
                <p style={{ margin: '0 0 2px', color: '#6b7280' }}>BIC: MONZGB2L</p>
                <p style={{ margin: 0, color: '#6b7280' }}>IBAN: GB18 MONZ 0400 0374 0525 19</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Payment Terms</p>
                <p style={{ margin: '0 0 2px', color: '#6b7280' }}>Due: first weekday of the month</p>
                <p style={{ margin: 0, color: '#6b7280' }}>Bank Transfer or Tax-Free Childcare</p>
              </div>
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              <p style={{ margin: 0 }}>Thank you for choosing us to care for your child. 💛</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
