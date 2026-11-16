import { useState } from 'react'
import type { Plan } from '../business/types/plan.types'
import { Dialog, ErrorText } from './components'
import { CreatePlanForm } from './components/CreatePlanForm'
import type { Workspace } from './hooks/useWorkspace'

export function HomePage({ workspace, onCreate }: {
  workspace: Workspace
  onCreate: (id: string, codes: string[]) => void
}) {
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Plan | null>(null)
  const [query, setQuery] = useState('')
  const plans = workspace.plans.filter((plan) => plan.name.toLowerCase().includes(query.trim().toLowerCase()))

  if (creating) return <CreatePlanForm workspace={workspace} onClose={() => setCreating(false)} onCreate={(id, codes) => {
    setCreating(false)
    onCreate(id, codes)
  }} />

  return <>
    <header className="page-heading">
      <div><h1>Rencana KRS</h1><p>Susun jadwal kuliah dan siapkan rencana cadangan.</p></div>
      {workspace.sources.length
        ? <button className="primary" onClick={() => setCreating(true)}>Tambah rencana</button>
        : <a className="primary action-link" href="#/data">Tambah sumber data</a>}
    </header>
    <section className="plans-section" aria-labelledby="plans-title">
      <div className="section-heading">
        <h2 id="plans-title">Rencana tersimpan <span className="count">{workspace.plans.length}</span></h2>
        <label className="search"><span className="sr-only">Cari rencana</span><input type="search" placeholder="Cari rencana…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      </div>
      <div className="paper">
        {plans.map((plan) => <div className="plan-row" key={plan.id}>
          <div>
            <a className="plan-link" href={`#/plan/${plan.id}`}>{plan.name}</a>
            <small>{workspace.sources.find((source) => source.id === plan.datasourceId)?.name ?? 'Sumber belum tersedia'} · {plan.data?.choosed.length ?? 0} jadwal dipilih</small>
          </div>
          <button className="quiet danger-text" onClick={() => setDeleting(plan)}>Hapus<span className="sr-only"> {plan.name}</span></button>
        </div>)}
        {!workspace.plans.length && <div className="empty">
          <strong>Belum ada rencana.</strong>
          <p>{workspace.sources.length ? 'Pilih sumber jadwal untuk membuat rencana pertama.' : 'Tambahkan jadwal kampus di Data Jadwal untuk mulai membuat rencana.'}</p>
        </div>}
        {workspace.plans.length > 0 && !plans.length && <p className="empty">
          Tidak ada rencana yang cocok. <button className="quiet" onClick={() => setQuery('')}>Hapus pencarian</button>
        </p>}
      </div>
    </section>
    {deleting && <DeletePlanDialog plan={deleting} workspace={workspace} onClose={() => setDeleting(null)} />}
  </>
}

function DeletePlanDialog({ plan, workspace, onClose }: {
  plan: Plan
  workspace: Workspace
  onClose: () => void
}) {
  const [error, setError] = useState('')
  return <Dialog title="Hapus rencana?" onClose={onClose}>
    <p>Rencana <strong>{plan.name}</strong> akan dihapus dari browser ini.</p>
    <ErrorText message={error} />
    <footer className="actions">
      <button className="secondary" onClick={onClose}>Batal</button>
      <button className="danger" onClick={() => {
        try {
          workspace.deletePlan(plan.id)
          onClose()
        } catch (problem) {
          setError((problem as Error).message)
        }
      }}>Hapus rencana</button>
    </footer>
  </Dialog>
}
