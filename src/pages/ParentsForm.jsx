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
    <div className="card bg-base-100 shadow-xl p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Add a Parent</h2>
      {message && <div className="alert alert-info mb-4">{message}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="input input-bordered w-full"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input input-bordered w-full"
          type="email"
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="input input-bordered w-full"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Address (optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button className="btn btn-primary w-full" type="submit">
          Save Parent
        </button>
      </form>
    </div>
  )
}