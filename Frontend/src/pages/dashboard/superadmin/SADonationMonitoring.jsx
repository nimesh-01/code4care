import { useState, useEffect, useCallback } from 'react'
import { FaDonate, FaSearch, FaBuilding, FaUser, FaDownload, FaReceipt } from 'react-icons/fa'
import { donationAPI, superAdminAPI } from '../../../services/api'

const SADonationMonitoring = () => {
  const [orphanages, setOrphanages] = useState([])
  const [selectedOrphanage, setSelectedOrphanage] = useState(null)
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [donationLoading, setDonationLoading] = useState(false)
  const [donationError, setDonationError] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchOrphanages = useCallback(async () => {
    try {
      setLoading(true)
      const params = { status: 'approved', limit: 100 }
      if (search) params.search = search
      const res = await superAdminAPI.getOrphanages(params)
      setOrphanages(res.data.orphanages || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { fetchOrphanages() }, [fetchOrphanages])

  const fetchDonations = useCallback(async (orphanageId) => {
    try {
      setDonationLoading(true)
      setDonationError(null)
      const res = await donationAPI.getOrphanageDonations(orphanageId, { page, limit: 15 })
      const d = res.data || {}
      const list = d.donations || d.data || []
      setDonations(Array.isArray(list) ? list : [])
      setTotalPages(d.pagination?.totalPages || d.totalPages || 1)
    } catch (err) {
      console.error('Failed to fetch donations:', err)
      setDonations([])
      setDonationError(err.response?.data?.message || 'Failed to load donations')
    } finally {
      setDonationLoading(false)
    }
  }, [page])

  const handleSelectOrphanage = (org) => {
    setSelectedOrphanage(org)
    setPage(1)
    fetchDonations(org._id)
  }

  useEffect(() => {
    if (selectedOrphanage) fetchDonations(selectedOrphanage._id)
  }, [page, selectedOrphanage, fetchDonations])

  const statusColors = {
    success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10',
    pending: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10',
    failed: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
    refunded: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Donation Monitoring</h2>
        <p className="text-sm text-teal-600 dark:text-cream-400">Track donation activity across all orphanages</p>
      </div>

      {!selectedOrphanage ? (
        <>
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search approved orphanages..."
              className="input-field pl-11"
            />
          </div>

          {/* Orphanage List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
            </div>
          ) : orphanages.length === 0 ? (
            <div className="text-center py-16">
              <FaBuilding className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
              <p className="text-teal-600 dark:text-cream-400">No approved orphanages found</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {orphanages.map((org) => (
                <button
                  key={org._id}
                  onClick={() => handleSelectOrphanage(org)}
                  className="text-left rounded-xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4 hover:shadow-md hover:border-coral-300 dark:hover:border-coral-500/40 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-500/10">
                      <FaBuilding className="text-teal-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-teal-900 dark:text-cream-50 truncate">{org.name}</p>
                      <p className="text-xs text-teal-500 dark:text-cream-400">{org.address?.city}, {org.address?.state}</p>
                    </div>
                    <FaDonate className="text-coral-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Back + Orphanage header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setSelectedOrphanage(null); setDonations([]) }}
              className="text-sm text-teal-600 dark:text-cream-300 hover:text-coral-500 transition"
            >
              &larr; Back
            </button>
            <div>
              <h3 className="font-semibold text-teal-900 dark:text-cream-50">{selectedOrphanage.name}</h3>
              <p className="text-xs text-teal-500 dark:text-cream-400">{selectedOrphanage.address?.city}, {selectedOrphanage.address?.state}</p>
            </div>
          </div>

          {/* Donations Table */}
          {donationLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
            </div>
          ) : donationError ? (
            <div className="text-center py-16">
              <FaDonate className="text-5xl text-red-300 dark:text-red-600 mx-auto mb-4" />
              <p className="text-red-500 dark:text-red-400">{donationError}</p>
              <button onClick={() => fetchDonations(selectedOrphanage._id)} className="mt-3 text-sm text-coral-500 hover:text-coral-600 font-medium">Retry</button>
            </div>
          ) : donations.length === 0 ? (
            <div className="text-center py-16">
              <FaDonate className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
              <p className="text-teal-600 dark:text-cream-400">No donations found for this orphanage</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-cream-200 dark:border-dark-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream-50 dark:bg-dark-800 border-b border-cream-200 dark:border-dark-700">
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Donor</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Purpose</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-800">
                  {donations.map((d) => (
                    <tr key={d._id} className="border-b border-cream-100 dark:border-dark-700 hover:bg-cream-50/50 dark:hover:bg-dark-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-teal-400 text-xs" />
                          <div>
                            <p className="font-medium text-teal-900 dark:text-cream-50">
                              {d.donorDetails?.name || 'Anonymous'}
                            </p>
                            <p className="text-xs text-teal-500 dark:text-cream-400">{d.donorDetails?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-teal-900 dark:text-cream-50">
                        ₹{d.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-teal-700 dark:text-cream-200 capitalize">{d.purpose || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[d.status] || ''}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-teal-500 dark:text-cream-400 text-xs">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-sm bg-cream-100 dark:bg-dark-700 text-teal-700 dark:text-cream-200 disabled:opacity-50 hover:bg-cream-200 dark:hover:bg-dark-600 transition"
              >
                Previous
              </button>
              <span className="text-sm text-teal-600 dark:text-cream-400">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-sm bg-cream-100 dark:bg-dark-700 text-teal-700 dark:text-cream-200 disabled:opacity-50 hover:bg-cream-200 dark:hover:bg-dark-600 transition"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SADonationMonitoring
