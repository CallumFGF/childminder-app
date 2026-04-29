import { useState, useEffect } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    providerName: '', providerAddress: '', urn: '',
    bankName: '', accountName: '', accountNumber: '', sortCode: ''
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    setSettings({
      providerName: localStorage.getItem('providerName') || '',
      providerAddress: localStorage.getItem('providerAddress') || '',
      urn: localStorage.getItem('urn') || '',
      bankName: localStorage.getItem('bankName') || '',
      accountName: localStorage.getItem('accountName') || '',
      accountNumber: localStorage.getItem('accountNumber') || '',
      sortCode: localStorage.getItem('sortCode') || ''
    })
  }, [])

  function updateField(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  function handleSave(e) {
    e.preventDefault()
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value)
    })
    setMessage('Settings saved! Your invoices will now use these details.')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <section className="app-panel rounded-2xl">
      <div className="border-b border-base-300/80 px-6 py-5">
        <p className="app-kicker">App Configuration</p>
        <h2 className="app-section-title mt-2">Invoice Settings</h2>
        <p className="mt-2 text-sm text-base-content/65">
          Your details are saved securely on this device only. They are not uploaded to the internet.
        </p>
      </div>
      <div className="px-6 py-6">
        {message && <div className="alert alert-success mb-5 text-sm">{message}</div>}
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
          <label className="app-field">
            <span className="app-field-label">Provider Name</span>
            <input className="input input-bordered w-full" placeholder="e.g. Beth Fisher" value={settings.providerName} onChange={e => updateField('providerName', e.target.value)} required />
          </label>
          <label className="app-field">
            <span className="app-field-label">Provider Address</span>
            <input className="input input-bordered w-full" placeholder="e.g. 123 Childminder Lane" value={settings.providerAddress} onChange={e => updateField('providerAddress', e.target.value)} required />
          </label>
          <label className="app-field">
            <span className="app-field-label">Ofsted URN</span>
            <input className="input input-bordered w-full" placeholder="e.g. 1234567" value={settings.urn} onChange={e => updateField('urn', e.target.value)} required />
          </label>
          
          <div className="md:col-span-2 mt-4"><h3 className="font-semibold">Bank Details</h3></div>
          
          <label className="app-field">
            <span className="app-field-label">Bank Name</span>
            <input className="input input-bordered w-full" placeholder="e.g. Monzo" value={settings.bankName} onChange={e => updateField('bankName', e.target.value)} required />
          </label>
          <label className="app-field">
            <span className="app-field-label">Account Holder</span>
            <input className="input input-bordered w-full" placeholder="e.g. Callum Fackrell" value={settings.accountName} onChange={e => updateField('accountName', e.target.value)} required />
          </label>
          <label className="app-field">
            <span className="app-field-label">Account Number</span>
            <input className="input input-bordered w-full" placeholder="8 digits" value={settings.accountNumber} onChange={e => updateField('accountNumber', e.target.value)} required />
          </label>
          <label className="app-field">
            <span className="app-field-label">Sort Code</span>
            <input className="input input-bordered w-full" placeholder="00-00-00" value={settings.sortCode} onChange={e => updateField('sortCode', e.target.value)} required />
          </label>
          
          <div className="md:col-span-2 mt-2">
            <button className="btn btn-primary" type="submit">Save Settings</button>
          </div>
        </form>
      </div>
    </section>
  )
}