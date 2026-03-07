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
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import Navbar from '../../../components/Navbar'
import { authAPI } from '../../../services/api'
import { useTheme } from '../../../context/ThemeContext'

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

const ParticipantProfile = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true)
        const response = await authAPI.getUserById(userId)
        setProfile(response.data?.user)
      } catch (error) {
        const message = error?.response?.data?.message || 'Unable to load user profile'
        toast.error(message)
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [userId, navigate])

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
      <>
        <Navbar />
        <div className="min-h-screen bg-cream-50 dark:bg-dark-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-coral-500" />
        </div>
      </>
    )
  }

  if (!profile) {
    return null
  }

  const fullName = `${profile.fullname?.firstname || ''} ${profile.fullname?.lastname || ''}`.trim() || profile.username
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('') || 'SC'

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-cream-50 via-white to-cream-100 dark:from-dark-900 dark:via-dark-950 dark:to-dark-900 pt-24 pb-12">
        <div className="mx-auto max-w-5xl px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white px-4 py-2 text-sm font-medium text-teal-700 hover:border-coral-400 hover:text-coral-500 dark:border-dark-700 dark:bg-dark-800 dark:text-cream-200"
          >
            <FaArrowLeft />
            Back
          </button>

          <section className="rounded-3xl border border-white/40 bg-white/90 px-8 py-10 shadow-2xl backdrop-blur-xl dark:border-dark-700 dark:bg-dark-900/80">
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
                  <p className="text-xs uppercase tracking-[0.4em] text-teal-500 dark:text-cream-300">Conversation Participant</p>
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
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-coral-500 px-5 py-3 text-sm font-semibold text-white shadow-lg"
                >
                  <FaComments />
                  Open Chat
                </button>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-flex items-center gap-2 rounded-2xl border border-cream-300 px-5 py-3 text-sm font-semibold text-teal-700 hover:border-coral-400 hover:text-coral-500 dark:border-dark-600 dark:text-cream-200"
                  >
                    <FaPaperPlane />
                    Send Email
                  </a>
                )}
              </div>
            </div>

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

          {theme === 'dark' && (
            <p className="mt-6 text-center text-xs text-cream-400">
              Showing profile data captured from SoulConnect authentication service.
            </p>
          )}
        </div>
      </div>
    </>
  )
}

const InfoCard = ({ title, rows }) => (
  <div className="rounded-2xl border border-cream-200 bg-white px-6 py-5 shadow-md dark:border-dark-700 dark:bg-dark-800">
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

export default ParticipantProfile
