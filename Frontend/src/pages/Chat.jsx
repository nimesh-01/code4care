import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FaComments, FaPaperPlane, FaTimes, FaSearch, FaCircle,
  FaCheck, FaCheckDouble, FaClock, FaArrowLeft, FaTrash,
  FaSpinner, FaUserCircle, FaSmile, FaEnvelope, FaPhone,
  FaMapMarkerAlt, FaIdCard
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useConfirm } from '../context/ConfirmContext'
import { chatAPI, authAPI, orphanagesAPI } from '../services/api'
import useSocket from '../hooks/useSocket'

/* ───── helpers ───── */
const formatTime = (v) => {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString())
    return 'Yesterday ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

const formatSidebarTime = (v) => {
  if (!v) return ''
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const StatusIcon = ({ status }) => {
  if (status === 'read') return <FaCheckDouble className="text-teal-500 text-[10px]" />
  if (status === 'delivered') return <FaCheckDouble className="text-cream-400 text-[10px]" />
  if (status === 'sent') return <FaCheck className="text-cream-400 text-[10px]" />
  return <FaClock className="text-cream-400 text-[10px]" />
}

const roleLabel = (role) => {
  if (role === 'orphanAdmin') return 'Orphanage Admin'
  if (role === 'volunteer') return 'Volunteer'
  return 'User'
}

const formatDisplayName = (profile, fallbackRole) => {
  if (!profile) return roleLabel(fallbackRole)
  const firstname = profile.fullname?.firstname?.trim() || ''
  const lastname = profile.fullname?.lastname?.trim() || ''
  const full = [firstname, lastname].filter(Boolean).join(' ').trim()
  if (full) return full
  if (profile.username) return profile.username
  if (profile.email) return profile.email
  return roleLabel(profile.role || fallbackRole)
}

const getInitialFromName = (value, fallbackRole) => {
  if (value) {
    return value.trim().charAt(0).toUpperCase() || roleLabel(fallbackRole).charAt(0)
  }
  return roleLabel(fallbackRole).charAt(0)
}

const extractOrphanageMeta = (profile) => {
  if (!profile) return { orphanageId: null, orphanageName: '', address: null }

  const raw = profile.orphanage || profile.orphanageId || profile.orphanageProfile || null
  const isObjectRef = raw && typeof raw === 'object'
  const stringCandidate = typeof raw === 'string' ? raw : null

  const orphanageId = isObjectRef
    ? raw._id || raw.id || null
    : stringCandidate
      || (typeof profile.orphanageId === 'string' ? profile.orphanageId : null)

  const orphanageName = (isObjectRef && (raw.name || raw.title))
    || profile.orphanageName
    || profile.orphanageTitle
    || ''

  const address = (isObjectRef && raw.address)
    || profile.orphanageAddress
    || null

  return { orphanageId, orphanageName, address }
}

const formatOrphanageLocation = (address) => {
  if (!address) return ''
  const parts = [address.city, address.state, address.country].filter(Boolean)
  return parts.join(', ')
}

const CONVERSATION_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'admins', label: 'Admins' },
  { key: 'online', label: 'Online' },
]

/* ───── Main Chat Page ───── */
const Chat = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const { connected, on, off, emit } = useSocket(user)
  const confirmAction = useConfirm()

  // State
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [onlineUsers, setOnlineUsers] = useState({})
  const [typingUsers, setTypingUsers] = useState({})
  const [participantProfiles, setParticipantProfiles] = useState({})
  const [showMobileSidebar, setShowMobileSidebar] = useState(true)
  const [pagination, setPagination] = useState({ hasMore: false, currentPage: 1 })
  const [loadingMore, setLoadingMore] = useState(false)
  const [orphanageCache, setOrphanageCache] = useState({})
  const [profileDrawer, setProfileDrawer] = useState({ open: false, user: null, orphanage: null })
  const [profileLoading, setProfileLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const activeConvRef = useRef(null)

  const ensureOrphanageCached = useCallback(async (profile) => {
    if (!profile || profile.role !== 'orphanAdmin') return
    const { orphanageId } = extractOrphanageMeta(profile)
    if (!orphanageId || orphanageCache[orphanageId]) return
    try {
      const response = await orphanagesAPI.getById(orphanageId)
      const orphanage = response.data?.orphanage
      if (orphanage) {
        setOrphanageCache((prev) => ({ ...prev, [orphanageId]: orphanage }))
      }
    } catch (error) {
      console.error('Failed to cache orphanage details', error)
    }
  }, [orphanageCache])

  const getParticipantProfile = useCallback((participant) => {
    if (!participant?.participantId) return null
    return participantProfiles[participant.participantId] || null
  }, [participantProfiles])

  const getParticipantName = useCallback((participant) => {
    if (!participant) return ''
    const profile = getParticipantProfile(participant)
    return formatDisplayName(profile, participant.role)
  }, [getParticipantProfile])

  const getParticipantAvatar = useCallback((participant) => {
    const profile = getParticipantProfile(participant)
    return profile?.profileUrl || profile?.avatar || null
  }, [getParticipantProfile])

  const closeProfileDrawer = useCallback(() => {
    setProfileDrawer({ open: false, user: null, orphanage: null })
  }, [])

  const openProfileDrawer = useCallback(async (participant) => {
    if (!participant?.participantId) return
    setProfileLoading(true)
    const participantId = participant.participantId
    try {
      let profile = participantProfiles[participantId]
      if (!profile) {
        const response = await authAPI.getUserById(participantId)
        profile = response.data?.user
        if (profile) {
          setParticipantProfiles((prev) => ({ ...prev, [participantId]: profile }))
        }
      }

      if (!profile) {
        toast.error('Unable to load profile details')
        setProfileLoading(false)
        return
      }

      let orphanage = null
      const orphanageId =
        profile?.orphanageId?._id ||
        profile?.orphanageId ||
        profile?.orphanage?._id ||
        null
      if (profile.role === 'orphanAdmin' && orphanageId) {
        orphanage = orphanageCache[orphanageId]
        if (!orphanage) {
          try {
            const orphanageResponse = await orphanagesAPI.getById(orphanageId)
            orphanage = orphanageResponse.data?.orphanage
            if (orphanage) {
              setOrphanageCache((prev) => ({ ...prev, [orphanageId]: orphanage }))
            }
          } catch (error) {
            console.error('Failed to fetch orphanage details', error)
          }
        }
      }

      setProfileDrawer({ open: true, user: profile, orphanage })
    } catch (error) {
      console.error('Failed to load profile details', error)
      toast.error('Unable to load profile details')
    } finally {
      setProfileLoading(false)
    }
  }, [participantProfiles, orphanageCache])

  // Keep ref in sync
  useEffect(() => { activeConvRef.current = activeConversation }, [activeConversation])

  /* ───── Fetch conversations ───── */
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true)
      const res = await chatAPI.getConversations()
      const list = res.data?.data?.conversations || []
      setConversations(list)
      // Fetch profiles of other participants
      const ids = list.map(c => c.otherParticipant?.participantId).filter(Boolean)
      fetchProfiles(ids)
    } catch {
      toast.error('Failed to load conversations')
    } finally {
      setLoadingConversations(false)
    }
  }, [])

  /* ───── Fetch profiles in bulk ───── */
  const fetchProfiles = useCallback(async (ids) => {
    const unique = [...new Set(ids.map(String))].filter(id => !participantProfiles[id])
    if (!unique.length) return
    const results = await Promise.allSettled(unique.map(id => authAPI.getUserById(id)))
    const fetchedProfiles = []
    setParticipantProfiles(prev => {
      const next = { ...prev }
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
          const u = r.value.data?.user || r.value.data
          if (u) {
            next[unique[i]] = u
            fetchedProfiles.push(u)
          }
        }
      })
      return next
    })
    fetchedProfiles.forEach((profile) => { ensureOrphanageCached(profile) })
  }, [participantProfiles, ensureOrphanageCached])

  /* ───── Fetch messages ───── */
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    try {
      if (page === 1) setLoadingMessages(true)
      else setLoadingMore(true)
      const res = await chatAPI.getChatHistory(conversationId, { page, limit: 50 })
      const data = res.data?.data
      const fetched = data?.messages || []
      if (page === 1) {
        setMessages(fetched)
      } else {
        setMessages(prev => [...fetched, ...prev])
      }
      setPagination({
        hasMore: data?.pagination?.hasMore || false,
        currentPage: data?.pagination?.currentPage || page,
      })
    } catch {
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
      setLoadingMore(false)
    }
  }, [])

  /* ───── Open a conversation ───── */
  const openConversation = useCallback((conv) => {
    setActiveConversation(conv)
    setMessages([])
    setShowMobileSidebar(false)
    fetchMessages(conv._id, 1)
    // Mark as read
    chatAPI.markAsRead(conv._id).catch(() => {})
    emit('joinConversation', { conversationId: conv._id })
    emit('markAsRead', { conversationId: conv._id })
    // Update unread locally
    setConversations(prev => prev.map(c =>
      c._id === conv._id ? { ...c, unreadCount: 0 } : c
    ))
  }, [fetchMessages, emit])

  /* ───── Handle deep link: ?receiverId=x&receiverRole=y ───── */
  useEffect(() => {
    const receiverId = searchParams.get('receiverId')
    const receiverRole = searchParams.get('receiverRole')
    if (!receiverId || !receiverRole || !user) return

    const initConversation = async () => {
      try {
        const res = await chatAPI.getOrCreateConversation({ receiverId, receiverRole })
        const convData = res.data?.data
        if (convData?.conversationId) {
          // Clean URL params
          setSearchParams({}, { replace: true })
          // Build a minimal conversation object to open
          const fakeConv = {
            _id: convData.conversationId,
            otherParticipant: convData.participants?.find(
              p => p.participantId !== user._id && p.participantId !== user.id
            ) || { participantId: receiverId, role: receiverRole },
          }
          // Refresh conversations list
          await fetchConversations()
          openConversation(fakeConv)
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Cannot start this conversation')
      }
    }
    initConversation()
  }, [searchParams, user])

  /* ───── Initial load ───── */
  useEffect(() => { fetchConversations() }, [fetchConversations])

  /* ───── Socket: incoming messages ───── */
  useEffect(() => {
    on('receiveMessage', (data) => {
      const msg = data.message
      if (!msg) return
      // If it belongs to current open conversation, append
      if (activeConvRef.current?._id === msg.conversationId) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        // Mark as read immediately
        chatAPI.markAsRead(msg.conversationId).catch(() => {})
        emit('markAsRead', { conversationId: msg.conversationId })
      }
      // Update conversations list
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === msg.conversationId)
        if (idx === -1) {
          // New conversation — refetch
          fetchConversations()
          return prev
        }
        const updated = [...prev]
        const conv = { ...updated[idx] }
        conv.lastMessage = { content: msg.content, createdAt: msg.createdAt, sender: msg.sender }
        conv.updatedAt = msg.createdAt
        if (activeConvRef.current?._id !== msg.conversationId) {
          conv.unreadCount = (conv.unreadCount || 0) + 1
        }
        updated.splice(idx, 1)
        updated.unshift(conv)
        return updated
      })
    })

    on('messageSent', (data) => {
      if (!data.message) return
      setMessages(prev =>
        prev.map(m => m._id === data.message._id ? { ...m, status: data.message.status } : m)
      )
    })

    on('messagesRead', (data) => {
      if (!data.conversationId) return
      if (activeConvRef.current?._id === data.conversationId) {
        setMessages(prev => prev.map(m => {
          if (m.sender?.senderId === (user?._id || user?.id) && m.status !== 'read') {
            return { ...m, status: 'read', readAt: data.readAt }
          }
          return m
        }))
      }
    })

    on('messageDelivered', (data) => {
      setMessages(prev =>
        prev.map(m => m._id === data.messageId ? { ...m, status: 'delivered', deliveredAt: data.deliveredAt } : m)
      )
    })

    on('messageDeleted', (data) => {
      setMessages(prev => prev.filter(m => m._id !== data.messageId))
    })

    on('userOnline', (data) => {
      setOnlineUsers(prev => ({ ...prev, [data.userId]: true }))
    })

    on('userOffline', (data) => {
      setOnlineUsers(prev => ({ ...prev, [data.userId]: false }))
      setTypingUsers(prev => { const n = { ...prev }; delete n[data.userId]; return n })
    })

    on('userTyping', (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.conversationId }))
      } else {
        setTypingUsers(prev => { const n = { ...prev }; delete n[data.userId]; return n })
      }
    })

    on('conversationDeleted', (data) => {
      if (!data?.conversationId) return
      setConversations(prev => prev.filter(c => c._id !== data.conversationId))
      if (activeConvRef.current?._id === data.conversationId) {
        setMessages([])
        setActiveConversation(null)
        setShowMobileSidebar(true)
        toast.info('This conversation was deleted')
      }
    })

    return () => {
      off('receiveMessage')
      off('messageSent')
      off('messagesRead')
      off('messageDelivered')
      off('messageDeleted')
      off('userOnline')
      off('userOffline')
      off('userTyping')
      off('conversationDeleted')
    }
  }, [on, off, emit, user, fetchConversations])

  /* ───── Check online status for visible participants ───── */
  useEffect(() => {
    if (!connected || !conversations.length) return
    const ids = conversations.map(c => c.otherParticipant?.participantId).filter(Boolean).map(String)
    if (!ids.length) return
    emit('getOnlineStatus', { userIds: ids }, (res) => {
      if (res?.success) setOnlineUsers(res.onlineStatus)
    })
  }, [connected, conversations, emit])

  /* ───── Auto-scroll to bottom ───── */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  /* ───── Send message ───── */
  const handleSend = useCallback(async () => {
    if (!messageInput.trim() || !activeConversation || sending) return
    const content = messageInput.trim()
    setMessageInput('')
    setSending(true)

    const otherId = activeConversation.otherParticipant?.participantId
    const otherRole = activeConversation.otherParticipant?.role

    // Optimistic append
    const tempId = 'temp-' + Date.now()
    const optimistic = {
      _id: tempId,
      conversationId: activeConversation._id,
      sender: { senderId: user._id || user.id, role: user.role },
      receiver: { receiverId: otherId, role: otherRole },
      content,
      messageType: 'text',
      status: 'sent',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    try {
      const res = await chatAPI.sendMessage({
        receiverId: otherId,
        receiverRole: otherRole,
        content,
      })
      const serverMsg = res.data?.data
      // Replace optimistic msg
      setMessages(prev =>
        prev.map(m => m._id === tempId ? { ...m, _id: serverMsg?.messageId || tempId, status: serverMsg?.status || 'sent' } : m)
      )
      // Update conversation sidebar
      setConversations(prev => {
        const idx = prev.findIndex(c => c._id === activeConversation._id)
        if (idx === -1) return prev
        const updated = [...prev]
        const conv = { ...updated[idx] }
        conv.lastMessage = { content, createdAt: new Date().toISOString(), sender: { senderId: user._id || user.id, role: user.role } }
        conv.updatedAt = new Date().toISOString()
        updated.splice(idx, 1)
        updated.unshift(conv)
        return updated
      })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message')
      setMessages(prev => prev.filter(m => m._id !== tempId))
    } finally {
      setSending(false)
    }
  }, [messageInput, activeConversation, sending, user])

  /* ───── Typing indicator ───── */
  const handleTyping = useCallback(() => {
    if (!activeConversation) return
    const otherId = activeConversation.otherParticipant?.participantId
    emit('typing', { conversationId: activeConversation._id, receiverId: otherId })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      emit('stopTyping', { conversationId: activeConversation._id, receiverId: otherId })
    }, 2000)
  }, [activeConversation, emit])

  /* ───── Delete message ───── */
  const handleDelete = useCallback(async (messageId) => {
    try {
      await chatAPI.deleteMessage(messageId)
      setMessages(prev => prev.filter(m => m._id !== messageId))
      toast.success('Message deleted')
    } catch {
      toast.error('Failed to delete message')
    }
  }, [])

  const handleDeleteConversation = useCallback(async () => {
    if (!activeConversation) return
    const confirmation = await confirmAction({
      title: 'Delete conversation?',
      message: 'This will remove the entire conversation for all participants.',
      confirmLabel: 'Delete chat',
      cancelLabel: 'Keep chat',
      tone: 'danger',
    })
    if (!confirmation) return
    try {
      await chatAPI.deleteConversation(activeConversation._id)
      setConversations(prev => prev.filter(c => c._id !== activeConversation._id))
      setActiveConversation(null)
      setMessages([])
      setShowMobileSidebar(true)
      toast.success('Conversation deleted')
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to delete conversation'
      toast.error(message)
    }
  }, [activeConversation, confirmAction])

  /* ───── Load more (scroll up) ───── */
  const handleLoadMore = useCallback(() => {
    if (!activeConversation || loadingMore || !pagination.hasMore) return
    fetchMessages(activeConversation._id, pagination.currentPage + 1)
  }, [activeConversation, loadingMore, pagination, fetchMessages])

  /* ───── Filtered conversations ───── */
  const filterCounters = useMemo(() => {
    const counters = {
      all: conversations.length,
      unread: 0,
      admins: 0,
      online: 0,
    }
    conversations.forEach((conv) => {
      if ((conv.unreadCount || 0) > 0) counters.unread += 1
      if (conv.otherParticipant?.role === 'orphanAdmin') counters.admins += 1
      const pid = conv.otherParticipant?.participantId
      if (pid && onlineUsers[pid]) counters.online += 1
    })
    return counters
  }, [conversations, onlineUsers])

  const filtered = useMemo(() => {
    const byFilter = conversations.filter((conv) => {
      if (activeFilter === 'unread') return (conv.unreadCount || 0) > 0
      if (activeFilter === 'admins') return conv.otherParticipant?.role === 'orphanAdmin'
      if (activeFilter === 'online') {
        const pid = conv.otherParticipant?.participantId
        return pid ? Boolean(onlineUsers[pid]) : false
      }
      return true
    })

    if (!searchQuery.trim()) return byFilter
    const q = searchQuery.toLowerCase()
    return byFilter.filter(c => {
      const pid = c.otherParticipant?.participantId
      const profile = participantProfiles[pid]
      const name = (profile?.name || profile?.orphanageName || formatDisplayName(profile, c.otherParticipant?.role)).toLowerCase()
      const role = (c.otherParticipant?.role || '').toLowerCase()
      return name.includes(q) || role.includes(q)
    })
  }, [conversations, searchQuery, participantProfiles, activeFilter, onlineUsers])

  const otherProfile = useMemo(() => (
    activeConversation?.otherParticipant ? getParticipantProfile(activeConversation.otherParticipant) : null
  ), [activeConversation, getParticipantProfile])
  const otherName = useMemo(() => (
    activeConversation?.otherParticipant ? getParticipantName(activeConversation.otherParticipant) : ''
  ), [activeConversation, getParticipantName])
  const otherAvatar = useMemo(() => (
    activeConversation?.otherParticipant ? getParticipantAvatar(activeConversation.otherParticipant) : null
  ), [activeConversation, getParticipantAvatar])

  useEffect(() => {
    if (!otherProfile || otherProfile.role !== 'orphanAdmin') return
    const { orphanageId } = extractOrphanageMeta(otherProfile)
    if (!orphanageId || orphanageCache[orphanageId]) return
    let cancelled = false
    const fetchOrphanage = async () => {
      try {
        const response = await orphanagesAPI.getById(orphanageId)
        const orphanage = response.data?.orphanage
        if (!cancelled && orphanage) {
          setOrphanageCache((prev) => ({ ...prev, [orphanageId]: orphanage }))
        }
      } catch (error) {
        console.error('Failed to fetch orphanage details', error)
      }
    }
    fetchOrphanage()
    return () => { cancelled = true }
  }, [otherProfile, orphanageCache])

  const otherOrphanage = useMemo(() => {
    if (!otherProfile || otherProfile.role !== 'orphanAdmin') return null
    const meta = extractOrphanageMeta(otherProfile)
    const cached = meta.orphanageId ? orphanageCache[meta.orphanageId] : null
    const name = cached?.name || meta.orphanageName || ''
    const address = cached?.address || meta.address || null
    return {
      id: meta.orphanageId,
      name,
      address,
      location: formatOrphanageLocation(address)
    }
  }, [otherProfile, orphanageCache])

  const otherId = activeConversation?.otherParticipant?.participantId
  const isOtherOnline = otherId ? onlineUsers[otherId] : false
  const isOtherTyping = otherId ? typingUsers[otherId] === activeConversation?._id : false
  const myId = user?._id || user?.id

  return (
    <>
      <div className="min-h-screen bg-cream-50 dark:bg-dark-950">
        <Navbar />

        <div className="flex h-[calc(100vh-73px)] pt-[73px]">
        {/* ──── Sidebar ──── */}
        <aside className={`${showMobileSidebar ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-80 lg:w-96 border-r border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-900 shrink-0`}>
          {/* Header */}
          <div className="p-4 border-b border-cream-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-teal-900 dark:text-cream-50 flex items-center gap-2">
                <FaComments className="text-teal-500" />
                Messages
              </h2>
              {connected ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-500">
                  <FaCircle className="text-[6px]" /> Online
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-amber-500">
                  <FaCircle className="text-[6px]" /> Connecting...
                </span>
              )}
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-4 py-2 rounded-full border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-800 text-sm text-teal-900 dark:text-cream-100 placeholder:text-teal-400 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 text-xs" aria-label="Conversation filters">
              {CONVERSATION_FILTERS.map(({ key, label }) => {
                const isActive = activeFilter === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveFilter(key)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-semibold transition whitespace-nowrap ${
                      isActive
                        ? 'border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-200'
                        : 'border-cream-200 text-teal-500 hover:border-teal-400 dark:border-dark-700 dark:text-cream-200'
                    }`}
                  >
                    <span>{label}</span>
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-white/60 px-1 text-[10px] text-teal-600 dark:bg-dark-800/60 dark:text-cream-100">
                      {filterCounters[key] ?? 0}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-16">
                <FaSpinner className="animate-spin text-2xl text-teal-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <FaComments className="text-4xl text-cream-300 dark:text-dark-600 mb-3" />
                <p className="text-sm text-teal-500 dark:text-cream-300">
                  {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
                </p>
                {!searchQuery && user?.role !== 'orphanAdmin' && (
                  <p className="text-xs text-teal-400 dark:text-cream-400 mt-1">
                    Visit an orphanage profile to start a chat
                  </p>
                )}
              </div>
            ) : (
              filtered.map(conv => {
                const pid = conv.otherParticipant?.participantId
                const profile = participantProfiles[pid]
                const name = getParticipantName(conv.otherParticipant)
                const avatar = getParticipantAvatar(conv.otherParticipant)
                const initials = getInitialFromName(name, conv.otherParticipant?.role)
                const orphanageMeta = extractOrphanageMeta(profile)
                const orphanageRecord = orphanageMeta.orphanageId ? orphanageCache[orphanageMeta.orphanageId] : null
                const orphanageName = conv.otherParticipant?.role === 'orphanAdmin'
                  ? (orphanageRecord?.name || orphanageMeta.orphanageName)
                  : ''
                const lastMsg = conv.lastMessage
                const lastContent = lastMsg?.content || ''
                const lastTime = lastMsg?.createdAt || conv.updatedAt
                const unread = conv.unreadCount || 0
                const isActive = activeConversation?._id === conv._id
                const isOnline = pid ? onlineUsers[pid] : false

                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => openConversation(conv)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition border-b border-cream-100 dark:border-dark-800 hover:bg-cream-50 dark:hover:bg-dark-800 ${
                      isActive ? 'bg-teal-50 dark:bg-teal-900/20 border-l-4 border-l-teal-500' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        openProfileDrawer(conv.otherParticipant)
                      }}
                      className="relative shrink-0 focus:outline-none"
                    >
                      {avatar ? (
                        <img src={avatar} alt="" className="w-11 h-11 rounded-full object-cover" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-teal-400 to-coral-400 flex items-center justify-center text-white text-lg font-semibold">
                          {initials}
                        </div>
                      )}
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-dark-900" />
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-teal-900 dark:text-cream-50 truncate">{name}</span>
                        <span className="text-[10px] text-teal-400 dark:text-cream-400 shrink-0 ml-2">{formatSidebarTime(lastTime)}</span>
                      </div>
                      {orphanageName && (
                        <p className="text-[11px] text-teal-500 dark:text-cream-300 truncate">{orphanageName}</p>
                      )}
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-teal-600 dark:text-cream-300 truncate max-w-[180px]">
                          {lastMsg?.sender?.senderId === myId ? 'You: ' : ''}{lastContent || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <span className="shrink-0 ml-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-coral-500 text-white text-[10px] font-bold px-1">
                            {unread > 99 ? '99+' : unread}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-teal-400 dark:text-cream-400">{roleLabel(conv.otherParticipant?.role)}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* ──── Chat Window ──── */}
        <main className={`${showMobileSidebar ? 'hidden' : 'flex'} md:flex flex-col flex-1 bg-cream-50 dark:bg-dark-950`}>
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-100 to-coral-100 dark:from-teal-900/30 dark:to-coral-900/30 flex items-center justify-center mb-4">
                <FaComments className="text-4xl text-teal-500" />
              </div>
              <h3 className="text-xl font-semibold text-teal-900 dark:text-cream-50">SoulConnect Chat</h3>
              <p className="text-sm text-teal-500 dark:text-cream-300 mt-2 max-w-sm">
                Select a conversation from the sidebar or visit an orphanage profile to start chatting.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-900 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowMobileSidebar(true); setActiveConversation(null) }}
                  className="md:hidden text-teal-500 hover:text-teal-700 dark:text-cream-300 mr-1"
                >
                  <FaArrowLeft />
                </button>

                <button
                  type="button"
                  onClick={() => openProfileDrawer(activeConversation.otherParticipant)}
                  className="relative shrink-0 focus:outline-none"
                >
                  {otherAvatar ? (
                    <img src={otherAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-coral-400 flex items-center justify-center text-white font-semibold">
                      {getInitialFromName(otherName, activeConversation.otherParticipant?.role)}
                    </div>
                  )}
                  {isOtherOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-dark-900" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-teal-900 dark:text-cream-50 truncate">{otherName}</h3>
                  <p className="text-[11px] text-teal-500 dark:text-cream-300">
                    {isOtherTyping ? (
                      <span className="text-teal-500 dark:text-teal-400 animate-pulse">typing...</span>
                    ) : isOtherOnline ? (
                      <span className="text-emerald-500">online</span>
                    ) : (
                      roleLabel(activeConversation.otherParticipant?.role)
                    )}
                  </p>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openProfileDrawer(activeConversation.otherParticipant)}
                    className="hidden sm:inline-flex items-center gap-1 rounded-full border border-teal-200 bg-transparent px-3 py-1 text-[11px] font-semibold text-teal-700 hover:border-teal-500 dark:border-dark-600 dark:text-cream-200"
                  >
                    View profile
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteConversation}
                    className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-[11px] font-semibold text-rose-500 hover:border-rose-400 dark:border-rose-900/60 dark:text-rose-300"
                    title="Delete chat"
                  >
                    <FaTrash />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {otherOrphanage && (
                <div className="px-4 py-3 border-b border-cream-200 dark:border-dark-800 bg-cream-50/70 dark:bg-dark-900/60">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-teal-400">Administrator</p>
                        <p className="text-sm font-semibold text-teal-900 dark:text-cream-50">{otherName}</p>
                        <p className="text-xs text-teal-500 dark:text-cream-300">{roleLabel(activeConversation.otherParticipant?.role)}</p>
                      </div>
                      <div className="hidden h-10 w-px bg-cream-200 dark:bg-dark-700 sm:block" />
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.3em] text-teal-400">Orphanage</p>
                        <p className="text-sm font-semibold text-teal-900 dark:text-cream-50">{otherOrphanage.name || 'Not provided'}</p>
                        {otherOrphanage.location && (
                          <p className="text-xs text-teal-500 dark:text-cream-300">{otherOrphanage.location}</p>
                        )}
                      </div>
                    </div>
                    {otherOrphanage.id ? (
                      <Link
                        to={`/orphanages/${otherOrphanage.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500"
                      >
                        View Orphanage Profile
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openProfileDrawer(activeConversation.otherParticipant)}
                        className="inline-flex items-center justify-center rounded-full border border-teal-400 px-4 py-2 text-xs font-semibold text-teal-600 dark:text-cream-50"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {/* Load more */}
                {pagination.hasMore && (
                  <div className="text-center py-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="text-xs text-teal-500 hover:text-teal-700 dark:text-cream-300 transition"
                    >
                      {loadingMore ? <FaSpinner className="animate-spin inline mr-1" /> : null}
                      {loadingMore ? 'Loading...' : 'Load older messages'}
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="flex items-center justify-center py-16">
                    <FaSpinner className="animate-spin text-2xl text-teal-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FaSmile className="text-3xl text-cream-300 dark:text-dark-600 mb-2" />
                    <p className="text-sm text-teal-400 dark:text-cream-400">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = (msg.sender?.senderId || msg.sender?.senderId) === myId
                    const prevMsg = messages[idx - 1]
                    const showDate = !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString()

                    return (
                      <div key={msg._id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 rounded-full bg-cream-200 dark:bg-dark-700 text-[10px] text-teal-600 dark:text-cream-300 font-medium">
                              {new Date(msg.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1 group`}>
                          <div className={`relative max-w-[75%] sm:max-w-[65%] ${
                            isMine
                              ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl rounded-br-md'
                              : 'bg-white dark:bg-dark-800 text-teal-900 dark:text-cream-100 rounded-2xl rounded-bl-md border border-cream-200 dark:border-dark-700'
                          } px-4 py-2.5 shadow-sm`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-teal-400 dark:text-cream-400'}`}>
                                {formatTime(msg.sentAt || msg.createdAt)}
                              </span>
                              {isMine && <StatusIcon status={msg.status} />}
                            </div>
                            {/* Delete button for own messages */}
                            {isMine && !msg._id.startsWith?.('temp-') && (
                              <button
                                type="button"
                                onClick={() => handleDelete(msg._id)}
                                className="absolute -left-8 top-1/2 -translate-y-1/2 hidden group-hover:block text-rose-400 hover:text-rose-500 text-xs transition"
                                title="Delete message"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="shrink-0 px-4 py-3 border-t border-cream-200 dark:border-dark-700 bg-white dark:bg-dark-900">
                <div className="flex items-end gap-2">
                  <textarea
                    value={messageInput}
                    onChange={e => { setMessageInput(e.target.value); handleTyping() }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none rounded-2xl border border-cream-200 dark:border-dark-600 bg-cream-50 dark:bg-dark-800 px-4 py-2.5 text-sm text-teal-900 dark:text-cream-100 placeholder:text-teal-400 focus:outline-none focus:border-teal-400 max-h-32"
                    style={{ minHeight: '42px' }}
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!messageInput.trim() || sending}
                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? <FaSpinner className="animate-spin text-sm" /> : <FaPaperPlane className="text-sm" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
        </div>
      </div>

      {profileDrawer.open && profileDrawer.user && (
        <ProfileDrawer
          profile={profileDrawer.user}
          orphanage={profileDrawer.orphanage}
          loading={profileLoading}
          onClose={closeProfileDrawer}
          viewer={user}
        />
      )}
    </>
  )
}

export default Chat

const ProfileDrawer = ({ profile, orphanage, loading, onClose, viewer }) => {
  if (!profile) return null

  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDarkMode = theme === 'dark'

  const name = formatDisplayName(profile, profile.role)
  const avatar = profile.profileUrl || profile.avatar || null
  const roleText = roleLabel(profile.role)
  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null
  const participantId = profile._id || profile.id
  const canViewFullProfile = viewer?.role === 'orphanAdmin' && ['user', 'volunteer'].includes(profile.role) && participantId

  const contactRows = [
    { label: 'Email', value: profile.email, icon: FaEnvelope },
    { label: 'Phone', value: profile.phone, icon: FaPhone },
    { label: 'Username', value: profile.username, icon: FaUserCircle },
  ].filter((row) => Boolean(row.value))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 py-8 backdrop-blur-sm dark:bg-black/70 sm:items-center">
      <div className="relative w-full max-w-md rounded-2xl border border-cream-200 bg-white p-6 shadow-xl dark:border-dark-700 dark:bg-dark-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-teal-400 hover:text-teal-600 dark:text-cream-300"
          aria-label="Close profile panel"
        >
          <FaTimes />
        </button>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-teal-500/20 text-2xl font-semibold text-teal-900 dark:text-white">
            {avatar ? (
              <img src={avatar} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">{getInitialFromName(name, profile.role)}</div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-teal-900 dark:text-cream-50">{name}</h3>
          <p className="text-sm text-teal-500 dark:text-cream-300">{roleText}</p>
          {joined && <p className="text-xs text-slate-500 dark:text-cream-400">Member since {joined}</p>}

          {canViewFullProfile && (
            <button
              type="button"
              onClick={() => {
                if (!participantId) return
                onClose?.()
                navigate(`/participants/${participantId}`)
              }}
              className="mt-2 w-full rounded-lg border border-coral-400 px-4 py-2 text-sm font-medium text-coral-500 hover:bg-coral-50 dark:border-coral-500 dark:text-coral-200 dark:hover:bg-coral-500/10"
            >
              Open full profile
            </button>
          )}
        </div>

        <div className="mt-6 space-y-4 text-sm">
          {loading && (
            <div className="flex items-center gap-2 text-teal-500">
              <FaSpinner className="animate-spin" /> Loading profile details...
            </div>
          )}

          {contactRows.map((row) => {
            const Icon = row.icon
            return (
              <div key={row.label} className="flex items-center gap-3 rounded-lg border border-cream-200 px-3 py-2 dark:border-dark-700">
                <Icon className="text-teal-400" />
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{row.label}</p>
                  <p className="break-all font-medium text-teal-900 dark:text-cream-100">{row.value}</p>
                </div>
              </div>
            )
          })}

          {profile.address && (profile.address.city || profile.address.state) && (
            <div className="flex items-center gap-3 rounded-lg border border-cream-200 px-3 py-2 dark:border-dark-700">
              <FaMapMarkerAlt className="text-coral-400" />
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</p>
                <p className="font-medium text-teal-900 dark:text-cream-100">
                  {[profile.address.city, profile.address.state, profile.address.country].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          {profile.role === 'orphanAdmin' && orphanage && (
            <div className="rounded-lg border border-cream-200 px-4 py-3 text-sm dark:border-dark-700">
              <div className="flex items-center gap-3 text-teal-900 dark:text-cream-100">
                <FaIdCard className="text-teal-500" />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Orphanage</p>
                  <p className="font-semibold">{orphanage.name}</p>
                </div>
              </div>
              <p className="mt-2 text-slate-600 dark:text-cream-300">
                {(orphanage.address && [orphanage.address.city, orphanage.address.state].filter(Boolean).join(', ')) || 'No address provided'}
              </p>
              {orphanage._id || orphanage.id ? (
                <Link
                  to={`/orphanages/${orphanage._id || orphanage.id}`}
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500"
                  onClick={onClose}
                >
                  View Orphanage Profile
                </Link>
              ) : (
                <button
                  type="button"
                  className="mt-3 inline-flex items-center justify-center rounded-full border border-teal-400 px-4 py-2 text-xs font-semibold text-teal-600 dark:text-cream-50"
                  onClick={onClose}
                >
                  View Orphanage Details
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
