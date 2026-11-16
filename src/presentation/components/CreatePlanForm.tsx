import { useState } from 'react'
import { ErrorText } from '../components'
import type { Workspace } from '../hooks/useWorkspace'
import { SubjectPicker } from './SubjectPicker'

export function CreatePlanForm({ workspace, onClose, onCreate }: {
  workspace: Workspace
  onClose: () => void
  onCreate: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const source = workspace.source(sourceId)
  const canCreate = Boolean(name.trim() && source?.schedules.length && codes.length)

  return <>
    <button type="button" className="quiet back" onClick={onClose}>‹ Rencana KRS</button>
    <header className="page-heading"><div><h1>Tambah rencana</h1><p>Beri nama, pilih sumber jadwal, lalu centang mata kuliah yang ingin diambil.</p></div></header>
    <form className="paper selection-form" onSubmit={(event) => {
      event.preventDefault()
      if (!canCreate) return
      try {
        const plan = workspace.createPlan(name, sourceId, codes)
        onCreate(plan.id)
      } catch (problem) {
        setError((problem as Error).message)
      }
    }}>
      <div className="selection-fields">
      <label>Nama rencana<input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Sumber data<select required value={sourceId} onChange={(event) => {
        setSourceId(event.target.value)
        setCodes([])
      }}>
        <option value="" disabled>Pilih sumber data</option>
        {workspace.sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select></label>
      </div>
      {source && (source.schedules.length
        ? <SubjectPicker key={sourceId} courses={source.schedules.map((schedule) => schedule.course)} codes={codes} onChange={setCodes} />
        : <p className="notice">Sumber ini tidak memuat kelas. Pilih sumber lain atau impor ulang jadwal di <a href="#/data">Data Jadwal</a>.</p>)}
      <ErrorText message={error} />
      <footer className="actions">
        <button type="button" className="secondary" onClick={onClose}>Batal</button>
        <button className="primary" disabled={!canCreate}>Buat rencana</button>
      </footer>
    </form>
  </>
}
