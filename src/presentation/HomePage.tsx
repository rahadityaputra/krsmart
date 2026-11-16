import { useState } from 'react'
import type { Plan } from '../business/types/plan.types'
import { Dialog, ErrorText } from './components'
import { CreatePlanForm } from './components/CreatePlanForm'
import { DeleteButton } from './components/DeleteButton'
import { ExportPlanDialog, ImportPlanDialog } from './components/PlanFileDialogs'
import type { Plans } from './hooks/usePlans'
import type { DataSources } from './hooks/useDataSources'

export function HomePage({ plansDomain, dataSources, onCreate }: {
  plansDomain: Plans; dataSources: DataSources
  onCreate: (id: string) => void
}) {
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState<Plan | null>(null)
  const [deleting, setDeleting] = useState<Plan | null>(null)
  const [query, setQuery] = useState('')
  const plans = plansDomain.plans.filter((plan) => plan.name.toLowerCase().includes(query.trim().toLowerCase()))

  if (creating) return <CreatePlanForm plansDomain={plansDomain} dataSources={dataSources} onClose={() => { setCreating(false) }} onCreate={(id) => {
    setCreating(false)
    onCreate(id)
  }} />

  return <>
    <header className="page-heading">
      <div><h1>Rencana KRS</h1><p>Buat rencana dari sumber jadwal kampus atau buka rencana yang sudah tersimpan untuk memilih kelas.</p></div>
      <div className="button-row">
        <button type="button" className="secondary" onClick={() => { setImporting(true) }}>Impor rencana</button>
        <button type="button" className="primary" disabled={!dataSources.sources.length}
          onClick={() => { setCreating(true) }}>Buat rencana</button>
      </div>
    </header>
    {!dataSources.sources.length && <p className="notice">Untuk membuat rencana, tambahkan jadwal kampus di <a href="#/data">Data Jadwal</a>.</p>}
    <section className="plans-section" aria-labelledby="plans-title">
      <div className="section-heading">
        <h2 id="plans-title">Rencana tersimpan <span className="count">{plansDomain.plans.length}</span></h2>
        <label className="search"><span className="sr-only">Cari rencana</span><input type="search" placeholder="Cari rencana…" value={query} onChange={(event) => { setQuery(event.target.value); }} /></label>
      </div>
      <div className="paper">
        {plans.map((plan) => <div className="plan-row" key={plan.id}>
          <div>
            <a className="plan-link" href={`#/plan/${plan.id}`}>{plan.name}</a>
            <small>{dataSources.sources.find((source) => source.id === plan.datasourceId)?.name ?? 'Sumber belum tersedia'} · {plan.data?.choosed.length ?? 0} jadwal dipilih</small>
          </div>
          <div className="button-row">
            <button type="button" className="secondary" aria-label={`Ekspor rencana ${plan.name}`}
              onClick={() => { setExporting(plan) }}>Ekspor</button>
            <DeleteButton label={`Hapus rencana ${plan.name}`} onClick={() => { setDeleting(plan) }} />
          </div>
        </div>)}
        {!plansDomain.plans.length && <div className="empty">
          <strong>Belum ada rencana.</strong>
          {dataSources.sources.length > 0 && <p>Pilih sumber jadwal untuk membuat rencana pertama.</p>}
        </div>}
        {plansDomain.plans.length > 0 && !plans.length && <p className="empty">
          Tidak ada rencana yang cocok. <button className="quiet" onClick={() => { setQuery(''); }}>Hapus pencarian</button>
        </p>}
      </div>
    </section>
    {importing && <ImportPlanDialog onClose={() => { setImporting(false) }} />}
    {exporting && <ExportPlanDialog plan={exporting} onClose={() => { setExporting(null) }} />}
    {deleting && <DeletePlanDialog plan={deleting} onDelete={plansDomain.deletePlan} onClose={() => { setDeleting(null); }} />}
  </>
}

function DeletePlanDialog({ plan, onDelete, onClose }: {
  plan: Plan
  onDelete: (id: string) => void
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
          onDelete(plan.id)
          onClose()
        } catch (problem) {
          setError((problem as Error).message)
        }
      }}>Hapus rencana</button>
    </footer>
  </Dialog>
}
