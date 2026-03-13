import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaSearch, FaUser, FaBan, FaCheckCircle, FaUsers, FaEnvelope,
  FaPhone, FaEye, FaTrash, FaExchangeAlt, FaBuilding,
} from 'react-icons/fa'
import { MdVolunteerActivism } from 'react-icons/md'
import { toast } from 'react-toastify'
import { superAdminAPI } from '../../../services/api'

const roleConfig = {
  user: { label: 'User', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300', icon: FaUser },
  volunteer: { label: 'Volunteer', color: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300', icon: MdVolunteerActivism },
  orphanAdmin: { label: 'Orphan Admin', color: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-300', icon: FaUsers },
  superAdmin: { label: 'Super Admin', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200', icon: FaUser },
}

const roleOptions = [
  { value: 'user', label: 'User' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'orphanAdmin', label: 'Orphan Admin' },
]

const extractOrphanageMeta = (user) => {
  const populated = user?.orphanage || (typeof user?.orphanageId === 'object' && user.orphanageId !== null ? user.orphanageId : null)
  const orphanageId = user?.orphanageId && typeof user.orphanageId !== 'object'
    ? user.orphanageId
    : populated?._id
  return {
    id: orphanageId ? String(orphanageId) : '',
    name: populated?.name || null,
  }
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
  const [roleModal, setRoleModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const [isCompact, setIsCompact] = useState(false)
  const navigate = useNavigate()

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const syncViewport = () => setIsCompact(window.innerWidth < 1100)
    syncViewport()
    window.addEventListener('resize', syncViewport)
    return () => window.removeEventListener('resize', syncViewport)
  }, [])

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      const payload = { status: newStatus }
      if (newStatus === 'blocked' && confirmAction?.reason) {
        payload.reason = confirmAction.reason.trim()
      }
      await superAdminAPI.updateUserStatus(userId, payload)
      setConfirmAction(null)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRoleUpdate = async () => {
    if (!roleModal || roleModal.nextRole === roleModal.currentRole) return
    try {
      await superAdminAPI.updateUserRole(roleModal.userId, { role: roleModal.nextRole })
      toast.success('User role updated')
      setRoleModal(null)
      fetchUsers()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Unable to update role')
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteModal) return
    try {
      await superAdminAPI.deleteUser(deleteModal.userId)
      toast.success('User deleted successfully')
      setDeleteModal(null)
      fetchUsers()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  const handleViewUser = (userId) => {
    navigate(`/dashboard/superadmin/users/${userId}`)
  }

  const handleOpenOrphanage = (orphanageId) => {
    if (!orphanageId) {
      toast.error('This user is not linked to an orphanage yet.')
      return
    }
    navigate(`/dashboard/superadmin/orphanages/${encodeURIComponent(orphanageId)}`)
  }

  const renderActions = (user, orphanageId, layout = 'table') => {
    const baseClass = layout === 'card'
      ? 'btn btn-outline btn-compact text-xs normal-case'
      : 'btn btn-link btn-compact normal-case tracking-normal'
    const btnClass = (extra = '') => `${baseClass} flex items-center gap-1 ${layout === 'card' ? 'justify-center flex-1 min-w-[120px]' : ''} ${extra}`
    const wrapperClass = layout === 'card'
      ? 'flex flex-wrap gap-2'
      : 'flex flex-wrap items-center justify-end gap-3'

    return (
      <div className={wrapperClass}>
        {orphanageId && (
          <button onClick={() => handleOpenOrphanage(orphanageId)} className={btnClass()}>
            <FaBuilding /> Orphanage
          </button>
        )}
        <button onClick={() => handleViewUser(user._id)} className={btnClass()}>
          <FaEye /> View
        </button>
        <button
          onClick={() => setRoleModal({
            userId: user._id,
            name: `${user.fullname?.firstname || ''} ${user.fullname?.lastname || ''}`.trim() || user.username,
            currentRole: user.role,
            nextRole: user.role,
          })}
          className={btnClass('text-amber-600 hover:text-amber-500 dark:text-amber-300')}
        >
          <FaExchangeAlt /> Role
        </button>
        {user.status === 'active' ? (
          <button
            onClick={() => setConfirmAction({ userId: user._id, status: 'blocked', name: `${user.fullname?.firstname} ${user.fullname?.lastname}`, reason: '' })}
            className={btnClass('text-red-500 hover:text-red-600 dark:text-red-400')}
          >
            <FaBan /> Block
          </button>
        ) : user.status === 'blocked' ? (
          <button
            onClick={() => setConfirmAction({ userId: user._id, status: 'active', name: `${user.fullname?.firstname} ${user.fullname?.lastname}` })}
            className={btnClass('text-green-500 hover:text-green-600 dark:text-green-300')}
          >
            <FaCheckCircle /> Unblock
          </button>
        ) : null}
        <button
          onClick={() => setDeleteModal({
            userId: user._id,
            name: `${user.fullname?.firstname || ''} ${user.fullname?.lastname || ''}`.trim() || user.username,
          })}
          className={btnClass('text-red-600 hover:text-red-700 dark:text-red-400')}
        >
          <FaTrash /> Delete
        </button>
      </div>
    )
  }

  const renderUserTable = () => (
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
            const { id: orphanageId, name: orphanageName } = extractOrphanageMeta(u)
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
                    {orphanageName && (
                      <p className="text-teal-500 dark:text-cream-400 flex items-center gap-1">
                        <FaBuilding className="text-teal-400" /> {orphanageName}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-teal-500 dark:text-cream-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {renderActions(u, orphanageId)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const renderUserCards = () => (
    <div className="space-y-4">
      {users.map((u) => {
        const role = roleConfig[u.role]
        const status = statusConfig[u.status]
        const { id: orphanageId, name: orphanageName } = extractOrphanageMeta(u)
        return (
          <article key={u._id} className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4 space-y-4">
            <div className="flex items-center gap-3">
              {u.profileUrl ? (
                <img src={u.profileUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-dark-600 flex items-center justify-center">
                  <FaUser className="text-teal-500" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-teal-900 dark:text-cream-50">
                  {u.fullname?.firstname} {u.fullname?.lastname}
                </p>
                <p className="text-xs text-teal-500 dark:text-cream-400">@{u.username}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${role?.color}`}>
                    {role?.label || u.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status?.color}`}>
                    {status?.label || u.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs text-teal-600 dark:text-cream-400 border-y border-cream-200 dark:border-dark-700 py-3 space-y-1">
              <p className="flex items-center gap-2 break-all">
                <FaEnvelope className="text-teal-400" /> {u.email}
              </p>
              {u.phone && (
                <p className="flex items-center gap-2">
                  <FaPhone className="text-teal-400" /> {u.phone}
                </p>
              )}
              {orphanageName && (
                <p className="flex items-center gap-2">
                  <FaBuilding className="text-teal-400" /> {orphanageName}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-teal-700 dark:text-cream-300">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-teal-500 dark:text-cream-400">Joined</p>
                <p className="font-semibold text-teal-900 dark:text-cream-50">{new Date(u.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-teal-500 dark:text-cream-400">Orphanage</p>
                <p className="font-semibold text-teal-900 dark:text-cream-50">{orphanageName || '—'}</p>
              </div>
            </div>
            {renderActions(u, orphanageId, 'card')}
          </article>
        )
      })}
    </div>
  )

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
        <>{isCompact ? renderUserCards() : renderUserTable()}</>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="btn btn-neutral btn-compact normal-case tracking-normal"
          >
            Previous
          </button>
          <span className="text-sm text-teal-600 dark:text-cream-400">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn btn-neutral btn-compact normal-case tracking-normal"
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
                className="btn btn-ghost normal-case flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(confirmAction.userId, confirmAction.status)}
                disabled={confirmAction.status === 'blocked' && !confirmAction.reason?.trim()}
                className={`btn flex-1 normal-case ${confirmAction.status === 'blocked' ? 'btn-danger' : 'btn-success'}`}
              >
                {confirmAction.status === 'blocked' ? 'Block' : 'Unblock'}
              </button>
            </div>
            {confirmAction.status === 'blocked' && (
              <div className="mt-4">
                <label className="text-xs uppercase text-teal-500 dark:text-cream-400 font-semibold">Reason for blocking</label>
                <textarea
                  value={confirmAction.reason}
                  onChange={(e) => setConfirmAction(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Provide context that will be shown to the user"
                  rows={4}
                  className="mt-2 input-field"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl bg-white dark:bg-dark-800 border border-cream-200 dark:border-dark-700 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50">Change Role</h3>
            <p className="mt-2 text-sm text-teal-600 dark:text-cream-400">
              Choose the new role for {roleModal.name}. Orphan Admins remain pending until their orphanage is verified.
            </p>
            <select
              value={roleModal.nextRole}
              onChange={(e) => setRoleModal(prev => ({ ...prev, nextRole: e.target.value }))}
              className="mt-4 input-field w-full"
            >
              {roleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRoleModal(null)}
                className="btn btn-ghost normal-case flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleUpdate}
                disabled={roleModal.nextRole === roleModal.currentRole}
                className={`btn btn-warning normal-case flex-1 ${roleModal.nextRole === roleModal.currentRole ? 'disabled:opacity-50' : ''}`}
              >
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="rounded-2xl bg-white dark:bg-dark-800 border border-cream-200 dark:border-dark-700 p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-600">Delete User?</h3>
            <p className="mt-2 text-sm text-teal-600 dark:text-cream-400">
              Deleting {deleteModal.name} removes their account and any orphanage they manage. This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteModal(null)}
                className="btn btn-ghost normal-case flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="btn btn-danger normal-case flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default SAUserManagement
