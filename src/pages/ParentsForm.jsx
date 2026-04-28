import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function ParentsForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('Saving...')

    const { error } = await supabase
      .from('parents')
      .insert([{ name, email, phone, address }])

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Parent added!')
      setName('')
      setEmail('')
      setPhone('')
      setAddress('')
    }
  }

  return (
    <section className="app-panel rounded-2xl">
      <div className="border-b border-base-300/80 px-6 py-5">
        <p className="app-kicker">Family Records</p>
        <h2 className="app-section-title mt-2">Add a parent</h2>
        <p className="mt-2 text-sm text-base-content/65">Keep billing contacts and address details together for invoicing.</p>
      </div>

      <div className="px-6 py-6">
        {message && <div className="alert alert-info mb-5 text-sm">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="app-field">
            <span className="app-field-label">Full name</span>
            <input
              className="input input-bordered w-full"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="app-field">
            <span className="app-field-label">Email</span>
            <input
              className="input input-bordered w-full"
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="app-field">
            <span className="app-field-label">Phone</span>
            <input
              className="input input-bordered w-full"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          <label className="app-field">
            <span className="app-field-label">Address</span>
            <textarea
              className="textarea textarea-bordered min-h-28 w-full"
              placeholder="Address (optional)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>

          <button className="btn btn-primary w-full sm:w-auto" type="submit">
            Save Parent
          </button>
        </form>
      </div>
    </section>
  )
}
