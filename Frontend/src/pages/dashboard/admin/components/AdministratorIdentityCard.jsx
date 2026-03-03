import { useMemo, useRef } from 'react'
import { FaUserShield, FaIdCard } from 'react-icons/fa'
import { HiOutlineCamera } from 'react-icons/hi'

const formatDate = (value) => {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusStyles = {
  active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30',
  pending: 'bg-amber-500/15 text-amber-200 border border-amber-400/30',
  rejected: 'bg-rose-500/15 text-rose-200 border border-rose-400/30',
  blocked: 'bg-rose-500/25 text-rose-100 border border-rose-400/40',
}

const GOVERNMENT_ID_LABELS = {
  aadhaar: 'Aadhaar',
  pan: 'PAN',
  passport: 'Passport',
  voterid: 'Voter ID',
  drivinglicense: 'Driving License',
  other: 'Other',
}

const toTitleCase = (value) => {
  if (!value) return ''
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const resolveGovernmentIdLabel = (value) => {
  if (!value) return 'Not provided'
  return GOVERNMENT_ID_LABELS[value.toLowerCase()] || toTitleCase(value)
}

const AdministratorIdentityCard = ({
  user,
  adminProfile,
  variant = 'overview',
  onEditClick,
  onPhotoSelected,
  uploadingPhoto = false,
}) => {
  if (!user || !adminProfile) return null

  const fileInputRef = useRef(null)
  const fullName = useMemo(() => {
    const first = user?.fullname?.firstname || ''
    const last = user?.fullname?.lastname || ''
    const combined = `${first} ${last}`.trim()
    return combined || user?.username || 'Administrator'
  }, [user])

  const initials = useMemo(() => {
    if (!fullName) return 'A'
    const parts = fullName.split(' ').filter(Boolean)
    if (!parts.length) return fullName.charAt(0).toUpperCase()
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
  }, [fullName])

  const statusTone = (user?.status || 'pending').toLowerCase()
  const badgeClass = statusStyles[statusTone] || statusStyles.pending

  const handlePhotoTrigger = () => {
    if (onPhotoSelected) fileInputRef.current?.click()
  }

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file && onPhotoSelected) {
      onPhotoSelected(file)
    }
  }

  return (
    <section className={`rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-white shadow-2xl shadow-black/30 ${variant === 'settings' ? 'ring-1 ring-white/5' : ''}`}>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex flex-col items-center">
            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-800 ring-2 ring-white/30">
              {user?.profileUrl ? (
                <img src={user.profileUrl} alt={`${fullName} profile`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-coral-300">
                  {initials}
                </div>
              )}
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">Profile photo</p>
            {onPhotoSelected && (
              <>
                <button
                  type="button"
                  onClick={handlePhotoTrigger}
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white hover:border-cyan-300"
                  disabled={uploadingPhoto}
                >
                  <HiOutlineCamera className="text-base" />
                  {uploadingPhoto ? 'Uploading…' : 'Change photo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Administrator identity</p>
            <h3 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
              <FaUserShield className="text-coral-300" />
              {fullName}
            </h3>
            <p className="text-sm text-slate-300">{adminProfile.designation || 'Designation not specified'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold ${badgeClass}`}>
            {(user?.status || 'pending').toUpperCase()}
          </span>
          {onEditClick && (
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 px-4 py-2 text-xs font-semibold text-cyan-200 hover:border-cyan-200"
            >
              Edit details
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <FaIdCard /> Primary details
          </p>
          <dl className="space-y-2 text-slate-200">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Contact phone</dt>
              <dd>{user?.phone || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Alternate phone</dt>
              <dd>{adminProfile.alternatePhone || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Primary email</dt>
              <dd className="truncate text-right">{user?.email || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Alternate email</dt>
              <dd className="truncate text-right">{adminProfile.alternateEmail || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Gender</dt>
              <dd className="capitalize">{toTitleCase(adminProfile.gender) || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Date of birth</dt>
              <dd>{formatDate(adminProfile.dateOfBirth)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <FaIdCard /> Verification & emergency
          </p>
          <dl className="space-y-2 text-slate-200">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Govt. ID</dt>
              <dd className="capitalize">{resolveGovernmentIdLabel(adminProfile.governmentIdType)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">ID number</dt>
              <dd className="font-mono text-xs">{adminProfile.governmentIdNumber || 'Not provided'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">ID proof file</dt>
              <dd>
                {adminProfile.governmentIdDocument?.url ? (
                  <a
                    href={adminProfile.governmentIdDocument.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 hover:text-cyan-100"
                  >
                    View document
                  </a>
                ) : (
                  'Pending upload'
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-400">Emergency contact</dt>
              <dd className="text-right">
                <p className="font-semibold">{adminProfile.emergencyContact?.name || 'Not provided'}</p>
                <p className="text-xs text-slate-400">{adminProfile.emergencyContact?.relation || 'Relation N/A'}</p>
                <p>{adminProfile.emergencyContact?.phone || 'Phone N/A'}</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

export default AdministratorIdentityCard
