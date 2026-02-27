import { useState } from 'react'
import { FaSave, FaUpload, FaShieldAlt } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'

const SettingsPanel = () => {
  const { data } = useAdminDashboardContext()
  const [form, setForm] = useState({
    name: data.orphanageProfile?.name || '',
    city: data.orphanageProfile?.city || '',
    state: data.orphanageProfile?.state || '',
    contactEmail: data.orphanageProfile?.contactEmail || '',
    phone: data.orphanageProfile?.phone || '',
  })

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Settings</p>
        <h2 className="text-3xl font-semibold text-white">Orphanage control center</h2>
        <p className="text-sm text-slate-400">Update legal information, upload compliance documents, and manage secure access.</p>
      </header>

      <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <h3 className="text-xl font-semibold text-white">Profile information</h3>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {['name', 'city', 'state', 'contactEmail', 'phone'].map((field) => (
            <div key={field} className="space-y-2">
              <label className="text-sm text-slate-400 capitalize">{field}</label>
              <input
                value={form[field]}
                onChange={(e) => updateField(field, e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
        <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white">
          <FaSave /> Save changes
        </button>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaUpload className="text-3xl text-cyan-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Compliance docs</p>
              <h3 className="text-xl font-semibold text-white">Document vault</h3>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {['Registration certificate', 'Government license', 'Financial audit'].map((doc) => (
              <div key={doc} className="flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-300">
                <span>{doc}</span>
                <button className="text-xs text-cyan-300">Upload</button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-3xl text-emerald-300" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Security</p>
              <h3 className="text-xl font-semibold text-white">Access policies</h3>
            </div>
          </div>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
            <li>Rotate admin passwords every 90 days.</li>
            <li>Enable 2FA for all finance-facing accounts.</li>
            <li>Keep orphanage status and verification proof updated.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

export default SettingsPanel
