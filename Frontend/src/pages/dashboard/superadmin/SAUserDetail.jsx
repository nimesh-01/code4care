import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUserShield,
  FaBan,
  FaCheckCircle,
  FaInfoCircle,
  FaHandsHelping,
  FaClipboardList,
  FaCalendarCheck,
  FaGlobe,
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import { authAPI, superAdminAPI } from '../../../services/api'

const roleLabels = {
  user: 'User',
  volunteer: 'Volunteer',
  orphanAdmin: 'Orphanage Admin',
  superAdmin: 'Super Admin',
}

const statusStyles = {
  active: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
}

const roleSpotlights = {
  user: {
    title: 'Community Supporter',
    gradient: 'from-sky-500 via-indigo-500 to-purple-600',
    missions: [
      'Books visits and appointments with orphanages',
      'Follows impact stories & encourages donations',
      'Engages with platform events and posts',
    ],
    icon: FaHandsHelping,
  },
  volunteer: {
    title: 'Field Volunteer',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    missions: [
      'Accepts and completes help requests in the field',
      'Guides visitors and coordinates appointments',
      'Supports campaigns via chat and community outreach',
    ],
    icon: FaClipboardList,
  },
  orphanAdmin: {
    title: 'Orphanage Admin',
    gradient: 'from-rose-500 via-orange-500 to-amber-500',
    missions: [
      'Publishes children profiles, posts, and events',
      'Oversees donations, receipts, and volunteers',
      'Manages appointments and platform compliance',
    ],
    icon: FaCalendarCheck,
  },
  default: {
    title: 'SoulConnect Member',
    gradient: 'from-slate-600 via-slate-700 to-slate-900',
    missions: [
      'Connects with orphanages across the network',
      'Follows events and supports community drives',
    ],
    icon: FaGlobe,
  },
}

const resolveFullName = (user) => {
  if (!user) return ''
  const full = user.fullname
  if (typeof full === 'string') return full
  const first = full?.firstname || full?.firstName || ''
  const last = full?.lastname || full?.lastName || ''
  const combined = `${first} ${last}`.trim()
  return combined || user.username || ''
}

const SAUserDetail = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await authAPI.getUserById(userId)
      setUser(response.data.user || response.data)
    } catch (err) {
      console.error(err)
      setError('Unable to load user profile. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userId])

  const handleStatusChange = async (nextStatus) => {
    if (!user || updatingStatus) return
    if (nextStatus === 'blocked' && !blockReason.trim()) {
      toast.error('Please provide a reason before blocking this account.')
      return
    }
    setUpdatingStatus(true)
    try {
      await superAdminAPI.updateUserStatus(user._id, {
        status: nextStatus,
        reason: nextStatus === 'blocked' ? blockReason.trim() : undefined,
      })
      toast.success(`User status updated to ${nextStatus}`)
      if (nextStatus !== 'blocked') {
        setBlockReason('')
      }
      fetchUser()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update user status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const statusBadge = useMemo(() => {
    if (!user) return null
    const style = statusStyles[user.status] || 'bg-gray-100 text-gray-800'
    const label =
      user.status === 'blocked'
        ? 'Blocked'
        : user.status === 'pending'
          ? 'Pending'
          : 'Active'
    return (
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
        {user.status === 'active' ? <FaCheckCircle /> : user.status === 'blocked' ? <FaBan /> : <FaInfoCircle />}
        {label}
      </span>
    )
  }, [user])

  const blockActionLabel = user?.status === 'blocked' ? 'Unblock User' : 'Block User'
  const nextStatus = user?.status === 'blocked' ? 'active' : 'blocked'

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-coral-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6 text-center">
        <p className="text-sm text-red-600 dark:text-red-300">{error}</p>
        <button
          onClick={fetchUser}
          className="mt-4 btn btn-danger normal-case"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-16 text-teal-600 dark:text-cream-400">User not found.</div>
    )
  }

  const spotlight = roleSpotlights[user.role] || roleSpotlights.default
  const SpotlightIcon = spotlight.icon
  const locationLabel = user.address?.full || [user.address?.city, user.address?.state].filter(Boolean).join(', ') || 'Not provided'
  const joinedLabel = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'
  const avatarLetter = (resolveFullName(user) || user.username || '?').charAt(0).toUpperCase()
  const contactTiles = [
    { label: 'Email', value: user.email || 'Not provided', icon: <FaEnvelope className="text-white/80" /> },
    { label: 'Phone', value: user.phone || 'Not provided', icon: <FaPhone className="text-white/80" /> },
    { label: 'Location', value: locationLabel, icon: <FaMapMarkerAlt className="text-white/80" /> },
  ]
  const linkedOrphanageId = user.orphanage?._id || user.orphanageId

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-link normal-case"
          >
            <FaArrowLeft /> Back
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-teal-500">User Profile</p>
            <h1 className="text-2xl font-semibold text-teal-900 dark:text-cream-50">{resolveFullName(user) || 'User'}</h1>
            <p className="text-sm text-teal-500 dark:text-cream-400">@{user.username}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          {statusBadge}
          <button
            onClick={() => handleStatusChange(nextStatus)}
            disabled={updatingStatus}
            className={`btn min-w-[200px] ${user.status === 'blocked' ? 'btn-success' : 'btn-danger'}`}
          >
            {user.status === 'blocked' ? <FaCheckCircle /> : <FaBan />}
            {updatingStatus ? 'Updating...' : blockActionLabel}
          </button>
          {user.status !== 'blocked' && (
            <textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Reason for blocking (visible to the user)"
              rows={3}
              className="input-field min-w-[260px]"
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${spotlight.gradient} text-white p-6 shadow-2xl shadow-black/20`}> 
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_60%)]" aria-hidden />
            <div className="relative z-10 flex flex-wrap gap-6">
              <div className="flex flex-1 min-w-[260px] items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-2xl font-semibold uppercase overflow-hidden">
                  {user.profileUrl ? (
                    <img src={user.profileUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    avatarLetter
                  )}
                </div>
                <div>
                  <p className="text-xs tracking-[0.4em] uppercase text-white/70">Account Summary</p>
                  <h3 className="text-2xl font-semibold">{resolveFullName(user) || 'User'}</h3>
                  <p className="text-white/80">@{user.username}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 border border-white/30">
                      {roleLabels[user.role] || user.role}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/20 border border-white/20 capitalize">
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-[220px] space-y-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/70">
                  <SpotlightIcon className="text-white/80" />
                  <span>{spotlight.title}</span>
                </div>
                <ul className="space-y-2">
                  {spotlight.missions.map((mission) => (
                    <li key={mission} className="flex items-start gap-2 text-sm text-white/90">
                      <FaCheckCircle className="mt-0.5 text-lime-300" />
                      <span>{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
              {contactTiles.map((tile) => (
                <div key={tile.label} className="rounded-2xl bg-white/15 backdrop-blur-sm p-4 border border-white/10">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/80">
                    {tile.icon}
                    <span>{tile.label}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-white/95 break-words">{tile.value}</p>
                </div>
              ))}
            </div>

            <div className="relative z-10 mt-4 flex flex-wrap gap-3 text-sm text-white/80">
              <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-2 flex items-center gap-2">
                <FaCalendarAlt />
                Member since {joinedLabel}
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/20 px-4 py-2 flex items-center gap-2">
                <FaUserShield />
                {roleLabels[user.role] || 'Role'} privileges active
              </div>
            </div>

            {user.blockReason && (
              <div className="relative z-10 mt-5 rounded-2xl bg-black/30 border border-red-200/40 p-4">
                <p className="text-xs uppercase tracking-wide text-red-200">Current block reason</p>
                <p className="mt-1 text-sm text-red-50 whitespace-pre-line">{user.blockReason}</p>
              </div>
            )}
          </div>

          {user.bio && (
            <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 mb-2">Bio</h3>
              <p className="text-sm text-teal-700 dark:text-cream-200 whitespace-pre-line">{user.bio}</p>
            </div>
          )}

          {user.orphanage?.name && linkedOrphanageId && (
            <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 mb-2">Linked Orphanage</h3>
              <p className="text-sm text-teal-700 dark:text-cream-200">{user.orphanage.name}</p>
              <Link
                to={`/dashboard/superadmin/orphanages/${encodeURIComponent(linkedOrphanageId)}`}
                className="btn btn-outline normal-case mt-3 inline-flex w-fit"
              >
                View Orphanage
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 mb-4">Block Appeals</h3>
            {user.blockAppeals?.length ? (
              <ul className="space-y-4 text-sm">
                {user.blockAppeals.map((appeal, idx) => (
                  <li key={appeal._id || idx} className="rounded-xl border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-700/50 p-4">
                    <p className="text-teal-800 dark:text-cream-100 whitespace-pre-line">{appeal.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-teal-500 dark:text-cream-300">
                      <span>{appeal.createdAt ? new Date(appeal.createdAt).toLocaleString() : 'Unknown date'}</span>
                      {appeal.status && <span className="capitalize">Status: {appeal.status}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-teal-500 dark:text-cream-400">No appeals submitted.</p>
            )}
          </div>

          <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 mb-4">Status Timeline</h3>
            <ul className="space-y-3 text-sm text-teal-700 dark:text-cream-200">
              <li className="flex justify-between">
                <span>Created</span>
                <span>{user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</span>
              </li>
              <li className="flex justify-between">
                <span>Last Login</span>
                <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'No data'}</span>
              </li>
              <li className="flex justify-between">
                <span>Current Status</span>
                <span className="capitalize">{user.status}</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50 mb-4">Admin Notes</h3>
            {user.notes?.length ? (
              <ul className="space-y-3 text-sm">
                {user.notes.map((note, idx) => (
                  <li key={idx} className="rounded-xl bg-cream-50 dark:bg-dark-700/60 p-3 border border-cream-200 dark:border-dark-600">
                    <p className="text-teal-800 dark:text-cream-100">{note.text || note}</p>
                    {note.createdAt && (
                      <p className="text-xs text-teal-500 dark:text-cream-400 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-teal-500 dark:text-cream-400">No admin notes recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SAUserDetail
