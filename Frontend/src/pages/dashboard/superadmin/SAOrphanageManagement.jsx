import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaSearch, FaBuilding, FaMapMarkerAlt } from 'react-icons/fa'
import { superAdminAPI } from '../../../services/api'

const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300', label: 'Pending' },
  approved: { color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300', label: 'Approved' },
  rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', label: 'Rejected' },
  blocked: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-300', label: 'Blocked' },
}

const SAOrphanageManagement = () => {
  const navigate = useNavigate()
  const [orphanages, setOrphanages] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchOrphanages = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 12 }
      if (filter) params.status = filter
      if (search) params.search = search
      const res = await superAdminAPI.getOrphanages(params)
      setOrphanages(res.data.orphanages || [])
      setTotalPages(res.data.totalPages || 1)
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filter, page, search])

  useEffect(() => { fetchOrphanages() }, [fetchOrphanages])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">Orphanage Management</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">{total} total orphanages</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setFilter(''); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!filter ? 'bg-coral-500 text-white' : 'bg-cream-100 dark:bg-dark-700 text-teal-700 dark:text-cream-200'}`}
          >
            All
          </button>
          {Object.entries(statusConfig).map(([key, val]) => (
            <button
              key={key}
              onClick={() => { setFilter(key); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === key ? 'bg-coral-500 text-white' : 'bg-cream-100 dark:bg-dark-700 text-teal-700 dark:text-cream-200'}`}
            >
              {val.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search orphanages..."
          className="input-field pl-11"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
        </div>
      ) : orphanages.length === 0 ? (
        <div className="text-center py-16">
          <FaBuilding className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
          <p className="text-teal-600 dark:text-cream-400">No orphanages found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orphanages.map((org) => (
            <div
              key={org._id}
              onClick={() => navigate(`/dashboard/superadmin/orphanages/${org._id}`)}
              className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-teal-900 dark:text-cream-50 truncate">{org.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${statusConfig[org.status]?.color}`}>
                    {statusConfig[org.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-teal-500 dark:text-cream-400">
                  Reg: {org.registrationNumber}
                </p>
                <div className="flex items-center gap-1 text-xs text-teal-500 dark:text-cream-400">
                  <FaMapMarkerAlt className="text-teal-400" />
                  {org.address?.city}, {org.address?.state}
                </div>
                {org.orphanAdmin && (
                  <p className="text-xs text-teal-400 dark:text-cream-400/70">
                    Admin: {org.orphanAdmin.fullname?.firstname} {org.orphanAdmin.fullname?.lastname}
                  </p>
                )}
                <p className="text-xs text-teal-400/70 dark:text-cream-400/50">
                  Registered {new Date(org.createdAt).toLocaleDateString()}
                </p>
              </div>
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
    </div>
  )
}

export default SAOrphanageManagement
