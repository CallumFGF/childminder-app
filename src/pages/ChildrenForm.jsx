import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function ChildrenForm() {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [parentId, setParentId] = useState('')
  const [fundingType, setFundingType] = useState('None')
  const [isStretched, setIsStretched] = useState(false)
  const [parents, setParents] = useState([])
  const [message, setMessage] = useState('')

  // Fetch the list of parents for the dropdown
  useEffect(() => {
    async function fetchParents() {
      const { data } = await supabase.from('parents').select('id, name').order('name')
      setParents(data || [])
    }
    fetchParents()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('Saving...')

    const { error } = await supabase.from('children').insert([{
      name,
      dob: dob || null,
      parent_id: parentId,
      funding_type: fundingType,
      is_stretched_funding: isStretched,
    }])

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Child added!')
      setName('')
      setDob('')
      setParentId('')
      setFundingType('None')
      setIsStretched(false)
    }
  }

  return (
    <section className="app-panel rounded-2xl">
      <div className="border-b border-base-300/80 px-6 py-5">
        <p className="app-kicker">Child Records</p>
        <h2 className="app-section-title mt-2">Add a child</h2>
        <p className="mt-2 text-sm text-base-content/65">Store the linked parent, date of birth, and funded-hours setup.</p>
      </div>

      <div className="px-6 py-6">
        {message && <div className="alert alert-info mb-5 text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="app-field">
            <span className="app-field-label">Parent</span>
            <select
              className="select select-bordered w-full"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
            >
              <option value="">Select parent</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label className="app-field">
            <span className="app-field-label">Child name</span>
            <input
              className="input input-bordered w-full"
              placeholder="Child's Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="app-field">
            <span className="app-field-label">Date of birth</span>
            <input
              className="input input-bordered w-full"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </label>

          <label className="app-field">
            <span className="app-field-label">Funding type</span>
            <select
              className="select select-bordered w-full"
              value={fundingType}
              onChange={(e) => setFundingType(e.target.value)}
            >
              <option value="None">No Funding</option>
              <option value="15hr">15 Hours Funded</option>
              <option value="30hr">30 Hours Funded</option>
            </select>
          </label>

        {fundingType !== 'None' && (
          <label className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-200/60 px-4 py-3">
            <input
              type="checkbox"
              className="checkbox"
              checked={isStretched}
              onChange={(e) => setIsStretched(e.target.checked)}
            />
            <span className="text-sm leading-6">Stretched funding spread across 51 to 52 weeks</span>
          </label>
        )}

          <button className="btn btn-primary w-full sm:w-auto" type="submit">
            Save Child
          </button>
        </form>
      </div>
    </section>
  )
}
