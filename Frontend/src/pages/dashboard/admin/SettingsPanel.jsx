import { useEffect, useMemo, useRef, useState } from 'react'
import { FaSave, FaUpload, FaShieldAlt } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { useAdminDashboardContext } from './AdminLayout'
import AdministratorIdentityCard from './components/AdministratorIdentityCard'
import { useAuth } from '../../../context/AuthContext'
import { adminOrphanageAPI, authAPI } from '../../../services/api'
import { ScrollReveal } from '../../../hooks/useScrollReveal'

const SettingsPanel = () => {
  const { data, refresh } = useAdminDashboardContext()
  const { user, checkAuth } = useAuth()
  const profile = data.orphanageProfile
  const adminProfile = user?.adminProfile
  const [form, setForm] = useState({
    name: '',
    registrationNumber: '',
    orphanage_mail: '',
    orphanage_phone: '',
    address: { street: '', city: '', state: '', pincode: '' },
  })
  const [saving, setSaving] = useState(false)
  const [adminForm, setAdminForm] = useState({
    designation: '',
    gender: '',
    phone: '',
    alternatePhone: '',
    alternateEmail: '',
    governmentIdType: '',
    governmentIdNumber: '',
    dateOfBirth: '',
    emergencyContact: { name: '', relation: '', phone: '' },
  })
  const [adminSaving, setAdminSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [uploadingField, setUploadingField] = useState(null)
  const [newDocName, setNewDocName] = useState('')
  const fileInputs = useRef({})
  const adminFormRef = useRef(null)

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '',
      registrationNumber: profile.registrationNumber || '',
      orphanage_mail: profile.orphanage_mail || profile.contactEmail || '',
      orphanage_phone: profile.orphanage_phone || profile.phone || '',
      address: {
        street: profile.address?.street || '',
        city: profile.address?.city || '',
        state: profile.address?.state || '',
        pincode: profile.address?.pincode || '',
      },
    })
  }, [profile])

  useEffect(() => {
    if (!user) return
    const source = user.adminProfile || {}
    const dob = source.dateOfBirth ? new Date(source.dateOfBirth) : null
    setAdminForm({
      designation: source.designation || '',
      gender: source.gender || '',
      phone: user.phone || '',
      alternatePhone: source.alternatePhone || '',
      alternateEmail: source.alternateEmail || '',
      governmentIdType: source.governmentIdType || '',
      governmentIdNumber: source.governmentIdNumber || '',
      dateOfBirth: dob && !Number.isNaN(dob.getTime()) ? dob.toISOString().slice(0, 10) : '',
      emergencyContact: {
        name: source.emergencyContact?.name || '',
        relation: source.emergencyContact?.relation || '',
        phone: source.emergencyContact?.phone || '',
      },
    })
  }, [user])

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))
  const updateAddressField = (field, value) => setForm((prev) => ({
    ...prev,
    address: { ...prev.address, [field]: value },
  }))
  const updateAdminField = (field, value) => setAdminForm((prev) => ({ ...prev, [field]: value }))
  const updateEmergencyContactField = (field, value) => setAdminForm((prev) => ({
    ...prev,
    emergencyContact: { ...prev.emergencyContact, [field]: value },
  }))

  const handleSave = async (event) => {
    event.preventDefault()
    if (!profile) {
      toast.error('Orphanage profile not loaded yet.')
      return
    }
    const payload = {
      name: form.name?.trim() || profile.name,
      orphanage_mail: form.orphanage_mail?.trim() || profile.orphanage_mail,
      orphanage_phone: form.orphanage_phone?.trim() || profile.orphanage_phone,
      address: {
        street: form.address.street?.trim() || '',
        city: form.address.city?.trim() || '',
        state: form.address.state?.trim() || '',
        pincode: form.address.pincode?.trim() || '',
      },
    }

    // Remove empty address keys to avoid overwriting with blanks
    if (payload.address) {
      const cleanAddress = Object.fromEntries(
        Object.entries(payload.address).filter(([, value]) => value && value.length)
      )
      if (Object.keys(cleanAddress).length) {
        payload.address = cleanAddress
      } else {
        delete payload.address
      }
    }

    setSaving(true)
    try {
      await adminOrphanageAPI.update(payload)
      toast.success('Orphanage profile updated')
      await refresh()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update orphanage'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const handleAdminProfileSave = async (event) => {
    event.preventDefault()
    if (!user) {
      toast.error('User context not available yet.')
      return
    }

    const payload = {}
    const trimmedPhone = adminForm.phone?.trim()
    if (trimmedPhone) {
      payload.phone = trimmedPhone
    }

    const adminProfilePayload = {
      designation: adminForm.designation?.trim() || undefined,
      gender: adminForm.gender || undefined,
      alternatePhone: adminForm.alternatePhone?.trim() || undefined,
      alternateEmail: adminForm.alternateEmail?.trim().toLowerCase() || undefined,
      governmentIdType: adminForm.governmentIdType ? adminForm.governmentIdType.toLowerCase() : undefined,
      governmentIdNumber: adminForm.governmentIdNumber?.trim().toUpperCase() || undefined,
      dateOfBirth: adminForm.dateOfBirth || undefined,
    }

    const emergencyContact = {
      name: adminForm.emergencyContact.name?.trim() || '',
      relation: adminForm.emergencyContact.relation?.trim() || '',
      phone: adminForm.emergencyContact.phone?.trim() || '',
    }
    if (emergencyContact.name || emergencyContact.relation || emergencyContact.phone) {
      adminProfilePayload.emergencyContact = {
        ...(emergencyContact.name ? { name: emergencyContact.name } : {}),
        ...(emergencyContact.relation ? { relation: emergencyContact.relation } : {}),
        ...(emergencyContact.phone ? { phone: emergencyContact.phone } : {}),
      }
    }

    Object.keys(adminProfilePayload).forEach((key) => {
      if (adminProfilePayload[key] === undefined || adminProfilePayload[key] === '') {
        delete adminProfilePayload[key]
      }
    })

    if (adminProfilePayload.emergencyContact && !Object.keys(adminProfilePayload.emergencyContact).length) {
      delete adminProfilePayload.emergencyContact
    }

    if (Object.keys(adminProfilePayload).length) {
      payload.adminProfile = adminProfilePayload
    }

    if (!payload.adminProfile && !payload.phone) {
      toast.error('Nothing to update for administrator profile')
      return
    }

    setAdminSaving(true)
    try {
      await authAPI.updateProfile(payload)
      toast.success('Administrator profile updated')
      await Promise.all([refresh(), checkAuth()])
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update administrator profile'
      toast.error(message)
    } finally {
      setAdminSaving(false)
    }
  }

  const handlePhotoUpload = async (file) => {
    if (!file) return
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append('profile', file)
      await authAPI.updateProfile(formData)
      toast.success('Profile photo updated')
      await Promise.all([refresh(), checkAuth()])
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update profile photo'
      toast.error(message)
    } finally {
      setPhotoUploading(false)
    }
  }

  const genderOptions = useMemo(() => ([
    { value: '', label: 'Select gender' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ]), [])

  const governmentIdOptions = useMemo(() => ([
    { value: '', label: 'Select ID type' },
    { value: 'aadhaar', label: 'Aadhaar' },
    { value: 'pan', label: 'PAN' },
    { value: 'passport', label: 'Passport' },
    { value: 'voterid', label: 'Voter ID' },
    { value: 'drivinglicense', label: 'Driving License' },
    { value: 'other', label: 'Other' },
  ]), [])

  const documentDefinitions = useMemo(() => ([
    { key: 'registrationCertificate', label: 'Registration certificate', field: 'registrationCertificate' },
    { key: 'governmentLicense', label: 'Government license', field: 'governmentLicense' },
    { key: 'financialAudit', label: 'Financial audit', field: 'otherDocuments', name: 'Financial Audit' },
  ]), [])

  const reservedOtherDocNames = useMemo(() => (
    documentDefinitions
      .filter((definition) => definition.field === 'otherDocuments' && definition.name)
      .map((definition) => definition.name.toLowerCase())
  ), [documentDefinitions])

  const customDocuments = (profile?.documents?.otherDocuments || []).filter((doc) => {
    if (!doc?.name) return true
    return !reservedOtherDocNames.includes(doc.name.toLowerCase())
  })

  const resolveDocumentEntry = (definition) => {
    if (!profile?.documents) return null
    if (definition.field === 'otherDocuments') {
      return profile.documents.otherDocuments?.find((doc) =>
        doc.name?.toLowerCase() === definition.name?.toLowerCase()
      ) || null
    }
    return profile.documents[definition.field] || null
  }

  const triggerUpload = (key) => {
    fileInputs.current[key]?.click()
  }

  const handleDocumentUpload = async (definition, event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingField(definition.key)
    try {
      await adminOrphanageAPI.uploadDocument(file, definition.field, definition.name)
      toast.success(`${definition.label} uploaded`)
      await refresh()
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to upload document'
      toast.error(message)
    } finally {
      setUploadingField(null)
    }
  }

  const startCustomUpload = () => {
    if (!newDocName.trim()) {
      toast.error('Name the document before uploading')
      return
    }
    fileInputs.current.custom?.click()
  }

  const handleCustomDocUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!newDocName.trim()) {
      toast.error('Document name is required')
      return
    }
    setUploadingField('custom')
    const label = newDocName.trim()
    try {
      await adminOrphanageAPI.uploadDocument(file, 'otherDocuments', label)
      toast.success(`${label} uploaded`)
      setNewDocName('')
      await refresh()
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to upload document'
      toast.error(message)
    } finally {
      setUploadingField(null)
    }
  }

  return (
    <div className="space-y-8">
      <ScrollReveal animation="fade-up">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Settings</p>
        <h2 className="text-3xl font-semibold text-white">Orphanage control center</h2>
        <p className="text-sm text-slate-400">Update legal information, upload compliance documents, and manage secure access.</p>
      </header>
      </ScrollReveal>

      {user?.role === 'orphanAdmin' && (
        <ScrollReveal animation="fade-up" delay={100}>
        <AdministratorIdentityCard
          user={user}
          adminProfile={adminProfile}
          variant="settings"
          onEditClick={() => adminFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          onPhotoSelected={handlePhotoUpload}
          uploadingPhoto={photoUploading}
        />
        </ScrollReveal>
      )}

      {user?.role === 'orphanAdmin' && (
        <ScrollReveal animation="fade-up" delay={200}>
        <section ref={adminFormRef} className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Administrator</p>
              <h3 className="text-xl font-semibold text-white">Personal & verification details</h3>
              <p className="text-sm text-slate-400">Keep your identity, government ID and emergency contact information current.</p>
            </div>
            <span className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              {user?.status || 'pending'}
            </span>
          </div>
          <form className="mt-6 grid gap-6" onSubmit={handleAdminProfileSave}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Designation</label>
                <input
                  value={adminForm.designation}
                  onChange={(event) => updateAdminField('designation', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Founder & Director"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Gender</label>
                <select
                  value={adminForm.gender}
                  onChange={(event) => updateAdminField('gender', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Primary phone</label>
                <input
                  value={adminForm.phone}
                  onChange={(event) => updateAdminField('phone', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Administrator email</label>
                <input
                  value={user?.email || ''}
                  readOnly
                  className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-400"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Alternate phone</label>
                <input
                  value={adminForm.alternatePhone}
                  onChange={(event) => updateAdminField('alternatePhone', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="+91 91234 56780"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Alternate email</label>
                <input
                  type="email"
                  value={adminForm.alternateEmail}
                  onChange={(event) => updateAdminField('alternateEmail', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="director.alt@example.org"
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Date of birth</label>
                <input
                  type="date"
                  value={adminForm.dateOfBirth}
                  onChange={(event) => updateAdminField('dateOfBirth', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Government ID type</label>
                <select
                  value={adminForm.governmentIdType}
                  onChange={(event) => updateAdminField('governmentIdType', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
                >
                  {governmentIdOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Government ID number</label>
              <input
                value={adminForm.governmentIdNumber}
                onChange={(event) => updateAdminField('governmentIdNumber', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="230123231414"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Emergency contact name</label>
                <input
                  value={adminForm.emergencyContact.name}
                  onChange={(event) => updateEmergencyContactField('name', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Rahul Sharma"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-400">Emergency contact relation</label>
                <input
                  value={adminForm.emergencyContact.relation}
                  onChange={(event) => updateEmergencyContactField('relation', event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Brother"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-400">Emergency contact phone</label>
              <input
                value={adminForm.emergencyContact.phone}
                onChange={(event) => updateEmergencyContactField('phone', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="+91 90123 45678"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={adminSaving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {adminSaving ? 'Saving…' : (
                  <>
                    <FaSave /> Save administrator profile
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
        </ScrollReveal>
      )}

      <ScrollReveal animation="fade-up" delay={300}>
      <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <h3 className="text-xl font-semibold text-white">Profile information</h3>
        <form className="mt-6 grid gap-6" onSubmit={handleSave}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Orphanage name</label>
              <input
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Hope Children Center"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Registration number</label>
              <input
                value={form.registrationNumber}
                readOnly
                className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-400"
              />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Contact email</label>
              <input
                type="email"
                value={form.orphanage_mail}
                onChange={(e) => updateField('orphanage_mail', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="operations@soulconnect.org"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Contact phone</label>
              <input
                value={form.orphanage_phone}
                onChange={(e) => updateField('orphanage_phone', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Street</label>
              <input
                value={form.address.street}
                onChange={(e) => updateAddressField('street', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="12 Compassion Lane"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">City</label>
              <input
                value={form.address.city}
                onChange={(e) => updateAddressField('city', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Bengaluru"
              />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">State</label>
              <input
                value={form.address.state}
                onChange={(e) => updateAddressField('state', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="Karnataka"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Pincode</label>
              <input
                value={form.address.pincode}
                onChange={(e) => updateAddressField('pincode', e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                placeholder="560001"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving…' : <><FaSave /> Save changes</>}
            </button>
          </div>
        </form>
      </section>
      </ScrollReveal>

      <ScrollReveal animation="fade-up" delay={400}>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaUpload className="text-3xl text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Compliance docs</p>
              <h3 className="text-xl font-semibold text-white">Document vault</h3>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {documentDefinitions.map((definition) => {
              const entry = resolveDocumentEntry(definition)
              const uploaded = Boolean(entry?.url)
              return (
                <div key={definition.key} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
                  <div className="flex items-center justify-between">
                    <span>{definition.label}</span>
                    <span className={`text-xs ${uploaded ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {uploaded ? 'Uploaded' : 'Missing'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    {uploaded ? (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200"
                      >
                        View document
                      </a>
                    ) : (
                      <span>Pending upload</span>
                    )}
                    <div>
                      <button
                        type="button"
                        onClick={() => triggerUpload(definition.key)}
                        disabled={uploadingField === definition.key}
                        className="text-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {uploadingField === definition.key ? 'Uploading…' : 'Upload'}
                      </button>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        ref={(el) => { fileInputs.current[definition.key] = el }}
                        onChange={(event) => handleDocumentUpload(definition, event)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Supporting docs</p>
              <h4 className="mt-2 text-base font-semibold text-white">Additional uploads</h4>
              {customDocuments.length ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {customDocuments.map((doc) => (
                    <li key={doc.fileId || doc.url} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2">
                      <span className="truncate pr-4">{doc.name || 'Unnamed document'}</span>
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cyan-300 hover:text-cyan-100"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Missing URL</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No additional documents uploaded yet.</p>
              )}
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={newDocName}
                  onChange={(event) => setNewDocName(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Document name (e.g., Tax Exemption 80G)"
                />
                <button
                  type="button"
                  onClick={startCustomUpload}
                  disabled={uploadingField === 'custom'}
                  className="inline-flex items-center justify-center rounded-2xl border border-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingField === 'custom' ? 'Uploading…' : 'Upload file'}
                </button>
              </div>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                ref={(el) => { fileInputs.current.custom = el }}
                onChange={handleCustomDocUpload}
              />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-3xl text-emerald-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Security</p>
              <h3 className="text-xl font-semibold text-white">Access policies</h3>
            </div>
          </div>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
            <li>Rotate admin passwords every 90 days.</li>
            <li>Enable 2FA for all finance-facing accounts.</li>
            <li>Keep orphanage status and verification proof updated.</li>
          </ul>
        </div>
      </section>
      </ScrollReveal>
    </div>
  )
}

export default SettingsPanel
