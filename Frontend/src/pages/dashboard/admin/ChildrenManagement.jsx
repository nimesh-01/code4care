import { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FaSearch, FaPlus, FaFilter, FaTrashAlt, FaEdit, FaTimes, FaEye } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAdminDashboardContext } from './AdminLayout'
import { childrenAPI } from '../../../services/api'

const baseForm = {
  name: '',
  age: '',
  gender: 'Male',
  city: '',
  state: '',
  educationStatus: '',
  healthStatus: '',
  background: '',
  status: 'active',
}

const statusOptions = ['all', 'active', 'archived']
const genderOptions = ['all', 'Male', 'Female', 'Other']

const getChildId = (child) => child?._id || child?.id

const Pill = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm transition ${
      active
        ? 'bg-coral-100 text-coral-600 dark:bg-coral-500/30 dark:text-cream-50'
        : 'bg-cream-100 text-teal-700 hover:bg-cream-200 dark:bg-dark-800 dark:text-cream-200'
    }`}
  >
    {children}
  </button>
)

const Field = ({ label, children }) => (
  <label className="flex flex-col gap-1 text-sm font-medium text-teal-800 dark:text-cream-200">
    {label}
    {children}
  </label>
)

const Input = (props) => (
  <input
    {...props}
    className={`rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-teal-900 placeholder:text-teal-400 focus:border-coral-400 focus:outline-none dark:border-dark-700 dark:bg-dark-800 dark:text-cream-50 ${
      props.className || ''
    }`}
  />
)

const TextArea = (props) => (
  <textarea
    {...props}
    className={`rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-teal-900 placeholder:text-teal-400 focus:border-coral-400 focus:outline-none dark:border-dark-700 dark:bg-dark-800 dark:text-cream-50 ${
      props.className || ''
    }`}
  />
)

const ChildrenManagement = () => {
  const { data, refresh } = useAdminDashboardContext()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [gender, setGender] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [workingChild, setWorkingChild] = useState(null)
  const [formState, setFormState] = useState(baseForm)
  const [imageFile, setImageFile] = useState(null)
  const [documentFiles, setDocumentFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const children = data.children ?? []

  const filteredChildren = useMemo(() => {
    return children.filter((child) => {
      const name = child.name || child.fullName || ''
      const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
      const childStatus = child.status || 'active'
      const matchesStatus = status === 'all' || childStatus === status
      const childGender = child.gender || 'N/A'
      const matchesGender = gender === 'all' || childGender === gender
      return matchesSearch && matchesStatus && matchesGender
    })
  }, [children, search, status, gender])

  const closeModal = () => {
    setModalOpen(false)
    setWorkingChild(null)
    setFormState(baseForm)
    setImageFile(null)
    setDocumentFiles([])
  }

  const openModal = (child = null) => {
    if (child) {
      setWorkingChild(child)
      setFormState({
        name: child.name || '',
        age: child.age?.toString() || '',
        gender: child.gender || 'Male',
        city: child.city || '',
        state: child.state || '',
        educationStatus: child.educationStatus || '',
        healthStatus: child.healthStatus || '',
        background: child.background || '',
        status: child.status || 'active',
      })
    } else {
      setWorkingChild(null)
      setFormState(baseForm)
    }
    setImageFile(null)
    setDocumentFiles([])
    setModalOpen(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const isEditing = Boolean(workingChild)
    const formData = new FormData()
    Object.entries(formState).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value)
      }
    })

    if (imageFile) {
      formData.append('image', imageFile)
    }

    documentFiles.forEach((file) => {
      formData.append('documents', file)
    })

    try {
      setSubmitting(true)
      if (isEditing) {
        await childrenAPI.update(getChildId(workingChild), formData)
        toast.success('Child updated successfully')
      } else {
        await childrenAPI.create(formData)
        toast.success('Child profile created')
      }
      await refresh()
      closeModal()
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to save child profile'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = useCallback(async (child) => {
    const childId = getChildId(child)
    if (!childId) return
    const label = child.name || child.fullName || 'this child'
    const confirmDelete = window.confirm(`Delete ${label}? This action cannot be undone.`)
    if (!confirmDelete) return
    try {
      await childrenAPI.delete(childId)
      toast.success('Child removed successfully')
      await refresh()
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete child'
      toast.error(message)
    }
  }, [refresh])

  const formatUpdatedAt = (value) => {
    if (!value) return 'Not available'
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Children</p>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">Children Management</h2>
            <p className="text-sm text-teal-600 dark:text-cream-300/70">Create, update and audit the children linked to your orphanage record.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coral-500 to-teal-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-coral-200/60"
            >
              <FaPlus /> Add child
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-3xl border border-cream-200 bg-white/90 p-6 shadow-lg dark:border-dark-700 dark:bg-dark-900/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-cream-200 bg-white px-4 py-2 dark:border-dark-700 dark:bg-dark-800">
            <FaSearch className="text-teal-500 dark:text-cream-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, city or state…"
              className="flex-1 bg-transparent text-sm text-teal-900 placeholder:text-teal-400 focus:outline-none dark:text-cream-50 dark:placeholder:text-cream-400"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700 dark:text-cream-200">
            <FaFilter /> Status:
            {statusOptions.map((option) => (
              <Pill key={option} active={status === option} onClick={() => setStatus(option)}>
                {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-teal-700 dark:text-cream-200">
            Gender:
            {genderOptions.map((option) => (
              <button
                key={option}
                onClick={() => setGender(option)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  gender === option
                    ? 'bg-coral-500/20 text-coral-700 dark:text-coral-200'
                    : 'text-teal-500 dark:text-cream-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {filteredChildren.length ? (
            <table className="w-full text-left text-sm text-teal-900 dark:text-cream-100">
              <thead>
                <tr className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-400">
                  <th className="pb-4">Child</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Education</th>
                  <th className="pb-4">Health</th>
                  <th className="pb-4">Updated</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200 dark:divide-dark-700">
                {filteredChildren.map((child) => (
                  <tr key={getChildId(child)} className="hover:bg-cream-100 dark:hover:bg-dark-800/60">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-cream-200 bg-cream-100 dark:border-dark-700 dark:bg-dark-800">
                          {child.profileUrl ? (
                            <img
                              src={child.profileUrl}
                              alt={child.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-teal-400 dark:text-cream-400">
                              No photo
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-teal-900 dark:text-cream-50">{child.name || child.fullName || 'Unnamed child'}</p>
                          <p className="text-xs text-teal-500 dark:text-cream-300/80">{child.age || 'N/A'} yrs • {child.gender || 'N/A'} • {child.city || 'NA'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        child.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100'
                          : 'bg-slate-200 text-slate-700 dark:bg-slate-600/40 dark:text-slate-200'
                      }`}>
                        {child.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm text-teal-800 dark:text-cream-100">{child.educationStatus || 'Not specified'}</p>
                      <p className="text-xs text-teal-500 dark:text-cream-300/80">State • {child.state || 'NA'}</p>
                    </td>
                    <td>
                      <p className="text-sm text-teal-800 dark:text-cream-100">{child.healthStatus || 'Not specified'}</p>
                      <p className="text-xs text-teal-500 dark:text-cream-300/80">Documents • {(child.documents?.length || 0)}</p>
                    </td>
                    <td>
                      <p className="text-sm text-teal-800 dark:text-cream-100">{formatUpdatedAt(child.updatedAt)}</p>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={`/children/${getChildId(child)}`}
                          className="inline-flex items-center gap-1 rounded-full border border-teal-300 px-3 py-1 text-xs font-semibold text-teal-600 hover:border-teal-500 hover:bg-teal-50 dark:border-teal-600 dark:text-teal-300 dark:hover:bg-teal-500/10"
                        >
                          <FaEye /> View
                        </Link>
                        <button
                          onClick={() => openModal(child)}
                          className="inline-flex items-center gap-1 rounded-full border border-cream-300 px-3 py-1 text-xs font-semibold text-teal-700 hover:border-coral-400 hover:text-coral-500 dark:border-dark-600 dark:text-cream-200"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(child)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-300"
                        >
                          <FaTrashAlt /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-sm text-teal-500 dark:text-cream-300">
              No children records found for this orphanage yet.
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
          <div className="relative w-full max-w-3xl rounded-3xl border border-cream-200 bg-white p-8 shadow-2xl dark:border-dark-700 dark:bg-dark-900">
            <button
              onClick={closeModal}
              className="absolute right-5 top-5 text-teal-500 hover:text-coral-500 dark:text-cream-300"
              aria-label="Close form"
            >
              <FaTimes />
            </button>
            <h3 className="text-2xl font-semibold text-teal-900 dark:text-cream-50">
              {workingChild ? 'Update child profile' : 'Create child profile'}
            </h3>
            <p className="mt-1 text-sm text-teal-600 dark:text-cream-300/80">
              Fill out the child details and attach files. Images and PDFs are supported.
            </p>
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full name">
                  <Input name="name" value={formState.name} onChange={handleInputChange} required />
                </Field>
                <Field label="Age">
                  <Input name="age" type="number" min="0" value={formState.age} onChange={handleInputChange} required />
                </Field>
                <Field label="Gender">
                  <select
                    name="gender"
                    value={formState.gender}
                    onChange={handleInputChange}
                    className="rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-700 dark:bg-dark-800 dark:text-cream-50"
                  >
                    {['Male', 'Female', 'Other'].map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    name="status"
                    value={formState.status}
                    onChange={handleInputChange}
                    className="rounded-xl border border-cream-200 bg-white px-3 py-2 text-sm text-teal-900 focus:border-coral-400 focus:outline-none dark:border-dark-700 dark:bg-dark-800 dark:text-cream-50"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
                <Field label="City">
                  <Input name="city" value={formState.city} onChange={handleInputChange} required />
                </Field>
                <Field label="State">
                  <Input name="state" value={formState.state} onChange={handleInputChange} required />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Education status">
                  <Input name="educationStatus" value={formState.educationStatus} onChange={handleInputChange} />
                </Field>
                <Field label="Health status">
                  <Input name="healthStatus" value={formState.healthStatus} onChange={handleInputChange} />
                </Field>
              </div>
              <Field label="Background / Story">
                <TextArea
                  name="background"
                  rows="3"
                  value={formState.background}
                  onChange={handleInputChange}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Profile photo">
                  <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                  {workingChild?.profileUrl && !imageFile && (
                    <p className="text-xs text-teal-500 dark:text-cream-400">Current image will be kept unless a new file is selected.</p>
                  )}
                </Field>
                <Field label="Supporting documents (multiple)">
                  <Input type="file" multiple accept="image/*,.pdf" onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))} />
                </Field>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-cream-200 px-6 py-2 text-sm font-semibold text-teal-700 hover:border-coral-400 hover:text-coral-500 dark:border-dark-600 dark:text-cream-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gradient-to-r from-coral-500 to-teal-500 px-8 py-2 text-sm font-semibold text-white shadow-lg shadow-coral-200/60 disabled:opacity-70"
                >
                  {submitting ? 'Saving…' : workingChild ? 'Update child' : 'Create child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChildrenManagement
