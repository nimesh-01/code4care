import { FaImage, FaPenFancy, FaShareAlt } from 'react-icons/fa'
import { useAdminDashboardContext } from './AdminLayout'

const statusBadge = (status) => {
  switch (status) {
    case 'published':
      return 'bg-emerald-500/20 text-emerald-100'
    case 'draft':
      return 'bg-slate-500/20 text-slate-200'
    default:
      return 'bg-white/10 text-white'
  }
}

const PostsUpdates = () => {
  const { data } = useAdminDashboardContext()

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Updates</p>
          <h2 className="text-3xl font-semibold text-white">Stories & impact posts</h2>
          <p className="text-sm text-slate-400">Share verified updates with donors, volunteers, and the SoulConnect community.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300">
            <FaImage /> Media library
          </button>
          <button className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-pink-900/30">
            <FaPenFancy /> Compose update
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.posts?.map((post) => (
          <article key={post.id} className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{post.id}</p>
            <h3 className="mt-3 text-xl font-semibold text-white">{post.title}</h3>
            <p className="text-sm text-slate-400">{new Date(post.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(post.status)}`}>{post.status}</span>
              <span className="text-xs text-slate-500">Engagement • {post.engagement}</span>
            </div>
            <div className="mt-6 flex items-center gap-3 text-xs">
              <button className="rounded-full border border-white/10 px-3 py-1 text-slate-300">Edit</button>
              <button className="rounded-full border border-white/10 px-3 py-1 text-slate-300">Preview</button>
              <button className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-cyan-200">
                <FaShareAlt /> Publish
              </button>
            </div>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-white/5 bg-slate-900/40 p-6">
        <h3 className="text-2xl font-semibold text-white">Content governance</h3>
        <p className="mt-2 text-sm text-slate-400">
          Draft mode lets you collaborate with your team, attach documents, and route content for approval before publishing to donors.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-sm text-slate-300">
          <li>Always pair posts with photos, receipts, or progress updates.</li>
          <li>Mark sensitive updates for internal use only.</li>
          <li>Auto-share highlights with subscribed donors for transparency.</li>
        </ul>
      </section>
    </div>
  )
}

export default PostsUpdates
