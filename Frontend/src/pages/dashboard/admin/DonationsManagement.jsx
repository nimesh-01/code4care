import { useCallback, useEffect, useMemo, useState } from 'react'
import { FaDownload, FaSearch, FaRegChartBar, FaFileExport } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'
import { donationAPI } from '../../../services/api'
import { toast } from 'react-toastify'

const DonationRow = ({ donation, onDownloadReceipt, downloading }) => {
  const status = donation.status || 'pending'
  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
  const badgeClass = status === 'success'
    ? 'bg-emerald-500/20 text-emerald-200'
    : status === 'pending'
      ? 'bg-amber-500/20 text-amber-100'
      : 'bg-rose-500/20 text-rose-100'
  const parsedDate = donation.date ? new Date(donation.date) : null
  const displayDate = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('en-IN')
    : '—'
  const amountValue = Number(donation.amount || 0)

  return (
    <tr className="hover:bg-white/5">
      <td className="py-4 text-white">{donation.donorName}</td>
      <td className="text-slate-300">₹{amountValue.toLocaleString('en-IN')}</td>
      <td className="text-slate-400">{donation.purpose}</td>
      <td className="text-slate-400">{displayDate}</td>
      <td>
        <span className={`rounded-full px-3 py-1 text-xs ${badgeClass}`}>
          {statusLabel}
        </span>
      </td>
      <td className="text-right text-slate-300">
        {status === 'success' ? (
          <button
            onClick={() => onDownloadReceipt(donation)}
            disabled={downloading}
            className={`inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold ${
              downloading ? 'text-slate-500 cursor-not-allowed' : 'text-emerald-200 hover:border-emerald-400'
            }`}
          >
            <FaDownload className={downloading ? 'animate-spin' : ''} />
            {downloading ? 'Preparing…' : 'Download'}
          </button>
        ) : (
          '—'
        )}
        {donation.receiptNumber && (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{donation.receiptNumber}</p>
        )}
      </td>
    </tr>
  )
}

const DonationsManagement = () => {
  const { data, metrics, orphanage } = useAdminDashboardContext()
  const [purposeFilter, setPurposeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [liveDonations, setLiveDonations] = useState(null)
  const [donationError, setDonationError] = useState(null)
  const [loadingDonations, setLoadingDonations] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const [downloadingDonationId, setDownloadingDonationId] = useState(null)
  const [exportingReport, setExportingReport] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [purposeFilter, statusFilter])

  const buildFilterParams = useCallback(() => {
    const params = {}
    if (purposeFilter !== 'all') params.purpose = purposeFilter
    if (statusFilter !== 'all') params.status = statusFilter
    return params
  }, [purposeFilter, statusFilter])

  useEffect(() => {
    if (!orphanage) return

    let isMounted = true
    const fetchDonations = async () => {
      try {
        setLoadingDonations(true)
        setDonationError(null)
        const params = { limit: PAGE_SIZE, page, ...buildFilterParams() }
        const response = await donationAPI.getOrphanageDonations(orphanage, params)
        if (!isMounted) return
        setLiveDonations(response.data?.data || null)
      } catch (err) {
        if (!isMounted) return
        setDonationError('Unable to fetch live donations. Showing cached snapshot.')
      } finally {
        if (isMounted) setLoadingDonations(false)
      }
    }

    fetchDonations()
    return () => {
      isMounted = false
    }
  }, [orphanage, page, buildFilterParams])

  const donationPayload = liveDonations || {
    donations: data.donations,
    stats: data.donationStats,
    pagination: data.donationPagination,
  }

  const pagination = donationPayload?.pagination
  const totalPages = pagination?.totalPages || 1
  const currentPage = pagination?.currentPage || page
  const statusOptions = ['all', 'success', 'pending', 'failed']

  const saveBlobToFile = async (axiosResponse, fileName, fallbackMessage) => {
    const contentType = axiosResponse.headers?.['content-type'] || ''
    const blob = axiosResponse.data
    if (contentType.includes('application/json')) {
      const text = await blob.text()
      const payload = JSON.parse(text)
      throw new Error(payload?.message || fallbackMessage)
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleDownloadReceipt = async (donation) => {
    try {
      setDownloadingDonationId(donation.id)
      const response = await donationAPI.downloadReceipt(donation.id)
      const fileName = `SoulConnect-${donation.receiptNumber || donation.id}.pdf`
      await saveBlobToFile(response, fileName, 'Unable to download receipt')
      toast.success('Receipt downloaded')
    } catch (err) {
      const message = err?.message || 'Unable to download receipt'
      toast.error(message)
    } finally {
      setDownloadingDonationId(null)
    }
  }

  const handleExportReport = async () => {
    if (!orphanage) return
    try {
      setExportingReport(true)
      const response = await donationAPI.exportOrphanageDonations(orphanage, buildFilterParams())
      const fileName = `SoulConnect-Donations-${new Date().toISOString().split('T')[0]}.csv`
      await saveBlobToFile(response, fileName, 'Unable to export report')
      toast.success('Donation report exported')
    } catch (err) {
      const message = err?.message || 'Unable to export report'
      toast.error(message)
    } finally {
      setExportingReport(false)
    }
  }


  const childLookup = useMemo(() => {
    const map = new Map()
    ;(data.children || []).forEach((child) => {
      const key = child._id || child.id || child.childId
      if (!key) return
      const compositeName = [
        child.fullname?.firstname,
        child.fullname?.lastname,
      ].filter(Boolean).join(' ')
      const fallbackName = [child.firstName, child.lastName].filter(Boolean).join(' ')
      const name = child.name || child.fullname?.name || compositeName || fallbackName || child.fullname || 'Child'
      map.set(String(key), name)
    })
    return map
  }, [data.children])

  const normalizedDonations = useMemo(() => {
    const source = donationPayload?.donations || []
    return source.map((donation, idx) => {
      const id = donation._id || donation.id || donation.donationId || donation.payment?.orderId || `donation-${idx}`
      const donorName = donation.donorDetails?.name || donation.donorName || 'Anonymous Supporter'
      const childRef = typeof donation.childId === 'object'
        ? donation.childId?._id || donation.childId?.id
        : donation.childId
      const childName = childRef
        ? childLookup.get(String(childRef)) || donation.childId?.name || donation.childName || '—'
        : '—'
      const purpose = donation.purpose || 'General'
      const date = donation.createdAt || donation.date || donation.updatedAt || null
      const status = donation.status || donation.paymentStatus || 'pending'

      return {
        ...donation,
        id,
        donorName,
        childName,
        purpose,
        date,
        status,
      }
    })
  }, [donationPayload, childLookup])

  const filteredDonations = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    return normalizedDonations.filter((donation) => {
      const matchesPurpose = purposeFilter === 'all' || donation.purpose === purposeFilter
      if (!matchesPurpose) return false
      const matchesStatus = statusFilter === 'all' || donation.status === statusFilter
      if (!matchesStatus) return false
      if (!searchValue) return true
      return donation.donorName.toLowerCase().includes(searchValue)
    })
  }, [normalizedDonations, purposeFilter, statusFilter, search])

  const donationStats = donationPayload?.stats || {}
  const totalImpact = typeof donationStats.totalAmount === 'number' ? donationStats.totalAmount : metrics.totalDonations
  const donationCount = typeof donationStats.totalDonations === 'number'
    ? donationStats.totalDonations
    : metrics.donationCount ?? normalizedDonations.length
  const averageDonation = donationCount ? Math.round(totalImpact / donationCount) : 0
  const pendingReceipts = normalizedDonations.filter((item) => item.status !== 'success').length

  const purposeOptions = useMemo(() => {
    const dynamic = (donationStats.purposeBreakdown || [])
      .map((entry) => entry._id)
      .filter(Boolean)
    const defaults = ['Education', 'Food', 'Healthcare', 'Clothing', 'Shelter', 'Emergency Help', 'other']
    const unique = Array.from(new Set([...dynamic, ...defaults]))
    return ['all', ...unique]
  }, [donationStats])

  const topDonors = useMemo(() => {
    const donorTotals = {}
    filteredDonations.forEach((donation) => {
      donorTotals[donation.donorName] = (donorTotals[donation.donorName] || 0) + (donation.amount || 0)
    })
    return Object.entries(donorTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [filteredDonations])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Donations</p>
          <h2 className="text-3xl font-semibold text-white">Funding intelligence</h2>
          <p className="text-sm text-slate-400">Monitor incoming donations, download receipts, and export reports for compliance.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportReport}
            disabled={exportingReport || loadingDonations}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 ${
              exportingReport || loadingDonations
                ? 'bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
            }`}
          >
            <FaFileExport className={exportingReport ? 'animate-spin' : ''} />
            {exportingReport ? 'Exporting…' : 'Export report'}
          </button>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Total impact</p>
          <p className="mt-2 text-3xl font-semibold text-white">₹{totalImpact.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500">All time</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Monthly inflow</p>
          <p className="mt-2 text-3xl font-semibold text-white">₹{metrics.monthlyDonations.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500">Current month</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Avg. donation</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            ₹{averageDonation.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-slate-500">Per donor</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pending receipts</p>
          <p className="mt-2 text-3xl font-semibold text-white">{pendingReceipts}</p>
          <p className="text-xs text-slate-500">Require follow-up</p>
        </div>
      </section>

      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        {(loadingDonations || donationError) && (
          <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
            loadingDonations
              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          }`}>
            {loadingDonations ? 'Syncing latest donation entries…' : donationError}
          </div>
        )}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-slate-950/40 px-4 py-2">
            <FaSearch className="text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search donors or campaigns"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {purposeOptions.map((purpose) => {
              const label = purpose === 'all'
                ? 'All'
                : purpose === 'other'
                  ? 'Other'
                  : purpose
              return (
                <button
                  key={purpose}
                  onClick={() => setPurposeFilter(purpose)}
                  className={`rounded-full px-4 py-2 text-xs ${
                    purposeFilter === purpose ? 'bg-emerald-500/20 text-emerald-200' : 'text-slate-500'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-xs ${
                  statusFilter === status ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-500'
                }`}
              >
                {status === 'all' ? 'All statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="text-xs uppercase tracking-[0.3em] text-slate-500">
                <th className="pb-4">Donor</th>
                <th className="pb-4">Amount</th>
                <th className="pb-4">Purpose</th>
                <th className="pb-4">Date</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDonations.map((donation) => (
                <DonationRow
                  key={donation.id}
                  donation={donation}
                  onDownloadReceipt={handleDownloadReceipt}
                  downloading={downloadingDonationId === donation.id}
                />
              ))}
            </tbody>
          </table>
          {!filteredDonations.length && (
            <p className="py-10 text-center text-sm text-slate-500">No donations match your filters yet.</p>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <p>
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1 || loadingDonations}
              className={`rounded-full px-4 py-2 ${
                currentPage <= 1 || loadingDonations
                  ? 'cursor-not-allowed border border-white/10 text-slate-600'
                  : 'border border-white/30 text-white hover:border-emerald-400'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => prev + 1)}
              disabled={currentPage >= totalPages || loadingDonations}
              className={`rounded-full px-4 py-2 ${
                currentPage >= totalPages || loadingDonations
                  ? 'cursor-not-allowed border border-white/10 text-slate-600'
                  : 'border border-white/30 text-white hover:border-emerald-400'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Top supporters</p>
              <h3 className="text-2xl font-semibold text-white">Donor leaderboard</h3>
            </div>
            <FaRegChartBar className="text-3xl text-cyan-400" />
          </div>
          <ul className="mt-6 space-y-4">
            {topDonors.map((donor, index) => (
              <li key={donor.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">#{index + 1}</span>
                  <p className="font-medium text-white">{donor.name}</p>
                </div>
                <p className="font-semibold text-emerald-300">₹{donor.total.toLocaleString('en-IN')}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Compliance</p>
          <h3 className="text-2xl font-semibold text-white">Audit-ready checklist</h3>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
            <li>Attach receipts for donations above ₹10,000.</li>
            <li>Tag every donation with a purpose and beneficiary program.</li>
            <li>Export monthly CSV/PDF statements for statutory audits.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default DonationsManagement
