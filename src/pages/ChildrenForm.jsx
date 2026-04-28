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
    <div className="card bg-base-100 shadow-xl p-6 max-w-lg mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Add a Child</h2>
      {message && <div className="alert alert-info mb-4">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Parent dropdown */}
        <select
          className="select select-bordered w-full"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          required
        >
          <option value="">-- Select Parent --</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <input
          className="input input-bordered w-full"
          placeholder="Child's Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="input input-bordered w-full"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />

        {/* Funding Type */}
        <select
          className="select select-bordered w-full"
          value={fundingType}
          onChange={(e) => setFundingType(e.target.value)}
        >
          <option value="None">No Funding</option>
          <option value="15hr">15 Hours Funded</option>
          <option value="30hr">30 Hours Funded</option>
        </select>

        {/* Stretched toggle (only relevant if funding) */}
        {fundingType !== 'None' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="checkbox"
              checked={isStretched}
              onChange={(e) => setIsStretched(e.target.checked)}
            />
            <span>Stretched Funding (spread across 51/52 weeks)</span>
          </label>
        )}

        <button className="btn btn-primary w-full" type="submit">
          Save Child
        </button>
      </form>
    </div>
  )
}