import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { supabase } from '../supabaseClient'

const WEEK_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function formatMonthValue(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getStatusVisual(status, printMode = false) {
  if (status === 'funded') {
    return printMode
      ? {
          backgroundColor: '#dff3e8',
          color: '#1f2f2b',
          border: '1px solid #416f5b',
          backgroundImage: 'linear-gradient(135deg, rgba(65,111,91,0.18) 25%, transparent 25%, transparent 50%, rgba(65,111,91,0.18) 50%, rgba(65,111,91,0.18) 75%, transparent 75%, transparent)',
          backgroundSize: '8px 8px',
        }
      : {
          backgroundColor: 'color-mix(in oklab, var(--color-success) 72%, white)',
          color: 'var(--color-neutral)',
          border: '1px solid color-mix(in oklab, var(--color-success) 60%, black)',
          backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.12) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.12) 75%, transparent 75%, transparent)',
          backgroundSize: '9px 9px',
        }
  }

  if (status === 'private-term') {
    return printMode
      ? {
          backgroundColor: '#fff1d6',
          color: '#35281a',
          border: '2px solid #9a6d27',
        }
      : {
          backgroundColor: 'color-mix(in oklab, var(--color-warning) 70%, white)',
          color: '#35281a',
          border: '2px solid color-mix(in oklab, var(--color-warning) 75%, black)',
        }
  }

  if (status === 'holiday') {
    return printMode
      ? {
          backgroundColor: '#fff8ea',
          color: '#2d2d2d',
          border: '1px solid #7b7b7b',
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(80,80,80,0.18) 0, rgba(80,80,80,0.18) 2px, transparent 2px, transparent 6px)',
        }
      : {
          backgroundColor: '#ffe6bf',
          color: '#2d2d2d',
          border: '1px solid #8c6d37',
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(90,72,34,0.14) 0, rgba(90,72,34,0.14) 2px, transparent 2px, transparent 6px)',
        }
  }

  return {}
}

function statusCode(status) {
  if (status === 'funded') return 'F'
  if (status === 'private-term') return 'P'
  if (status === 'holiday') return 'H'
  return ''
}

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
          <div key={h} className={`py-1 text-center text-[11px] font-semibold ${i >= 5 ? 'text-base-content/25' : 'text-base-content/40'}`}>
            {h}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="mb-1 grid grid-cols-7 gap-1">
          {week.map((day, di) => {
            if (!day) return <div key={di} />
            const isWeekend = di >= 5
            const status = dayStatusMap[dateStr(day)]
            return (
              <div
                key={di}
                title={status ? `${day}: ${status}` : undefined}
                className={[
                  'relative flex h-10 items-center justify-center rounded-md text-[11px] font-medium sm:h-11',
                  isWeekend ? 'text-base-content/20' : '',
                  !status && !isWeekend ? 'border border-base-300/80 bg-base-100 text-base-content/45' : '',
                ].join(' ')}
                style={getStatusVisual(status, false)}
              >
                <span>{day}</span>
                {status && (
                  <span className="absolute bottom-1 right-1 text-[9px] font-bold opacity-80">
                    {statusCode(status)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-base-content/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-success" style={getStatusVisual('funded', false)} /> Funded / F
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={getStatusVisual('private-term', false)} /> Private / P
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm" style={getStatusVisual('holiday', false)} /> Holiday / H
        </span>
      </div>
    </div>
  )
}

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

  const cellBase = {
    width: 26,
    height: 26,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 600,
    position: 'relative',
    printColorAdjust: 'exact',
    WebkitPrintColorAdjust: 'exact',
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 26px)', gap: 3, marginBottom: 4 }}>
        {WEEK_HEADERS.map((h, i) => (
          <div key={h} style={{ ...cellBase, fontSize: 10, color: i >= 5 ? '#b0b0b0' : '#7f8a8b', fontWeight: 700 }}>
            {h}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 26px)', gap: 3, marginBottom: 3 }}>
          {week.map((day, di) => {
            if (!day) return <div key={di} style={cellBase} />
            const isWeekend = di >= 5
            const status = dayStatusMap[dateStr(day)]
            return (
              <div
                key={di}
                style={{
                  ...cellBase,
                  color: isWeekend ? '#b0b0b0' : '#304346',
                  border: status ? undefined : '1px solid #d5dcdd',
                  ...(status ? getStatusVisual(status, true) : {}),
                }}
              >
                <span>{day}</span>
                {status && (
                  <span style={{ position: 'absolute', right: 3, bottom: 1, fontSize: 8, fontWeight: 800, opacity: 0.72 }}>
                    {statusCode(status)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 10, color: '#687579', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 4, verticalAlign: 'middle', ...getStatusVisual('funded', true) }} />Funded / F</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 4, verticalAlign: 'middle', ...getStatusVisual('private-term', true) }} />Private / P</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, marginRight: 4, verticalAlign: 'middle', ...getStatusVisual('holiday', true) }} />Holiday / H</span>
      </div>
    </div>
  )
}

async function buildInvoiceForParent(parentId, month) {
  const [childrenRes, schedulesRes, termDatesRes, ratesRes, parentRes] = await Promise.all([
    supabase.from('children').select('id, name, parent_id, funding_type').eq('parent_id', parentId),
    supabase.from('child_schedules').select('child_id, day_of_week, schedule_type'),
    supabase.from('term_dates').select('start_date, end_date'),
    supabase.from('rates').select('*').limit(1),
    supabase.from('parents').select('id, name, address, email, phone').eq('id', parentId).single(),
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
  schedules.forEach((s) => {
    const childKey = String(s.child_id)
    if (!scheduleMap[childKey]) scheduleMap[childKey] = { term: new Set(), holiday: new Set() }
    const type = s.schedule_type === 'holiday' ? 'holiday' : 'term'
    scheduleMap[childKey][type].add(Number(s.day_of_week))
  })

  function isInTerm(dateStr) {
    if (termDates.length === 0) return true
    const d = new Date(dateStr)
    return termDates.some((t) => d >= new Date(t.start_date) && d <= new Date(t.end_date))
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
    const childScheduleMap = scheduleMap[String(child.id)]
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
        const relevantSchedule = inTerm || childScheduleMap.holiday.size === 0
          ? childScheduleMap.term
          : childScheduleMap.holiday
      if (relevantSchedule.has(scheduleDay)) {
        days.push({ date: ds, inTerm })
      }
    }

    const weeks = {}
    days.forEach((day) => {
      const weekNum = getWeekNumber(day.date)
      if (!weeks[weekNum]) weeks[weekNum] = { termDays: [], holidayDays: [] }
      if (day.inTerm) weeks[weekNum].termDays.push(day.date)
      else weeks[weekNum].holidayDays.push(day.date)
    })

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
      week.holidayDays.forEach((date) => {
        dayStatusMap[date] = 'holiday'
        totalPrivateHours += 10
      })
    }

    const grossCost = (totalFundedHours + totalPrivateHours) * rates.standard_rate
    const fundedDiscount = totalFundedHours * rates.standard_rate
    const privateCost = totalPrivateHours * rates.standard_rate
    const consumablesCost = totalFundedHours * rates.consumables_rate

    childResults.push({
      childId: child.id,
      childName: child.name,
      fundingType,
      totalDays: days.length,
      totalFundedHours,
      totalPrivateHours,
      grossCost: grossCost.toFixed(2),
      fundedDiscount: fundedDiscount.toFixed(2),
      privateCost: privateCost.toFixed(2),
      consumablesCost: consumablesCost.toFixed(2),
      totalDue: (privateCost + consumablesCost).toFixed(2),
      dayStatusMap,
    })
  }

  return {
    children: childResults,
    rates,
    parent,
    year,
    monthNum,
    monthText: new Date(year, monthNum - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
  }
}

function InvoicePrintDocument({ invoices, extraChargesByParent }) {
  // Grab the saved settings from the browser
  const providerName = localStorage.getItem('providerName') || '[Provider Name]';
  const providerAddress = localStorage.getItem('providerAddress') || '[Provider Address]';
  const urn = localStorage.getItem('urn') || '[URN]';
  const bankName = localStorage.getItem('bankName') || '[Bank Name]';
  const accountName = localStorage.getItem('accountName') || '[Account Name]';
  const accountNumber = localStorage.getItem('accountNumber') || '[Account Number]';
  const sortCode = localStorage.getItem('sortCode') || '[Sort Code]';

  return (
    <div style={{ fontFamily: 'Manrope, system-ui, sans-serif', color: '#24363b', background: '#fffdfa', padding: '40px', fontSize: '14px', lineHeight: '1.6' }}>
      {invoices.map((invoice, index) => {
        const extraCharges = extraChargesByParent[invoice.parent.id] || []
        const childTotal = invoice.children.reduce((sum, child) => sum + Number(child.totalDue), 0)
        const extraTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
        const grandTotal = (childTotal + extraTotal).toFixed(2)

        return (
          <div key={invoice.parent.id} style={{ pageBreakAfter: index === invoices.length - 1 ? 'auto' : 'always', marginBottom: index === invoices.length - 1 ? 0 : '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '34px', borderBottom: '1px solid #dde3de', paddingBottom: '18px' }}>
              <div>
                <p style={{ margin: '0 0 6px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a8788', fontWeight: 700 }}>Childminding Admin</p>
                <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 4px' }}>Invoice</h1>
                <p style={{ color: '#687579', margin: 0 }}>{invoice.monthText}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '13px', maxWidth: '260px' }}>
                <p style={{ fontWeight: 600, marginBottom: '2px' }}>{providerName}</p>
                <p style={{ color: '#687579', margin: '0 0 2px' }}>{providerAddress}</p>
                <p style={{ color: '#687579', margin: 0 }}>Ofsted: {urn}</p>
              </div>
            </div>

            <div style={{ marginBottom: '28px', border: '1px solid #dde3de', borderRadius: '14px', padding: '16px 18px', background: '#ffffff' }}>
              <p style={{ fontWeight: 700, marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8788' }}>Billed to</p>
              <p style={{ margin: '0 0 2px' }}>{invoice.parent.name}</p>
              {invoice.parent.address && <p style={{ margin: '0 0 2px', color: '#687579' }}>{invoice.parent.address}</p>}
              {invoice.parent.email && <p style={{ margin: '0 0 2px', color: '#687579' }}>{invoice.parent.email}</p>}
              {invoice.parent.phone && <p style={{ margin: 0, color: '#687579' }}>{invoice.parent.phone}</p>}
            </div>

            {invoice.children.map((child) => (
              <div key={child.childId} style={{ marginBottom: '24px', border: '1px solid #dde3de', borderRadius: '16px', padding: '18px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', gap: '20px' }}>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: '8px' }}>{child.childName}</p>
                    <PrintCalendar year={invoice.year} monthNum={invoice.monthNum} dayStatusMap={child.dayStatusMap} />
                  </div>
                  <div style={{ minWidth: '220px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#687579' }}>{child.totalDays} days × 10 hrs × £{invoice.rates.standard_rate}</span>
                      <span>£{child.grossCost}</span>
                    </div>
                    {child.totalFundedHours > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#16a34a' }}>
                        <span>Funded ({child.totalFundedHours} hrs)</span>
                        <span>−£{child.fundedDiscount}</span>
                      </div>
                    )}
                    {Number(child.consumablesCost) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#687579' }}>Consumables</span>
                        <span>£{child.consumablesCost}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid #dde3de', paddingTop: '8px', marginTop: '8px' }}>
                      <span>Subtotal</span>
                      <span>£{child.totalDue}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {extraCharges.length > 0 && (
              <div style={{ border: '1px solid #dde3de', borderRadius: '14px', padding: '16px 18px', marginBottom: '14px', background: '#ffffff' }}>
                <p style={{ fontWeight: 700, marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8788' }}>Additional charges</p>
                {extraCharges.map((charge) => (
                  <div key={charge.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#687579' }}>{charge.description}</span>
                    <span style={{ color: charge.amount < 0 ? '#dc2626' : '#000' }}>
                      {charge.amount >= 0 ? '£' : '−£'}{Math.abs(charge.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '2px solid #24363b', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '18px', marginBottom: '32px' }}>
              <span>Total Due</span>
              <span>£{grandTotal}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '32px', borderTop: '1px solid #dde3de', paddingTop: '24px' }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Payment Details</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Bank: {bankName}</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Account holder: {accountName}</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Account number: {accountNumber}</p>
                <p style={{ margin: '0 0 2px', color: '#687579' }}>Sort code: {sortCode}</p>
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
        )
      })}
    </div>
  )
}

export default function InvoiceCalculator() {
  const [month, setMonth] = useState(formatMonthValue())
  const [parentId, setParentId] = useState('')
  const [parents, setParents] = useState([])
  const [results, setResults] = useState(null)
  const [batchResults, setBatchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('calendar')
  const [extraCharges, setExtraCharges] = useState([])
  const [newDescription, setNewDescription] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newChargeMode, setNewChargeMode] = useState('fixed')
  const [mode, setMode] = useState('single')

  const printRef = useRef()

  useEffect(() => {
    loadParents()
  }, [])

  function shiftMonth(offset) {
    const source = month ? new Date(`${month}-01`) : new Date()
    source.setMonth(source.getMonth() + offset)
    setMonth(formatMonthValue(source))
  }

  async function loadParents() {
    const { data } = await supabase.from('parents').select('id, name').order('name')
    setParents(data || [])
  }

  async function calculate() {
    if (!month || !parentId) return
    setLoading(true)
    setMode('single')
    setBatchResults([])
    setExtraCharges([])
    const nextResults = await buildInvoiceForParent(parentId, month)
    setResults(nextResults)
    setLoading(false)
  }

  async function exportMonthPack() {
    if (!month) return
    setLoading(true)
    const invoices = []
    for (const parent of parents) {
      const invoice = await buildInvoiceForParent(parent.id, month)
      if (invoice.children.length > 0) invoices.push(invoice)
    }
    setBatchResults(invoices)
    setMode('batch')
    setResults(invoices[0] || null)
    setLoading(false)
    setTimeout(() => {
      handlePrint()
    }, 50)
  }

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: mode === 'batch'
      ? `Invoices-${month || 'month-pack'}`
      : `Invoice-${results?.parent?.name || 'unknown'}-${results?.monthText || ''}`,
  })

  function addExtraCharge() {
    if (!newDescription.trim() || !newValue || !results) return
    const numericValue = parseFloat(newValue)
    const amount = newChargeMode === 'days'
      ? numericValue * results.rates.standard_rate * 10
      : numericValue

    setExtraCharges([
      ...extraCharges,
      {
        id: Date.now(),
        description: newDescription.trim(),
        mode: newChargeMode,
        value: numericValue,
        amount,
      },
    ])
    setNewDescription('')
    setNewValue('')
    setNewChargeMode('fixed')
  }

  function removeExtraCharge(id) {
    setExtraCharges(extraCharges.filter((charge) => charge.id !== id))
  }

  const baseTotal = results ? results.children.reduce((sum, child) => sum + parseFloat(child.totalDue), 0) : 0
  const extrasTotal = extraCharges.reduce((sum, charge) => sum + charge.amount, 0)
  const grandTotal = (baseTotal + extrasTotal).toFixed(2)
  const totalFundedHours = results ? results.children.reduce((sum, child) => sum + child.totalFundedHours, 0) : 0
  const totalPrivateHours = results ? results.children.reduce((sum, child) => sum + child.totalPrivateHours, 0) : 0

  function fundingBadge(type) {
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
          <div className="grid gap-4 xl:grid-cols-[15rem_minmax(0,1fr)_11rem_13rem] xl:items-end">
            <label className="app-field">
              <span className="app-field-label">Month</span>
              <div className="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-2 py-2">
                <button type="button" className="btn btn-ghost btn-sm px-3" onClick={() => shiftMonth(-1)}>‹</button>
                <input type="month" className="input input-ghost h-10 min-w-0 flex-1 px-2" value={month} onChange={(e) => setMonth(e.target.value)} />
                <button type="button" className="btn btn-ghost btn-sm px-3" onClick={() => shiftMonth(1)}>›</button>
              </div>
            </label>
            <div className="app-field">
              <span className="app-field-label">Parent</span>
              {parents.length > 0 && parents.length <= 18 ? (
                <div className="flex flex-wrap gap-2 rounded-xl border border-base-300 bg-base-100 p-2">
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
                <select className="select select-bordered w-full" value={parentId} onChange={(e) => setParentId(e.target.value)} onClick={loadParents}>
                  <option value="">Choose parent</option>
                  {parents.map((parent) => <option key={parent.id} value={parent.id}>{parent.name}</option>)}
                </select>
              )}
            </div>
            <button className="btn btn-primary xl:min-w-40" onClick={calculate} disabled={loading || !month || !parentId}>
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? 'Calculating…' : 'Calculate'}
            </button>
            <button className="btn btn-outline xl:min-w-48" onClick={exportMonthPack} disabled={loading || !month || parents.length === 0}>
              Export month pack
            </button>
          </div>
        </div>
      </section>

      {results && results.children.length === 0 && (
        <div className="alert alert-warning screen-only">
          <span>No scheduled children found for this parent in the selected month.</span>
        </div>
      )}

      {results && results.children.length > 0 && (
        <>
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

          <div className="app-panel rounded-2xl screen-only">
            <div className="px-6 py-6">
              <div className="mb-4 flex items-center justify-between">
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
                  {results.children.map((child) => (
                    <div key={child.childId}>
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{child.childName}</span>
                          {fundingBadge(child.fundingType)}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-base-content/60">
                          <span className="rounded-full bg-base-200 px-3 py-1">{child.totalDays} days</span>
                          <span className="rounded-full bg-base-200 px-3 py-1">{child.totalDays * 10} hrs booked</span>
                          <span className="rounded-full bg-base-200 px-3 py-1 text-success">{child.totalFundedHours} funded</span>
                          <span className="rounded-full bg-base-200 px-3 py-1 text-accent">{child.totalPrivateHours} chargeable</span>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] xl:items-start">
                        <CalendarGrid year={results.year} monthNum={results.monthNum} dayStatusMap={child.dayStatusMap} />
                        <div className="grid gap-3 text-sm sm:grid-cols-2">
                          <div className="app-grid-card">
                            <div className="mb-0.5 text-xs text-base-content/60">Total days</div>
                            <div className="font-bold">{child.totalDays} days · {child.totalDays * 10} hrs</div>
                          </div>
                          <div className="app-grid-card">
                            <div className="mb-0.5 text-xs text-base-content/60">Gross before discounts</div>
                            <div className="font-bold">£{child.grossCost}</div>
                          </div>
                          <div className="app-grid-card">
                            <div className="mb-0.5 text-xs text-base-content/60">Funded discount</div>
                            <div className="font-bold text-success">−£{child.fundedDiscount}</div>
                          </div>
                          <div className="app-grid-card">
                            <div className="mb-0.5 text-xs text-base-content/60">Consumables</div>
                            <div className="font-bold">£{child.consumablesCost}</div>
                          </div>
                          <div className="app-grid-card">
                            <div className="mb-0.5 text-xs text-base-content/60">Chargeable hours</div>
                            <div className="font-bold text-accent">{child.totalPrivateHours} hrs</div>
                          </div>
                          <div className="app-grid-card">
                            <div className="mb-0.5 text-xs text-base-content/60">Amount due</div>
                            <div className="font-bold">£{child.totalDue}</div>
                          </div>
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
                        <th className="text-right">Gross</th>
                        <th className="text-right">Discount</th>
                        <th className="text-right">Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.children.map((child) => (
                        <tr key={child.childId}>
                          <td className="font-medium">{child.childName}</td>
                          <td>{fundingBadge(child.fundingType)}</td>
                          <td className="text-right">{child.totalDays}</td>
                          <td className="text-right">{child.totalFundedHours}</td>
                          <td className="text-right">{child.totalPrivateHours}</td>
                          <td className="text-right">£{child.grossCost}</td>
                          <td className="text-right text-success">−£{child.fundedDiscount}</td>
                          <td className="text-right font-bold">£{child.totalDue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="app-panel rounded-2xl screen-only">
            <div className="px-6 py-6">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
                <div>
                  <p className="app-kicker">Adjustments</p>
                  <h3 className="mb-3 mt-2 text-lg font-semibold">Additional charges and deductions</h3>
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_10rem_auto] md:items-end">
                    <div className="app-field">
                      <span className="app-field-label">Description</span>
                      <input className="input input-bordered" placeholder="e.g. Provider closure" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                    </div>
                    <div className="app-field">
                      <span className="app-field-label">Type</span>
                      <select className="select select-bordered" value={newChargeMode} onChange={(e) => setNewChargeMode(e.target.value)}>
                        <option value="fixed">Fixed amount</option>
                        <option value="days">Day-based</option>
                      </select>
                    </div>
                    <div className="app-field">
                      <span className="app-field-label">{newChargeMode === 'days' ? 'Days (+/-)' : 'Amount (£)'}</span>
                      <input className="input input-bordered" type="number" step="0.01" placeholder={newChargeMode === 'days' ? '1' : '0.00'} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                    </div>
                    <button className="btn btn-outline btn-primary" onClick={addExtraCharge}>+ Add</button>
                  </div>
                  <p className="mt-1 text-xs text-base-content/40">
                    For day-based entries, one day equals 10 hours at the current standard rate. Use negative numbers for deductions.
                  </p>

                  {extraCharges.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="table table-sm">
                        <thead><tr><th>Description</th><th>Type</th><th className="text-right">Value</th><th className="text-right">Amount</th><th /></tr></thead>
                        <tbody>
                          {extraCharges.map((charge) => (
                            <tr key={charge.id}>
                              <td>{charge.description}</td>
                              <td>{charge.mode === 'days' ? 'Day-based' : 'Fixed'}</td>
                              <td className="text-right">{charge.mode === 'days' ? `${charge.value} days` : `£${charge.value.toFixed(2)}`}</td>
                              <td className={`text-right font-medium ${charge.amount < 0 ? 'text-error' : 'text-success'}`}>
                                {charge.amount >= 0 ? '+' : ''}£{charge.amount.toFixed(2)}
                              </td>
                              <td><button className="btn btn-xs btn-ghost text-error" onClick={() => removeExtraCharge(charge.id)}>✕</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="app-grid-card self-start">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-base-content/55">Invoice summary</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-base-content/65">Children subtotal</span><span>£{baseTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-base-content/65">Adjustments</span><span>{extrasTotal >= 0 ? '+' : ''}£{extrasTotal.toFixed(2)}</span></div>
                    <div className="border-t border-base-300 pt-3 text-base font-bold flex justify-between"><span>Total due</span><span>£{grandTotal}</span></div>
                  </div>
                  <button className="btn btn-secondary mt-4 w-full gap-2" onClick={() => { setMode('single'); handlePrint() }}>🖨️ Print / Save as PDF</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="print-only" ref={printRef}>
        {mode === 'batch' && batchResults.length > 0 ? (
          <InvoicePrintDocument invoices={batchResults} extraChargesByParent={{}} />
        ) : results ? (
          <InvoicePrintDocument invoices={[results]} extraChargesByParent={{ [results.parent.id]: extraCharges }} />
        ) : null}
      </div>
    </div>
  )
}
