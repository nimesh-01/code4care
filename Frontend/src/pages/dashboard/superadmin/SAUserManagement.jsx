import { useState, useEffect, useCallback } from 'react'
import {
  FaSearch, FaUser, FaBan, FaCheckCircle, FaUsers, FaEnvelope,
  FaPhone, FaMapMarkerAlt, FaCalendarAlt,
} from 'react-icons/fa'
import { MdVolunteerActivism } from 'react-icons/md'
import { superAdminAPI } from '../../../services/api'

const roleConfig = {
  user: { label: 'User', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300', icon: FaUser },
  volunteer: { label: 'Volunteer', color: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300', icon: MdVolunteerActivism },
  orphanAdmin: { label: 'Orphan Admin', color: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300', icon: FaUsers },
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300' },
  blocked: { label: 'Blocked', color: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' },
}

const SAUserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [confirmAction, setConfirmAction] = useState(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 15 }
      if (roleFilter) params.role = roleFilter
      if (statusFilter) params.status = statusFilter
      if (search) params.search = search
      const res = await superAdminAPI.getUsers(params)
      setUsers(res.data.users || [])
      setTotalPages(res.data.totalPages || 1)
      setTotal(res.data.total || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [roleFilter, statusFilter, page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await superAdminAPI.updateUserStatus(userId, { status: newStatus })
      setConfirmAction(null)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50 font-playfair">User Management</h2>
          <p className="text-sm text-teal-600 dark:text-cream-400">{total} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search users..."
            className="input-field pl-11"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="">All Roles</option>
          <option value="user">Users</option>
          <option value="volunteer">Volunteers</option>
          <option value="orphanAdmin">Orphan Admins</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="input-field w-auto min-w-[140px]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {/* User List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-coral-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <FaUsers className="text-5xl text-teal-300 dark:text-dark-600 mx-auto mb-4" />
          <p className="text-teal-600 dark:text-cream-400">No users found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 dark:border-dark-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-50 dark:bg-dark-800 border-b border-cream-200 dark:border-dark-700">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-teal-500 dark:text-cream-300">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-800">
              {users.map((u) => {
                const role = roleConfig[u.role]
                const status = statusConfig[u.status]
                return (
                  <tr key={u._id} className="border-b border-cream-100 dark:border-dark-700 hover:bg-cream-50/50 dark:hover:bg-dark-700/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {u.profileUrl ? (
                          <img src={u.profileUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-dark-600 flex items-center justify-center">
                            <FaUser className="text-teal-500 text-xs" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-teal-900 dark:text-cream-50">
                            {u.fullname?.firstname} {u.fullname?.lastname}
                          </p>
                          <p className="text-xs text-teal-500 dark:text-cream-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role?.color}`}>
                        {role?.label || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                        {status?.label || u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs space-y-0.5">
                        <p className="text-teal-700 dark:text-cream-200 flex items-center gap-1">
                          <FaEnvelope className="text-teal-400" /> {u.email}
                        </p>
                        {u.phone && (
                          <p className="text-teal-500 dark:text-cream-400 flex items-center gap-1">
                            <FaPhone className="text-teal-400" /> {u.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-teal-500 dark:text-cream-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.status === 'active' ? (
                        <button
                          onClick={() => setConfirmAction({ userId: u._id, status: 'blocked', name: `${u.fullname?.firstname} ${u.fullname?.lastname}` })}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition"
                        >
                          <FaBan /> Block
                        </button>
                      ) : u.status === 'blocked' ? (
                        <button
                          onClick={() => setConfirmAction({ userId: u._id, status: 'active', name: `${u.fullname?.firstname} ${u.fullname?.lastname}` })}
                          className="inline-flex items-center gap-1 text-xs font-medium text-green-500 hover:text-green-600 transition"
                        >
                          <FaCheckCircle /> Unblock
                        </button>
                      ) : null}
                    </td>
                  </tr>
                )
              })}
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

      {/* Confirm Action Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl bg-white dark:bg-dark-800 border border-cream-200 dark:border-dark-700 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50">
              {confirmAction.status === 'blocked' ? 'Block User?' : 'Unblock User?'}
            </h3>
            <p className="mt-2 text-sm text-teal-600 dark:text-cream-400">
              {confirmAction.status === 'blocked'
                ? `Are you sure you want to block ${confirmAction.name}? They will lose access to the platform.`
                : `Are you sure you want to unblock ${confirmAction.name}? They will regain access.`
              }
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 rounded-xl border border-cream-300 dark:border-dark-600 text-teal-700 dark:text-cream-200 text-sm font-medium hover:bg-cream-50 dark:hover:bg-dark-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(confirmAction.userId, confirmAction.status)}
                className={`flex-1 py-2 rounded-xl text-white text-sm font-medium transition ${
                  confirmAction.status === 'blocked' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {confirmAction.status === 'blocked' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SAUserManagement
