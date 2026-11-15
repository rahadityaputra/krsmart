import { useState } from 'react'
import { ErrorText } from '../components'
import type { Workspace } from '../hooks/useWorkspace'
import { SubjectPicker } from './SubjectPicker'

export function CreatePlanForm({ workspace, onClose, onCreate }: {
  workspace: Workspace
  onClose: () => void
  onCreate: (id: string, codes: string[]) => void
}) {
  const [name, setName] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [codes, setCodes] = useState<string[]>([])
  const [error, setError] = useState('')
  const source = workspace.source(sourceId)
  const canCreate = Boolean(name.trim() && source && codes.length)

  return <>
    <button type="button" className="quiet back" onClick={onClose}>‹ Rencana KRS</button>
    <header className="page-heading"><h1>Tambah rencana</h1></header>
    <form className="paper selection-form" onSubmit={(event) => {
      event.preventDefault()
      if (!canCreate) return
      try {
        const plan = workspace.createPlan(name, sourceId)
        onCreate(plan.id, codes)
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
      {source && <SubjectPicker key={sourceId} courses={source.subjects} codes={codes} onChange={setCodes} />}
      {codes.length > 0 && <p>Daftar mata kuliah yang belum dijadwalkan tersedia selama halaman aplikasi ini tetap terbuka.</p>}
      <ErrorText message={error} />
      <footer className="actions">
        <button type="button" className="secondary" onClick={onClose}>Batal</button>
        <button className="primary" disabled={!canCreate}>Buat rencana</button>
      </footer>
    </form>
  </>
}
