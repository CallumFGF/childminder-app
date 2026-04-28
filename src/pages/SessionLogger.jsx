import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function SessionLogger() {
  const [childId, setChildId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [children, setChildren] = useState([])
  const [message, setMessage] = useState('')

  // Fetch all children for the dropdown
  useEffect(() => {
    async function fetchChildren() {
      const { data } = await supabase
        .from('children')
        .select('id, name')
        .order('name')
      setChildren(data || [])
    }
    fetchChildren()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('Saving...')

    const { error } = await supabase.from('sessions').insert([
      {
        child_id: childId,
        date,
        start_time: startTime,
        end_time: endTime,
      },
    ])

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Session logged!')
      setChildId('')
      setDate('')
      setStartTime('')
      setEndTime('')
    }
  }

  return (
    <div className="card bg-base-100 shadow-xl p-6">
      <h2 className="text-xl font-bold mb-4">Log a Session</h2>
      {message && <div className="alert alert-info mb-4">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Child dropdown */}
        <select
          className="select select-bordered w-full"
          value={childId}
          onChange={(e) => setChildId(e.target.value)}
          required
        >
          <option value="">-- Select Child --</option>
          {children.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Date */}
        <input
          className="input input-bordered w-full"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />

        {/* Time inputs in a row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">
              <span className="label-text">Start Time</span>
            </label>
            <input
              className="input input-bordered w-full"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">End Time</span>
            </label>
            <input
              className="input input-bordered w-full"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <button className="btn btn-primary w-full" type="submit">
          Save Session
        </button>
      </form>
    </div>
  )
}