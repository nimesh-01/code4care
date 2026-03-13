import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FaArrowLeft, FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope,
  FaIdCard, FaUser, FaFileAlt, FaExternalLinkAlt, FaCheckCircle,
  FaTimesCircle, FaBan, FaClock, FaCalendarAlt, FaGlobe, FaUsers,
} from 'react-icons/fa'
import { MdPendingActions } from 'react-icons/md'
import { superAdminAPI, childrenAPI } from '../../../services/api'

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300', label: 'Pending', icon: MdPendingActions },
  approved: { color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300', label: 'Approved', icon: FaCheckCircle },
  rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', label: 'Rejected', icon: FaTimesCircle },
  blocked: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300', label: 'Blocked', icon: FaBan },
}

const SAOrphanageDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [orphanage, setOrphanage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verifyNote, setVerifyNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [childCount, setChildCount] = useState(null)

  useEffect(() => {
    fetchOrphanage()
  }, [id])

  useEffect(() => {
    if (!id) return
    let ignore = false
    const fetchChildrenCount = async () => {
      try {
        const res = await childrenAPI.getByOrphanage(id)
        if (ignore) return
        const payload = res.data?.children ?? res.data?.data ?? res.data
        if (Array.isArray(payload)) {
          setChildCount(payload.length)
        } else if (payload && typeof payload.count === 'number') {
          setChildCount(payload.count)
        }
      } catch (err) {
        console.error('Failed to load children count:', err)
      }
    }
    fetchChildrenCount()
    return () => { ignore = true }
  }, [id])

  const fetchOrphanage = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await superAdminAPI.getOrphanageById(id)
      if (res.data?.orphanage) {
        setOrphanage(res.data.orphanage)
        setChildCount(res.data.orphanage.totalChildren ?? null)
      } else {
        setError('Orphanage data not found')
      }
    } catch (err) {
      console.error('Failed to fetch orphanage:', err)
      setError(err.response?.data?.message || 'Failed to load orphanage details')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (status) => {
    if ((status === 'rejected' || status === 'blocked') && !verifyNote.trim()) return
    try {
      setActionLoading(true)
      await superAdminAPI.verifyOrphanage(id, { status, verificationNote: verifyNote })
      setVerifyNote('')
      fetchOrphanage()
    } catch (err) {
      console.error('Verification failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-coral-500" />
      </div>
    )
  }

  if (error || !orphanage) {
    return (
      <div className="text-center py-20 space-y-4">
        <FaBuilding className="text-5xl text-teal-300 dark:text-dark-600 mx-auto" />
        <p className="text-teal-600 dark:text-cream-400">{error || 'Orphanage not found'}</p>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline normal-case text-sm"
        >
          Go Back
        </button>
      </div>
    )
  }

  const admin = typeof orphanage.orphanAdmin === 'object' ? orphanage.orphanAdmin : null
  const verifier = typeof orphanage.verifiedBy === 'object' ? orphanage.verifiedBy : null
  const docs = orphanage.documents || {}
  const otherDocs = Array.isArray(docs.otherDocuments) ? docs.otherDocuments : []
  const statusInfo = statusConfig[orphanage.status] || statusConfig.pending
  const StatusIcon = statusInfo.icon
  const galleryImages = Array.isArray(orphanage.gallery) ? orphanage.gallery.filter((img) => img?.url) : []
  const coverImage = orphanage.coverImage?.url
  const totalChildrenVisible = childCount ?? orphanage.totalChildren ?? null

  const formatDate = (d) => {
    try {
      const date = new Date(d)
      if (isNaN(date.getTime())) return 'N/A'
      return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch { return 'N/A' }
  }

  return (
    <div className="space-y-6">
      {/* Back button & header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-link btn-compact normal-case"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair truncate">
            {orphanage.name}
          </h2>
          <p className="text-sm text-teal-500 dark:text-cream-400">Reg: {orphanage.registrationNumber}</p>
        </div>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color}`}>
          <StatusIcon className="text-sm" />
          {statusInfo.label}
        </span>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orphanage Info */}
        <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair flex items-center gap-2">
            <FaBuilding className="text-coral-500" /> Orphanage Information
          </h3>

          <div className="space-y-4">
            <InfoRow icon={FaBuilding} label="Name" value={orphanage.name} />
            <InfoRow icon={FaIdCard} label="Registration Number" value={orphanage.registrationNumber} />
            <InfoRow icon={FaEnvelope} label="Email" value={orphanage.orphanage_mail} />
            <InfoRow icon={FaPhone} label="Phone" value={orphanage.orphanage_phone} />
            {orphanage.website && (
              <InfoRow
                icon={FaGlobe}
                label="Website"
                value={
                  <a href={orphanage.website} target="_blank" rel="noreferrer" className="text-coral-500 hover:underline">
                    {orphanage.website}
                  </a>
                }
              />
            )}
            <InfoRow
              icon={FaMapMarkerAlt}
              label="Address"
              value={[
                orphanage.address?.street,
                orphanage.address?.city,
                orphanage.address?.state,
                orphanage.address?.pincode,
                orphanage.address?.country,
              ].filter(Boolean).join(', ')}
            />
            <InfoRow icon={FaCalendarAlt} label="Registered On" value={formatDate(orphanage.createdAt)} />
            {orphanage.approvedAt && (
              <InfoRow icon={FaCheckCircle} label="Approved On" value={formatDate(orphanage.approvedAt)} />
            )}
            {verifier && (
              <InfoRow icon={FaUser} label="Verified By" value={`${verifier.fullname?.firstname || ''} ${verifier.fullname?.lastname || ''}`.trim() || verifier.email} />
            )}
            {orphanage.verificationNote && (
              <div>
                <span className="text-xs font-medium text-teal-500 dark:text-cream-400">Verification Note</span>
                <p className="mt-1 text-sm text-teal-800 dark:text-cream-100 bg-cream-50 dark:bg-dark-700 rounded-lg p-3">
                  {orphanage.verificationNote}
                </p>
              </div>
            )}
            {orphanage.description && (
              <div>
                <span className="text-xs font-medium text-teal-500 dark:text-cream-400">About</span>
                <p className="mt-1 text-sm text-teal-800 dark:text-cream-100 bg-cream-50 dark:bg-dark-700 rounded-lg p-3">
                  {orphanage.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Info */}
        <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair flex items-center gap-2">
            <FaUser className="text-coral-500" /> Admin Information
          </h3>

          {admin ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {admin.profileUrl ? (
                  <img src={admin.profileUrl} alt="Admin" className="w-16 h-16 rounded-full object-cover border-2 border-coral-200 dark:border-dark-600" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-coral-100 dark:bg-coral-500/20 flex items-center justify-center text-coral-500 text-xl font-bold">
                    {admin.fullname?.firstname?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-teal-900 dark:text-cream-50">
                    {admin.fullname?.firstname} {admin.fullname?.lastname}
                  </p>
                  <p className="text-xs text-teal-500 dark:text-cream-400">@{admin.username}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    admin.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' :
                    admin.status === 'blocked' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                  }`}>
                    {admin.status}
                  </span>
                </div>
              </div>

              <InfoRow icon={FaEnvelope} label="Email" value={admin.email} />
              <InfoRow icon={FaPhone} label="Phone" value={admin.phone} />
              {admin.adminProfile?.governmentId && (
                <InfoRow icon={FaIdCard} label="Government ID" value={admin.adminProfile.governmentId} />
              )}
              {admin.adminProfile?.emergencyContact && (
                <InfoRow icon={FaPhone} label="Emergency Contact" value={
                  typeof admin.adminProfile.emergencyContact === 'object'
                    ? [admin.adminProfile.emergencyContact.name, admin.adminProfile.emergencyContact.relation, admin.adminProfile.emergencyContact.phone].filter(Boolean).join(' — ')
                    : admin.adminProfile.emergencyContact
                } />
              )}
              <InfoRow icon={FaCalendarAlt} label="Joined" value={formatDate(admin.createdAt)} />
            </div>
          ) : (
            <p className="text-sm text-teal-400 dark:text-cream-400/60">No admin information available</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 space-y-5">
          <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair">Impact Snapshot</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={FaUsers} label="Total Children" value={totalChildrenVisible ?? '—'} accent="bg-sky-100 dark:bg-sky-500/10" />
            <StatCard icon={FaCalendarAlt} label="Created" value={formatDate(orphanage.createdAt)} accent="bg-emerald-100 dark:bg-emerald-500/10" />
            <StatCard icon={FaClock} label="Last Review" value={formatDate(orphanage.approvedAt || orphanage.updatedAt || orphanage.createdAt)} accent="bg-amber-100 dark:bg-amber-500/10" />
            <StatCard icon={StatusIcon} label="Status" value={statusInfo.label} accent="bg-coral-100 dark:bg-coral-500/10" />
          </div>
        </div>

        {(coverImage || galleryImages.length) ? (
          <div className="xl:col-span-2 rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair">Visual Gallery</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {coverImage && (
                <figure className="relative overflow-hidden rounded-2xl border border-cream-200 dark:border-dark-600">
                  <img src={coverImage} alt="Cover" className="w-full h-48 object-cover" />
                  <figcaption className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">Cover Image</figcaption>
                </figure>
              )}
              {galleryImages.map((img, idx) => (
                <figure key={img.fileId || img.url || idx} className="relative overflow-hidden rounded-2xl border border-cream-200 dark:border-dark-600">
                  <img src={img.url} alt={img.caption || `Gallery ${idx + 1}`} className="w-full h-48 object-cover" />
                  {img.caption && (
                    <figcaption className="absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="xl:col-span-2 rounded-2xl border border-dashed border-cream-300 dark:border-dark-600 bg-white dark:bg-dark-800 p-6 flex items-center justify-center text-sm text-teal-400 dark:text-cream-400/70">
            No gallery images uploaded yet.
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair flex items-center gap-2">
          <FaFileAlt className="text-coral-500" /> Documents
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DocumentCard
            label="Registration Certificate"
            url={docs.registrationCertificate?.url}
          />
          <DocumentCard
            label="Government License"
            url={docs.governmentLicense?.url}
          />
          {otherDocs.map((doc, idx) => (
            <DocumentCard key={idx} label={doc.name || `Document ${idx + 1}`} url={doc.url} />
          ))}
        </div>

        {!docs.registrationCertificate?.url && !docs.governmentLicense?.url && otherDocs.length === 0 && (
          <p className="text-sm text-teal-400 dark:text-cream-400/60 text-center py-4">No documents uploaded</p>
        )}
      </div>

      {/* Verification Actions */}
      <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 space-y-5">
        <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 font-playfair">
          Verification Actions
        </h3>

        <textarea
          value={verifyNote}
          onChange={(e) => setVerifyNote(e.target.value)}
          placeholder="Add a note (required for reject/block)..."
          rows={3}
          className="input-field resize-none"
        />

        <div className="flex flex-wrap gap-3">
          {orphanage.status !== 'approved' && (
            <button
              onClick={() => handleVerify('approved')}
              disabled={actionLoading}
              className="btn btn-success normal-case"
            >
              <FaCheckCircle /> Approve
            </button>
          )}
          {orphanage.status !== 'rejected' && (
            <button
              onClick={() => handleVerify('rejected')}
              disabled={actionLoading || !verifyNote.trim()}
              className="btn btn-danger normal-case"
            >
              <FaTimesCircle /> Reject
            </button>
          )}
          {orphanage.status !== 'blocked' && (
            <button
              onClick={() => handleVerify('blocked')}
              disabled={actionLoading || !verifyNote.trim()}
              className="btn btn-warning normal-case"
            >
              <FaBan /> Block
            </button>
          )}
        </div>

        {(orphanage.status === 'rejected' || orphanage.status === 'blocked') && !verifyNote.trim() && (
          <p className="text-xs text-red-400">* A note is required to reject or block an orphanage</p>
        )}
      </div>
    </div>
  )
}

const InfoRow = ({ icon: Icon, label, value }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-teal-400 dark:text-cream-400/60 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <span className="block text-[11px] font-medium text-teal-400 dark:text-cream-400/60 uppercase tracking-wider">{label}</span>
        <span className="block text-sm text-teal-800 dark:text-cream-100 break-words">{value}</span>
      </div>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, accent = 'bg-cream-100 dark:bg-dark-700/40' }) => (
  <div className={`rounded-2xl border border-cream-200 dark:border-dark-600 p-4 flex items-start gap-3 ${accent}`}>
    <Icon className="text-teal-500 text-lg" />
    <div>
      <p className="text-[11px] uppercase tracking-widest text-teal-400 dark:text-cream-400/60">{label}</p>
      <p className="text-lg font-semibold text-teal-900 dark:text-cream-50">{value}</p>
    </div>
  </div>
)

const DocumentCard = ({ label, url }) => (
  <div className="rounded-xl border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 p-4 flex items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <FaFileAlt className="text-teal-400 dark:text-cream-400/60 shrink-0" />
      <span className="text-sm text-teal-800 dark:text-cream-100 truncate">{label}</span>
    </div>
    {url ? (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 flex items-center gap-1 text-xs text-coral-500 hover:text-coral-600 font-medium transition"
      >
        View <FaExternalLinkAlt className="text-[10px]" />
      </a>
    ) : (
      <span className="text-[10px] text-teal-400 dark:text-cream-400/50 shrink-0">Not uploaded</span>
    )}
  </div>
)

export default SAOrphanageDetail
