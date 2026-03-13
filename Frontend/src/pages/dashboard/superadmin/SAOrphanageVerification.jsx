import { useState, useEffect, useCallback } from 'react'
import {
  FaCheckCircle, FaTimesCircle, FaBan, FaEye, FaFileAlt,
  FaSearch, FaChevronLeft, FaExternalLinkAlt, FaUser,
  FaMapMarkerAlt, FaPhone, FaEnvelope, FaIdCard,
} from 'react-icons/fa'
import { MdPendingActions } from 'react-icons/md'
import { superAdminAPI } from '../../../services/api'

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300', label: 'Pending' },
  approved: { color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300', label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', label: 'Rejected' },
  blocked: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300', label: 'Blocked' },
}

const SAOrphanageVerification = () => {
  const [orphanages, setOrphanages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrphanage, setSelectedOrphanage] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [verifyNote, setVerifyNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState('pending')

  const fetchOrphanages = useCallback(async () => {
    try {
      setLoading(true)
      const params = { status: filter, page, limit: 10 }
      if (search) params.search = search
      const res = await superAdminAPI.getOrphanages(params)
      setOrphanages(res.data.orphanages || [])
      setTotalPages(res.data.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch orphanages:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, page, search])

  useEffect(() => {
    fetchOrphanages()
  }, [fetchOrphanages])

  const viewDetails = async (id) => {
    try {
      setDetailLoading(true)
      const res = await superAdminAPI.getOrphanageById(id)
      setSelectedOrphanage(res.data.orphanage)
    } catch (err) {
      console.error('Failed to fetch details:', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleVerify = async (status) => {
    if (!selectedOrphanage) return
    try {
      setActionLoading(true)
      await superAdminAPI.verifyOrphanage(selectedOrphanage._id, {
        status,
        verificationNote: verifyNote,
      })
      setSelectedOrphanage(null)
      setVerifyNote('')
      fetchOrphanages()
    } catch (err) {
      console.error('Verification failed:', err)
    } finally {
      setActionLoading(false)
    }
  }

  // Detail view
  if (selectedOrphanage) {
    const org = selectedOrphanage
    const admin = org.orphanAdmin
    const docs = org.documents || {}

    return (
      <div className="space-y-6">
        <button
          onClick={() => { setSelectedOrphanage(null); setVerifyNote('') }}
          className="btn btn-link normal-case"
        >
          <FaChevronLeft /> Back to list
        </button>

        <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-coral-400 to-teal-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold font-playfair">{org.name}</h2>
                <p className="text-white/80 text-sm mt-1">Reg. No: {org.registrationNumber}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[org.status]?.color}`}>
                {statusConfig[org.status]?.label}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Orphanage Info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">
                  Orphanage Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-cream-200">
                    <FaEnvelope className="text-teal-400" />
                    <span>{org.orphanage_mail}</span>
                  </div>
                  <div className="flex items-center gap-2 text-teal-700 dark:text-cream-200">
                    <FaPhone className="text-teal-400" />
                    <span>{org.orphanage_phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-teal-700 dark:text-cream-200">
                    <FaMapMarkerAlt className="text-teal-400 mt-0.5" />
                    <span>
                      {[org.address?.street, org.address?.city, org.address?.state, org.address?.pincode].filter(Boolean).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Info */}
              {admin && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">
                    Admin Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      {admin.profileUrl ? (
                        <img src={admin.profileUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-dark-600 flex items-center justify-center">
                          <FaUser className="text-teal-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-teal-900 dark:text-cream-50">
                          {admin.fullname?.firstname} {admin.fullname?.lastname}
                        </p>
                        <p className="text-xs text-teal-500 dark:text-cream-400">{admin.email}</p>
                      </div>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2 text-teal-700 dark:text-cream-200">
                        <FaPhone className="text-teal-400" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                    {admin.adminProfile && (
                      <>
                        {admin.adminProfile.designation && (
                          <p className="text-teal-700 dark:text-cream-200">
                            <span className="text-teal-500">Designation:</span> {admin.adminProfile.designation}
                          </p>
                        )}
                        {admin.adminProfile.governmentIdType && (
                          <div className="flex items-center gap-2 text-teal-700 dark:text-cream-200">
                            <FaIdCard className="text-teal-400" />
                            <span className="uppercase">{admin.adminProfile.governmentIdType}: {admin.adminProfile.governmentIdNumber}</span>
                          </div>
                        )}
                        {admin.adminProfile.emergencyContact?.name && (
                          <p className="text-teal-700 dark:text-cream-200">
                            <span className="text-teal-500">Emergency:</span> {admin.adminProfile.emergencyContact.name} ({admin.adminProfile.emergencyContact.phone})
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">
                Documents
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {docs.registrationCertificate?.url && (
                  <a
                    href={docs.registrationCertificate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 p-4 hover:shadow-md transition group"
                  >
                    <FaFileAlt className="text-teal-500 text-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-teal-900 dark:text-cream-50 truncate">Registration Certificate</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400">Click to view</p>
                    </div>
                    <FaExternalLinkAlt className="text-xs text-teal-400 group-hover:text-coral-500 transition" />
                  </a>
                )}
                {docs.governmentLicense?.url && (
                  <a
                    href={docs.governmentLicense.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 p-4 hover:shadow-md transition group"
                  >
                    <FaFileAlt className="text-teal-500 text-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-teal-900 dark:text-cream-50 truncate">Government License</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400">Click to view</p>
                    </div>
                    <FaExternalLinkAlt className="text-xs text-teal-400 group-hover:text-coral-500 transition" />
                  </a>
                )}
                {admin?.adminProfile?.governmentIdDocument?.url && (
                  <a
                    href={admin.adminProfile.governmentIdDocument.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 p-4 hover:shadow-md transition group"
                  >
                    <FaIdCard className="text-teal-500 text-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-teal-900 dark:text-cream-50 truncate">Admin ID Document</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400">Click to view</p>
                    </div>
                    <FaExternalLinkAlt className="text-xs text-teal-400 group-hover:text-coral-500 transition" />
                  </a>
                )}
                {docs.otherDocuments?.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700 p-4 hover:shadow-md transition group"
                  >
                    <FaFileAlt className="text-teal-500 text-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-teal-900 dark:text-cream-50 truncate">{doc.name || `Document ${i + 1}`}</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400">Click to view</p>
                    </div>
                    <FaExternalLinkAlt className="text-xs text-teal-400 group-hover:text-coral-500 transition" />
                  </a>
                ))}
                {!docs.registrationCertificate?.url && !docs.governmentLicense?.url && !(docs.otherDocuments?.length > 0) && (
                  <p className="text-sm text-teal-500 dark:text-cream-400 col-span-full">No documents uploaded</p>
                )}
              </div>
            </div>

            {/* Verification Note */}
            {org.verificationNote && (
              <div className="rounded-xl bg-cream-50 dark:bg-dark-700 border border-cream-200 dark:border-dark-600 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300 mb-1">
                  Previous Verification Note
                </p>
                <p className="text-sm text-teal-700 dark:text-cream-200">{org.verificationNote}</p>
              </div>
            )}

            {/* Action Section */}
            <div className="border-t border-cream-200 dark:border-dark-700 pt-6 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">
                Take Action
              </h3>
              <textarea
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="Add a verification note (required for rejection/blocking)..."
                className="input-field h-24 resize-none"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleVerify('approved')}
                  disabled={actionLoading}
                  className="btn btn-success normal-case"
                >
                  <FaCheckCircle /> Approve
                </button>
                <button
                  onClick={() => handleVerify('rejected')}
                  disabled={actionLoading || !verifyNote.trim()}
                  className="btn btn-danger normal-case"
                >
                  <FaTimesCircle /> Reject
                </button>
                <button
                  onClick={() => handleVerify('blocked')}
                  disabled={actionLoading || !verifyNote.trim()}
                  className="btn btn-warning normal-case"
                >
                  <FaBan /> Block
                </button>
              </div>
              {!verifyNote.trim() && (
                <p className="text-xs text-teal-400 dark:text-cream-400">* A note is required to reject or block an orphanage</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Orphanage Verification</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">Review and verify orphanage registrations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['pending', 'approved', 'rejected', 'blocked'].map((s) => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1) }}
              className={`btn btn-compact normal-case ${filter === s ? 'btn-warning' : 'btn-ghost'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, registration number, city..."
          className="input-field pl-11"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
        </div>
      ) : orphanages.length === 0 ? (
        <div className="text-center py-16">
          <MdPendingActions className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
          <p className="text-teal-600 dark:text-cream-400">No {filter} orphanages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orphanages.map((org) => (
            <div
              key={org._id}
              className="rounded-xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-teal-900 dark:text-cream-50 truncate">{org.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig[org.status]?.color}`}>
                    {statusConfig[org.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-teal-500 dark:text-cream-400 mt-1">
                  {org.registrationNumber} &bull; {org.address?.city}, {org.address?.state}
                </p>
                {org.orphanAdmin && (
                  <p className="text-xs text-teal-400 dark:text-cream-400 mt-0.5">
                    Admin: {org.orphanAdmin.fullname?.firstname} {org.orphanAdmin.fullname?.lastname} ({org.orphanAdmin.email})
                  </p>
                )}
                <p className="text-xs text-teal-400 dark:text-cream-400/70 mt-0.5">
                  Registered: {new Date(org.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => viewDetails(org._id)}
                className="btn btn-outline normal-case whitespace-nowrap"
              >
                <FaEye /> Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="btn btn-neutral btn-compact normal-case"
          >
            Previous
          </button>
          <span className="text-sm text-teal-600 dark:text-cream-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn btn-neutral btn-compact normal-case"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default SAOrphanageVerification
