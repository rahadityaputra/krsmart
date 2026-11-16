import { useState } from 'react'
import { Calendar, Dialog, ErrorText } from './components'
import { DeleteButton } from './components/DeleteButton'
import { credits } from './components/schedule-utils'
import type { Plans } from './hooks/usePlans'
import type { DataSources } from './hooks/useDataSources'
import type { Comparisons } from './hooks/useComparisons'

export function ComparisonsPage({ plansDomain, dataSources, comparisons, viewId }: { plansDomain: Plans; dataSources: DataSources; comparisons: Comparisons; viewId?: string }) {
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const view = viewId ? comparisons.view(viewId) : null

  if (viewId) return <>
    <a className="back" href="#/compare">‹ Bandingkan Jadwal</a>
    <header className="page-heading"><h1>{view?.name ?? 'Perbandingan tidak ditemukan'}</h1></header>
    {view && !view.plans.length && <p>Semua rencana dalam perbandingan ini sudah dihapus.</p>}
    {view?.plans.map((plan) => {
      const source = dataSources.source(plan.datasourceId ?? '')
      const classes = source?.schedules.filter((course) => plan.data?.choosed.includes(course.id)) ?? []
      return <section className="plans-section" key={plan.id} aria-labelledby={`comparison-${plan.id}`}>
        <div className="section-heading">
          <h2 id={`comparison-${plan.id}`}><a href={`#/plan/${plan.id}`}>{plan.name}</a></h2>
          <small>{source ? `${credits(classes)} SKS` : 'Sumber jadwal tidak tersedia'}</small>
        </div>
        {!classes.length && <p className="notice">Belum ada kelas yang bisa ditampilkan.</p>}
        {source && <Calendar courses={classes} />}
      </section>
    })}
  </>

  if (creating) return <CreateComparisonForm plans={plansDomain.plans} onCreate={comparisons.createView} onClose={() => { setCreating(false); }} />

  return <>
    <header className="page-heading">
      <div><h1>Bandingkan Jadwal</h1><p>Pilih minimal dua rencana tersimpan untuk melihat kalender mereka dari atas ke bawah.</p></div>
      <button className="primary" disabled={plansDomain.plans.length < 2} onClick={() => { setCreating(true); }}>Buat perbandingan</button>
    </header>
    {plansDomain.plans.length < 2 && <p className="notice">Buat minimal dua rencana di <a href="#/">Beranda</a> untuk membandingkannya.</p>}
    <div className="paper">
      {!comparisons.views.length && <p className="empty">Belum ada perbandingan tersimpan.</p>}
      {comparisons.views.map((item) => <div className="plan-row" key={item.id}>
        <a className="plan-link" href={`#/compare/${item.id}`}>{item.name}</a>
        <DeleteButton label={`Hapus perbandingan ${item.name}`} onClick={() => {
          setDeleteError('')
          setDeleting(item)
        }} />
      </div>)}
    </div>
    {deleting && <Dialog title="Hapus perbandingan?" onClose={() => { setDeleting(null); }}>
      <p>Perbandingan <strong>{deleting.name}</strong> akan dihapus dari daftar.</p>
      <ErrorText message={deleteError} />
      <footer className="actions">
        <button type="button" className="secondary" onClick={() => { setDeleting(null); }}>Batal</button>
        <button type="button" className="danger" onClick={() => {
          try {
            comparisons.deleteView(deleting.id)
            setDeleting(null)
          } catch (problem) {
            setDeleteError((problem as Error).message)
          }
        }}>Hapus perbandingan</button>
      </footer>
    </Dialog>}
  </>
}

function CreateComparisonForm({ plans, onCreate, onClose }: {
  plans: Plans['plans']
  onCreate: Comparisons['createView']
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [ids, setIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const visiblePlans = plans.filter((plan) => plan.name.toLowerCase().includes(query.trim().toLowerCase()))
  const canCreate = Boolean(name.trim() && ids.length >= 2)

  return <>
    <button type="button" className="quiet back" onClick={onClose}>‹ Bandingkan Jadwal</button>
    <header className="page-heading"><h1>Buat perbandingan</h1></header>
    <form className="paper selection-form" onSubmit={(event) => {
      event.preventDefault()
      if (!canCreate) return
      try {
        const view = onCreate(name, ids)
        onClose()
        location.hash = `/compare/${view.id}`
      } catch (problem) {
        setError((problem as Error).message)
      }
    }}>
      <label>Nama perbandingan<input required maxLength={80} value={name} onChange={(event) => { setName(event.target.value); }} /></label>
      <fieldset>
        <legend>Pilih minimal dua rencana</legend>
        <p>{ids.length} rencana dipilih</p>
        <label>Cari rencana<input type="search" value={query} placeholder="Nama rencana"
          onChange={(event) => { setQuery(event.target.value); }} /></label>
        <div className="subject-list">{visiblePlans.map((plan) => <label className="subject-row" key={plan.id}>
          <input type="checkbox" checked={ids.includes(plan.id)} onChange={(event) => { setIds(event.target.checked ? [...ids, plan.id] : ids.filter((id) => id !== plan.id)); }} />
          <span>{plan.name}</span><small>{plan.data?.choosed.length ?? 0} kelas</small>
        </label>)}</div>
        {!visiblePlans.length && <p>Tidak ada rencana yang cocok.</p>}
      </fieldset>
      <ErrorText message={error} />
      <footer className="actions">
        <button type="button" className="secondary" onClick={onClose}>Batal</button>
        <button className="primary" disabled={!canCreate}>Buat perbandingan</button>
      </footer>
    </form>
  </>
}
