import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaUser,
  FaUserTie,
  FaUserShield,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaComments,
  FaUserFriends,
  FaPaperPlane,
  FaHandsHelping,
  FaCheckCircle,
} from 'react-icons/fa'
import { MdEvent } from 'react-icons/md'
import { toast } from 'react-toastify'
import { authAPI } from '../../../services/api'
import { useAdminDashboardContext } from './AdminLayout'

const ROLE_META = {
  user: { label: 'User', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-200', icon: FaUser },
  volunteer: { label: 'Volunteer', color: 'bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-200', icon: FaUserTie },
  orphanAdmin: { label: 'Orphanage Admin', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200', icon: FaUserShield },
  superAdmin: { label: 'Super Admin', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200', icon: FaUserShield },
}

const formatDate = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not available'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const VolunteerProfile = () => {
  const { odaUserId } = useParams()
  const navigate = useNavigate()
  const { data } = useAdminDashboardContext()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await authAPI.getUserById(odaUserId)
        setProfile(response.data?.user)
      } catch (error) {
        const message = error?.response?.data?.message || 'Unable to load volunteer profile'
        toast.error(message)
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [odaUserId, navigate])

  // Aggregate activity from dashboard data
  const activity = useMemo(() => {
    const helpRequests = (data.helpRequests || []).filter(
      (hr) => hr.assignedVolunteerId?.toString() === odaUserId
    )
    const events = (data.events || []).flatMap((event) =>
      (event.participants || [])
        .filter((p) => p.role === 'volunteer' && (p.participantId || '').toString() === odaUserId)
        .map((p) => ({
          _id: event._id,
          title: event.title,
          category: event.category,
          status: event.status,
          eventDate: event.eventDate,
          joinedAt: p.joinedAt,
        }))
    )
    return { helpRequests, events }
  }, [data.helpRequests, data.events, odaUserId])

  const roleMeta = useMemo(() => ROLE_META[profile?.role] || ROLE_META.user, [profile?.role])
  const RoleIcon = roleMeta.icon || FaUser

  const goToChat = () => {
    if (!profile) return
    const receiverId = profile._id || profile.id
    if (!receiverId) return
    navigate(`/chat?receiverId=${receiverId}&receiverRole=${profile.role}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-coral-500" />
      </div>
    )
  }

  if (!profile) return null

  const fullName = `${profile.fullname?.firstname || ''} ${profile.fullname?.lastname || ''}`.trim() || profile.username
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || 'SC'

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => navigate('/dashboard/admin/volunteers')}
        className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white px-4 py-2 text-sm font-medium text-teal-700 hover:border-coral-400 hover:text-coral-500 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-200 transition"
      >
        <FaArrowLeft />
        Back to Volunteers
      </button>

      {/* Profile header */}
      <section className="rounded-3xl border border-cream-200 bg-white px-8 py-10 shadow-md dark:border-dark-700 dark:bg-dark-800">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-400 to-coral-400 text-3xl font-semibold text-white shadow-lg">
              {profile.profileUrl ? (
                <img src={profile.profileUrl} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">{initials}</div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Volunteer Profile</p>
              <h1 className="text-3xl font-semibold text-teal-900 dark:text-cream-50">{fullName}</h1>
              <div className="mt-3 inline-flex items-center gap-2">
                <RoleIcon className="text-lg text-coral-400" />
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleMeta.color}`}>
                  {roleMeta.label}
                </span>
                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-white/10 dark:text-cream-200">
                  Status: {(profile.status || 'active').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goToChat}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-coral-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              <FaComments />
              Open Chat
            </button>
            {profile.email && (
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 px-5 py-3 text-sm font-semibold text-teal-700 hover:border-coral-400 hover:text-coral-500 dark:border-dark-600 dark:text-cream-200 transition"
              >
                <FaPaperPlane />
                Send Email
              </a>
            )}
          </div>
        </div>

        {/* Contact & membership */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <InfoCard
            title="Contact"
            rows={[
              { icon: FaEnvelope, label: 'Email', value: profile.email },
              { icon: FaPhone, label: 'Phone', value: profile.phone || 'Not provided' },
              { icon: FaUser, label: 'Username', value: profile.username },
            ]}
          />
          <InfoCard
            title="Membership"
            rows={[
              { icon: FaCalendarAlt, label: 'Member since', value: formatDate(profile.createdAt) },
              { icon: FaUserFriends, label: 'Role', value: roleMeta.label },
              { icon: FaUserShield, label: 'Account Status', value: profile.status || 'active' },
            ]}
          />
        </div>

        {/* Address */}
        {(profile.address?.city || profile.address?.state || profile.address?.country || profile.address?.street) && (
          <div className="mt-6 rounded-2xl border border-cream-200 bg-cream-50 px-6 py-5 dark:border-dark-700 dark:bg-dark-800">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">Location</p>
            <div className="mt-3 flex items-start gap-3 text-sm text-teal-800 dark:text-cream-200">
              <FaMapMarkerAlt className="text-coral-400" />
              <div>
                <p className="font-semibold">{profile.address?.street || 'Address details unavailable'}</p>
                <p className="text-sm text-teal-600 dark:text-cream-400">
                  {[profile.address?.city, profile.address?.state, profile.address?.country].filter(Boolean).join(', ')}
                </p>
                {profile.address?.pincode && (
                  <p className="text-xs text-teal-500 dark:text-cream-400">PIN {profile.address.pincode}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Volunteer activity */}
      <section className="rounded-3xl border border-cream-200 bg-white px-8 py-8 shadow-md dark:border-dark-700 dark:bg-dark-800">
        <h2 className="text-xl font-semibold text-teal-900 dark:text-cream-50">Volunteer Activity</h2>

        {/* Stats row */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-600 dark:bg-dark-700">
            <FaHandsHelping className="text-xl text-teal-500" />
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-teal-500">Help Requests</p>
            <p className="mt-1 text-2xl font-bold text-teal-900 dark:text-cream-50">{activity.helpRequests.length}</p>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-600 dark:bg-dark-700">
            <FaCheckCircle className="text-xl text-emerald-500" />
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-teal-500">Completed</p>
            <p className="mt-1 text-2xl font-bold text-teal-900 dark:text-cream-50">
              {activity.helpRequests.filter((hr) => hr.status === 'completed').length}
            </p>
          </div>
          <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 dark:border-dark-600 dark:bg-dark-700">
            <MdEvent className="text-xl text-coral-500" />
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-teal-500">Events Joined</p>
            <p className="mt-1 text-2xl font-bold text-teal-900 dark:text-cream-50">{activity.events.length}</p>
          </div>
        </div>

        {/* Help requests list */}
        {activity.helpRequests.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300 flex items-center gap-1.5">
              <FaHandsHelping /> Help Requests
            </p>
            <div className="mt-3 space-y-3">
              {activity.helpRequests.map((hr) => (
                <div key={hr._id} className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 dark:border-dark-600 dark:bg-dark-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-teal-900 dark:text-cream-50">{hr.requestType}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      hr.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                        : hr.status === 'accepted'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300'
                    }`}>
                      {hr.status}
                    </span>
                  </div>
                  <p className="text-sm text-teal-600 dark:text-cream-400 mt-1 line-clamp-2">{hr.description}</p>
                  <p className="text-xs text-teal-400 dark:text-cream-500 mt-1">{formatDate(hr.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events list */}
        {activity.events.length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300 flex items-center gap-1.5">
              <MdEvent /> Events
            </p>
            <div className="mt-3 space-y-3">
              {activity.events.map((ev) => (
                <div key={ev._id} className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 dark:border-dark-600 dark:bg-dark-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-teal-900 dark:text-cream-50">{ev.title}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      ev.status === 'completed' || ev.status === 'past'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-300'
                        : ev.status === 'upcoming'
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                    }`}>
                      {ev.status}
                    </span>
                  </div>
                  <p className="text-sm text-teal-600 dark:text-cream-400 mt-1">
                    {ev.category} &bull; {formatDate(ev.eventDate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activity.helpRequests.length === 0 && activity.events.length === 0 && (
          <p className="mt-6 text-center text-teal-500 dark:text-cream-400">
            No activity recorded for this volunteer yet.
          </p>
        )}
      </section>
    </div>
  )
}

const InfoCard = ({ title, rows }) => (
  <div className="rounded-2xl border border-cream-200 bg-cream-50 px-6 py-5 dark:border-dark-700 dark:bg-dark-700">
    <p className="text-xs uppercase tracking-[0.3em] text-teal-500 dark:text-cream-300">{title}</p>
    <dl className="mt-4 space-y-3">
      {rows.map((row) => {
        const Icon = row.icon
        return (
          <div key={row.label} className="flex items-start gap-3">
            <span className="mt-1 text-teal-400 dark:text-cream-300"><Icon /></span>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-teal-400 dark:text-cream-400">{row.label}</dt>
              <dd className="text-sm font-semibold text-teal-900 dark:text-cream-100">{row.value || 'Not available'}</dd>
            </div>
          </div>
        )
      })}
    </dl>
  </div>
)

export default VolunteerProfile
