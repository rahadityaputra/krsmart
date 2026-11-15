import { useState } from 'react'
import { Calendar, ErrorText, credits } from './components'
import type { Workspace } from './hooks/useWorkspace'

export function ComparisonsPage({ workspace, viewId }: { workspace: Workspace; viewId?: string }) {
  const [creating, setCreating] = useState(false)
  const view = viewId ? workspace.view(viewId) : null

  if (viewId) return <>
    <a className="back" href="#/compare">‹ Bandingkan Jadwal</a>
    <header className="page-heading"><h1>{view?.name ?? 'Perbandingan tidak ditemukan'}</h1></header>
    {view && !view.plans.length && <p>Semua rencana dalam perbandingan ini sudah dihapus.</p>}
    {view?.plans.map((plan) => {
      const source = workspace.source(plan.datasourceId ?? '')
      const classes = source?.subjects.filter((course) => plan.data?.choosed.includes(course.id)) ?? []
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

  if (creating) return <CreateComparisonForm workspace={workspace} onClose={() => setCreating(false)} />

  return <>
    <header className="page-heading">
      <div><h1>Bandingkan Jadwal</h1><p>Lihat kalender beberapa rencana dalam satu halaman.</p></div>
      <button className="primary" disabled={workspace.plans.length < 2} onClick={() => setCreating(true)}>Buat perbandingan</button>
    </header>
    {workspace.plans.length < 2 && <p className="notice">Buat minimal dua rencana di <a href="#/">Beranda</a> untuk membandingkannya.</p>}
    <div className="paper">
      {!workspace.views.length && <p className="empty">Belum ada perbandingan tersimpan.</p>}
      {workspace.views.map((item) => <div className="plan-row" key={item.id}>
        <a className="plan-link" href={`#/compare/${item.id}`}>{item.name}</a>
      </div>)}
    </div>
  </>
}

function CreateComparisonForm({ workspace, onClose }: { workspace: Workspace; onClose: () => void }) {
  const [name, setName] = useState('')
  const [ids, setIds] = useState<string[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const plans = workspace.plans.filter((plan) => plan.name.toLowerCase().includes(query.trim().toLowerCase()))
  const canCreate = Boolean(name.trim() && ids.length >= 2)

  return <>
    <button type="button" className="quiet back" onClick={onClose}>‹ Bandingkan Jadwal</button>
    <header className="page-heading"><h1>Buat perbandingan</h1></header>
    <form className="paper selection-form" onSubmit={(event) => {
      event.preventDefault()
      if (!canCreate) return
      try {
        const view = workspace.createView(name, ids)
        onClose()
        location.hash = `/compare/${view.id}`
      } catch (problem) {
        setError((problem as Error).message)
      }
    }}>
      <label>Nama perbandingan<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <fieldset>
        <legend>Pilih minimal dua rencana</legend>
        <p>{ids.length} rencana dipilih</p>
        <label>Cari rencana<input type="search" value={query} placeholder="Nama rencana"
          onChange={(event) => setQuery(event.target.value)} /></label>
        <div className="subject-list">{plans.map((plan) => <label className="subject-row" key={plan.id}>
          <input type="checkbox" checked={ids.includes(plan.id)} onChange={(event) =>
            setIds(event.target.checked ? [...ids, plan.id] : ids.filter((id) => id !== plan.id))} />
          <span>{plan.name}</span><small>{plan.data?.choosed.length ?? 0} kelas</small>
        </label>)}</div>
        {!plans.length && <p>Tidak ada rencana yang cocok.</p>}
      </fieldset>
      <ErrorText message={error} />
      <footer className="actions">
        <button type="button" className="secondary" onClick={onClose}>Batal</button>
        <button className="primary" disabled={!canCreate}>Buat perbandingan</button>
      </footer>
    </form>
  </>
}
