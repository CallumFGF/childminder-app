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
    <div className="card bg-base-100 shadow-xl p-6">
      <h2 className="text-xl font-bold mb-4">Weekly Schedule</h2>
      {message && <div className="alert alert-info mb-4">{message}</div>}

      <select
        className="select select-bordered w-full mb-6"
        value={childId}
        onChange={(e) => setChildId(e.target.value)}
      >
        <option value="">-- Select Child --</option>
        {children.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {childId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Term-time days */}
          <div>
            <h3 className="font-semibold mb-2 text-primary">Term-time days</h3>
            <div className="space-y-2">
              {DAY_LABELS.map((label, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={termDays.has(idx)}
                    onChange={() => toggleDay('term', idx)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Holiday days */}
          <div>
            <h3 className="font-semibold mb-2 text-secondary">Holiday days</h3>
            <div className="space-y-2">
              {DAY_LABELS.map((label, idx) => (
                <label key={idx} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-secondary"
                    checked={holidayDays.has(idx)}
                    onChange={() => toggleDay('holiday', idx)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary w-full"
        onClick={handleSave}
        disabled={!childId}
      >
        Save Schedule
      </button>
    </div>
  )
}
