import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const emptyParentForm = { name: '', email: '', phone: '', address: '' }
const emptyChildForm = { name: '', dob: '', funding_type: 'None', is_stretched_funding: false }

function sortChildren(children) {
  return [...children].sort((a, b) => a.name.localeCompare(b.name))
}

function ScheduleEditor({ childId, schedule = [], onSaved }) {
  const [termDays, setTermDays] = useState(new Set())
  const [holidayDays, setHolidayDays] = useState(new Set())
  const [message, setMessage] = useState('')

  useEffect(() => {
    const nextTerm = new Set()
    const nextHoliday = new Set()
    schedule.forEach((row) => {
      if (row.schedule_type === 'holiday') nextHoliday.add(row.day_of_week)
      else nextTerm.add(row.day_of_week)
    })
    setTermDays(nextTerm)
    setHolidayDays(nextHoliday)
  }, [schedule])

  function toggleDay(type, dayIndex) {
    const current = type === 'term' ? termDays : holidayDays
    const setter = type === 'term' ? setTermDays : setHolidayDays
    const next = new Set(current)
    if (next.has(dayIndex)) next.delete(dayIndex)
    else next.add(dayIndex)
    setter(next)
  }

  async function handleSave() {
    setMessage('Saving...')
    await supabase.from('child_schedules').delete().eq('child_id', childId)

    const rows = [
      ...Array.from(termDays).map((day) => ({ child_id: childId, day_of_week: day, schedule_type: 'term' })),
      ...Array.from(holidayDays).map((day) => ({ child_id: childId, day_of_week: day, schedule_type: 'holiday' })),
    ]

    if (rows.length > 0) {
      const { error } = await supabase.from('child_schedules').insert(rows)
      if (error) {
        setMessage(`Error: ${error.message}`)
        return
      }
    }

    setMessage('Schedule saved')
    onSaved?.()
  }

  return (
    <div className="rounded-xl border border-base-300 bg-base-100/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold">Weekly schedule</h4>
          <p className="text-xs text-base-content/60">Set term-time and holiday attendance inside this child record.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>Save schedule</button>
      </div>

      {message && <div className="alert alert-info mb-3 text-sm">{message}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="app-grid-card">
          <h5 className="font-semibold text-primary">Term-time</h5>
          <div className="mt-3 space-y-2">
            {DAY_LABELS.map((label, idx) => (
              <label key={label} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-base-100">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary checkbox-sm"
                  checked={termDays.has(idx)}
                  onChange={() => toggleDay('term', idx)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="app-grid-card">
          <h5 className="font-semibold text-accent">Holiday</h5>
          <div className="mt-3 space-y-2">
            {DAY_LABELS.map((label, idx) => (
              <label key={label} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-base-100">
                <input
                  type="checkbox"
                  className="checkbox checkbox-accent checkbox-sm"
                  checked={holidayDays.has(idx)}
                  onChange={() => toggleDay('holiday', idx)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ParentForm({ title, buttonLabel, initialValue, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValue)
  const [message, setMessage] = useState('')

  useEffect(() => setForm(initialValue), [initialValue])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('Saving...')
    const result = await onSubmit(form)
    if (result?.error) {
      setMessage(`Error: ${result.error.message}`)
      return
    }
    setMessage('')
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="rounded-xl border border-base-300 bg-base-100/80 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {onCancel && <button className="btn btn-ghost btn-sm" onClick={onCancel}>Close</button>}
      </div>
      {message && <div className="alert alert-info mb-3 text-sm">{message}</div>}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="app-field md:col-span-2">
          <span className="app-field-label">Full name</span>
          <input className="input input-bordered w-full" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
        </label>
        <label className="app-field">
          <span className="app-field-label">Email</span>
          <input className="input input-bordered w-full" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
        </label>
        <label className="app-field">
          <span className="app-field-label">Phone</span>
          <input className="input input-bordered w-full" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
        </label>
        <label className="app-field md:col-span-2">
          <span className="app-field-label">Address</span>
          <textarea className="textarea textarea-bordered min-h-24 w-full" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <button className="btn btn-primary" type="submit">{buttonLabel}</button>
        </div>
      </form>
    </div>
  )
}

function ChildForm({ title, buttonLabel, initialValue, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValue)
  const [message, setMessage] = useState('')

  useEffect(() => setForm(initialValue), [initialValue])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('Saving...')
    const result = await onSubmit(form)
    if (result?.error) {
      setMessage(`Error: ${result.error.message}`)
      return
    }
    setMessage('')
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="rounded-xl border border-base-300 bg-base-100/80 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        {onCancel && <button className="btn btn-ghost btn-sm" onClick={onCancel}>Close</button>}
      </div>
      {message && <div className="alert alert-info mb-3 text-sm">{message}</div>}
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
        <label className="app-field">
          <span className="app-field-label">Child name</span>
          <input className="input input-bordered w-full" value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
        </label>
        <label className="app-field">
          <span className="app-field-label">Date of birth</span>
          <input className="input input-bordered w-full" type="date" value={form.dob || ''} onChange={(e) => updateField('dob', e.target.value)} />
        </label>
        <label className="app-field">
          <span className="app-field-label">Funding type</span>
          <select className="select select-bordered w-full" value={form.funding_type} onChange={(e) => updateField('funding_type', e.target.value)}>
            <option value="None">No funding</option>
            <option value="15hr">15 hours funded</option>
            <option value="30hr">30 hours funded</option>
          </select>
        </label>
        {form.funding_type !== 'None' && (
          <label className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-200/60 px-4 py-3 lg:self-end">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={form.is_stretched_funding}
              onChange={(e) => updateField('is_stretched_funding', e.target.checked)}
            />
            <span className="text-sm leading-6">Stretched funding spread across 51 to 52 weeks</span>
          </label>
        )}
        <div className="lg:col-span-2">
          <button className="btn btn-primary" type="submit">{buttonLabel}</button>
        </div>
      </form>
    </div>
  )
}

export default function FamilyWorkspace() {
  const [parents, setParents] = useState([])
  const [children, setChildren] = useState([])
  const [schedules, setSchedules] = useState([])
  const [showAddParent, setShowAddParent] = useState(false)
  const [expandedParentId, setExpandedParentId] = useState(null)
  const [editingParentId, setEditingParentId] = useState(null)
  const [addingChildToParentId, setAddingChildToParentId] = useState(null)
  const [editingChildId, setEditingChildId] = useState(null)
  const [openScheduleChildId, setOpenScheduleChildId] = useState(null)
  const [workspaceMessage, setWorkspaceMessage] = useState('')

  async function loadData() {
    const [parentsRes, childrenRes, schedulesRes] = await Promise.all([
      supabase.from('parents').select('*').order('name'),
      supabase.from('children').select('*').order('name'),
      supabase.from('child_schedules').select('child_id, day_of_week, schedule_type'),
    ])

    setParents(parentsRes.data || [])
    setChildren(childrenRes.data || [])
    setSchedules(schedulesRes.data || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  const childrenByParent = useMemo(() => {
    const map = {}
    children.forEach((child) => {
      if (!map[child.parent_id]) map[child.parent_id] = []
      map[child.parent_id].push(child)
    })
    Object.keys(map).forEach((key) => {
      map[key] = sortChildren(map[key])
    })
    return map
  }, [children])

  const scheduleByChild = useMemo(() => {
    const map = {}
    schedules.forEach((row) => {
      if (!map[row.child_id]) map[row.child_id] = []
      map[row.child_id].push(row)
    })
    return map
  }, [schedules])

  async function createParent(form) {
    const result = await supabase.from('parents').insert([form])
    if (!result.error) {
      await loadData()
      setShowAddParent(false)
      setWorkspaceMessage('Parent added')
    }
    return result
  }

  async function updateParent(id, form) {
    const result = await supabase.from('parents').update(form).eq('id', id)
    if (!result.error) {
      await loadData()
      setEditingParentId(null)
      setWorkspaceMessage('Parent updated')
    }
    return result
  }

  async function createChild(parentId, form) {
    const result = await supabase.from('children').insert([{ ...form, dob: form.dob || null, parent_id: parentId }])
    if (!result.error) {
      await loadData()
      setAddingChildToParentId(null)
      setExpandedParentId(parentId)
      setWorkspaceMessage('Child added')
    }
    return result
  }

  async function updateChild(id, form) {
    const result = await supabase.from('children').update({ ...form, dob: form.dob || null }).eq('id', id)
    if (!result.error) {
      await loadData()
      setEditingChildId(null)
      setWorkspaceMessage('Child updated')
    }
    return result
  }

  async function deleteChild(child) {
    const confirmed = window.confirm(`Delete ${child.name}? This will also remove the saved weekly schedule for this child.`)
    if (!confirmed) return

    const scheduleResult = await supabase.from('child_schedules').delete().eq('child_id', child.id)
    if (scheduleResult.error) {
      setWorkspaceMessage(`Error: ${scheduleResult.error.message}`)
      return
    }

    const childResult = await supabase.from('children').delete().eq('id', child.id)
    if (childResult.error) {
      setWorkspaceMessage(`Error: ${childResult.error.message}`)
      return
    }

    await loadData()
    setEditingChildId(null)
    setOpenScheduleChildId(null)
    setWorkspaceMessage('Child deleted')
  }

  async function deleteParent(parent, parentChildren) {
    const confirmed = window.confirm(`Delete ${parent.name}? This will remove the family, all linked children, and all linked schedules.`)
    if (!confirmed) return

    if (parentChildren.length > 0) {
      const childIds = parentChildren.map((child) => child.id)
      const scheduleResult = await supabase.from('child_schedules').delete().in('child_id', childIds)
      if (scheduleResult.error) {
        setWorkspaceMessage(`Error: ${scheduleResult.error.message}`)
        return
      }

      const childrenResult = await supabase.from('children').delete().eq('parent_id', parent.id)
      if (childrenResult.error) {
        setWorkspaceMessage(`Error: ${childrenResult.error.message}`)
        return
      }
    }

    const parentResult = await supabase.from('parents').delete().eq('id', parent.id)
    if (parentResult.error) {
      setWorkspaceMessage(`Error: ${parentResult.error.message}`)
      return
    }

    await loadData()
    setExpandedParentId(null)
    setEditingParentId(null)
    setWorkspaceMessage('Family deleted')
  }

  function fundingBadge(type) {
    if (type === '30hr') return <span className="badge badge-success badge-sm">30hr funded</span>
    if (type === '15hr') return <span className="badge badge-info badge-sm">15hr funded</span>
    return <span className="badge badge-ghost badge-sm">Private only</span>
  }

  return (
    <section className="space-y-4">
      <div className="app-panel rounded-2xl">
        <div className="border-b border-base-300/80 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="app-kicker">Family Records</p>
              <h2 className="app-section-title mt-2">Families and children</h2>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddParent((current) => !current)}>
              {showAddParent ? 'Close add parent' : '+ Add parent'}
            </button>
          </div>
        </div>

        <div className="px-6 py-6">
          {workspaceMessage && <div className="alert alert-success mb-4 text-sm">{workspaceMessage}</div>}
          {showAddParent && (
            <ParentForm
              title="Add parent"
              buttonLabel="Save parent"
              initialValue={emptyParentForm}
              onSubmit={createParent}
              onCancel={() => setShowAddParent(false)}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {parents.map((parent) => {
          const parentChildren = childrenByParent[parent.id] || []
          const isExpanded = expandedParentId === parent.id
          const isEditingParent = editingParentId === parent.id
          const isAddingChild = addingChildToParentId === parent.id

          return (
            <article key={parent.id} className="app-panel rounded-2xl">
              <div className="px-6 py-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{parent.name}</h3>
                      <span className="badge badge-outline badge-sm">{parentChildren.length} child{parentChildren.length === 1 ? '' : 'ren'}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/65">
                      {parent.email && <span>{parent.email}</span>}
                      {parent.phone && <span>{parent.phone}</span>}
                      {parent.address && <span>{parent.address}</span>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => setExpandedParentId(isExpanded ? null : parent.id)}>
                      {isExpanded ? 'Collapse' : 'Open family'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingParentId(isEditingParent ? null : parent.id)}>
                      {isEditingParent ? 'Close edit' : 'Edit parent'}
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => setAddingChildToParentId(isAddingChild ? null : parent.id)}>
                      {isAddingChild ? 'Close add child' : '+ Add child'}
                    </button>
                    <button className="btn btn-ghost btn-sm text-error" onClick={() => deleteParent(parent, parentChildren)}>
                      Delete
                    </button>
                  </div>
                </div>

                {(isEditingParent || isAddingChild || isExpanded) && <div className="mt-4 border-t border-base-300/80" />}

                <div className="mt-4 space-y-4">
                  {isEditingParent && (
                    <ParentForm
                      title={`Edit ${parent.name}`}
                      buttonLabel="Save changes"
                      initialValue={{
                        name: parent.name || '',
                        email: parent.email || '',
                        phone: parent.phone || '',
                        address: parent.address || '',
                      }}
                      onSubmit={(form) => updateParent(parent.id, form)}
                      onCancel={() => setEditingParentId(null)}
                    />
                  )}

                  {isAddingChild && (
                    <ChildForm
                      title={`Add child to ${parent.name}`}
                      buttonLabel="Save child"
                      initialValue={emptyChildForm}
                      onSubmit={(form) => createChild(parent.id, form)}
                      onCancel={() => setAddingChildToParentId(null)}
                    />
                  )}

                  {isExpanded && (
                    <div className="space-y-4">
                      {parentChildren.length === 0 && (
                        <div className="rounded-xl border border-dashed border-base-300 bg-base-100/70 px-4 py-5 text-sm text-base-content/60">
                          No children linked yet. Use “Add child” on this family card to create the first record.
                        </div>
                      )}

                      {parentChildren.map((child) => {
                        const isEditingChild = editingChildId === child.id
                        const isScheduleOpen = openScheduleChildId === child.id

                        return (
                          <div key={child.id} className="rounded-2xl border border-base-300 bg-base-100/75 p-4">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-semibold">{child.name}</h4>
                                  {fundingBadge(child.funding_type)}
                                  {child.is_stretched_funding && <span className="badge badge-outline badge-sm">Stretched</span>}
                                </div>
                                <div className="mt-2 text-sm text-base-content/65">
                                  {child.dob ? `DOB: ${child.dob}` : 'No date of birth recorded'}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <button className="btn btn-outline btn-sm" onClick={() => setEditingChildId(isEditingChild ? null : child.id)}>
                                  {isEditingChild ? 'Close edit' : 'Edit child'}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setOpenScheduleChildId(isScheduleOpen ? null : child.id)}>
                                  {isScheduleOpen ? 'Hide schedule' : 'Schedule'}
                                </button>
                                <button className="btn btn-ghost btn-sm text-error" onClick={() => deleteChild(child)}>
                                  Delete
                                </button>
                              </div>
                            </div>

                            {(isEditingChild || isScheduleOpen) && <div className="my-4 border-t border-base-300/80" />}

                            <div className="space-y-4">
                              {isEditingChild && (
                                <ChildForm
                                  title={`Edit ${child.name}`}
                                  buttonLabel="Save changes"
                                  initialValue={{
                                    name: child.name || '',
                                    dob: child.dob || '',
                                    funding_type: child.funding_type || 'None',
                                    is_stretched_funding: Boolean(child.is_stretched_funding),
                                  }}
                                  onSubmit={(form) => updateChild(child.id, form)}
                                  onCancel={() => setEditingChildId(null)}
                                />
                              )}

                              {isScheduleOpen && (
                                <ScheduleEditor
                                  childId={child.id}
                                  schedule={scheduleByChild[child.id] || []}
                                  onSaved={loadData}
                                />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
