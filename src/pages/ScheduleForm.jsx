import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default function ScheduleForm() {
  const [childId, setChildId] = useState('')
  const [children, setChildren] = useState([])
  const [termDays, setTermDays] = useState(new Set())
  const [holidayDays, setHolidayDays] = useState(new Set())
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function fetchChildren() {
      const { data } = await supabase.from('children').select('id, name').order('name')
      setChildren(data || [])
    }
    fetchChildren()
  }, [])

  useEffect(() => {
    if (!childId) {
      setTermDays(new Set())
      setHolidayDays(new Set())
      return
    }
    async function fetchSchedule() {
      const { data } = await supabase
        .from('child_schedules')
        .select('day_of_week, schedule_type')
        .eq('child_id', childId)

      const term = new Set()
      const holiday = new Set()
      ;(data || []).forEach(r => {
        if (r.schedule_type === 'holiday') holiday.add(r.day_of_week)
        else term.add(r.day_of_week)
      })
      setTermDays(term)
      setHolidayDays(holiday)
    }
    fetchSchedule()
  }, [childId])

  function toggleDay(type, dayIndex) {
    const setter = type === 'term' ? setTermDays : setHolidayDays
    const current = type === 'term' ? termDays : holidayDays
    const next = new Set(current)
    if (next.has(dayIndex)) next.delete(dayIndex)
    else next.add(dayIndex)
    setter(next)
  }

  async function handleSave() {
    if (!childId) return
    setMessage('Saving...')

    await supabase.from('child_schedules').delete().eq('child_id', childId)

    const rows = [
      ...Array.from(termDays).map(day => ({ child_id: childId, day_of_week: day, schedule_type: 'term' })),
      ...Array.from(holidayDays).map(day => ({ child_id: childId, day_of_week: day, schedule_type: 'holiday' })),
    ]

    if (rows.length > 0) {
      const { error } = await supabase.from('child_schedules').insert(rows)
      if (error) {
        setMessage('Error: ' + error.message)
        return
      }
    }
    setMessage('Schedule saved!')
  }

  return (
    <section className="app-panel rounded-2xl">
      <div className="border-b border-base-300/80 px-6 py-5">
        <p className="app-kicker">Attendance Planning</p>
        <h2 className="app-section-title mt-2">Weekly schedule</h2>
        <p className="mt-2 text-sm text-base-content/65">Set term-time and holiday patterns separately so invoices stay predictable.</p>
      </div>

      <div className="px-6 py-6">
        {message && <div className="alert alert-info mb-5 text-sm">{message}</div>}

        <label className="app-field mb-6">
          <span className="app-field-label">Child</span>
          <select
            className="select select-bordered w-full"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
          >
            <option value="">Select child</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        {childId && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="app-grid-card">
              <h3 className="font-semibold text-primary">Term-time days</h3>
              <p className="mt-1 text-sm text-base-content/60">Used for funded and standard school-term attendance.</p>
              <div className="mt-4 space-y-2">
                {DAY_LABELS.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-base-100">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={termDays.has(idx)}
                      onChange={() => toggleDay('term', idx)}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="app-grid-card">
              <h3 className="font-semibold text-accent">Holiday days</h3>
              <p className="mt-1 text-sm text-base-content/60">Used for school breaks and private holiday care.</p>
              <div className="mt-4 space-y-2">
                {DAY_LABELS.map((label, idx) => (
                  <label key={idx} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-base-100">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-accent"
                      checked={holidayDays.has(idx)}
                      onChange={() => toggleDay('holiday', idx)}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <button
            className="btn btn-primary w-full sm:w-auto"
            onClick={handleSave}
            disabled={!childId}
          >
            Save Schedule
          </button>
        </div>
      </div>
    </section>
  )
}
