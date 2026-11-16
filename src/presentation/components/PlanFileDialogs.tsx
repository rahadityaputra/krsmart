import { useState } from 'react'
import type { Plan } from '../../business/types/plan.types'
import { Dialog, ErrorText } from '../components'
import type { Plans } from '../hooks/usePlans'

export function ImportPlanDialog({ sources, onPreview, onImport, onClose }: {
  sources: { id: string; name: string }[]
  onPreview: Plans['previewImport']
  onImport: Plans['saveImportedPlan']
  onClose: () => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [sourceId, setSourceId] = useState('')
  const [preview, setPreview] = useState<Awaited<ReturnType<Plans['previewImport']>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function review() {
    if (!file || !sourceId || loading) return
    setLoading(true)
    setError('')
    try {
      setPreview(await onPreview(file, sourceId))
    } catch (problem) {
      setError(problem instanceof TypeError ? 'Struktur file .krs tidak valid.' : (problem as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return <Dialog title="Impor rencana" onClose={() => { if (!loading) onClose() }}>
    <form onSubmit={(event) => {
      event.preventDefault()
      if (!preview) {
        void review()
        return
      }
      try {
        onImport(preview.plan)
        onClose()
      } catch (problem) {
        setError((problem as Error).message)
      }
    }}>
      <label>Pilih satu file .krs
        <input type="file" accept=".krs" disabled={loading} onChange={(event) => {
          setPreview(null)
          const input = event.currentTarget
          const selected = input.files?.item(0) ?? null
          if (selected && !/\.krs$/i.test(selected.name)) {
            input.value = ''
            setFile(null)
            setError('Pilih file dengan ekstensi .krs.')
            return
          }
          setFile(selected)
          setError('')
        }} />
      </label>
      <label>Sumber jadwal tujuan
        <select value={sourceId} disabled={loading || !sources.length} onChange={(event) => {
          setSourceId(event.target.value)
          setPreview(null)
          setError('')
        }}>
          <option value="">Pilih sumber jadwal</option>
          {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
        </select>
      </label>
      {!sources.length && <p>Tambahkan sumber jadwal di <a href="#/data" onClick={onClose}>Data Jadwal</a> sebelum mengimpor rencana.</p>}
      <ErrorText message={error} />
      {preview && <section className="plan-file-fields" aria-label="Pratinjau impor">
        <div><strong>{preview.plan.name}</strong><p>{preview.plan.data?.choosed.length ?? 0} kelas ditemukan di sumber tujuan.</p></div>
        {preview.warnings.length > 0 && <ul className="notice">{preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>}
        {preview.missing.length > 0 && <details>
          <summary>Kelas yang dilewati</summary>
          <ul>{preview.missing.map((item, index) => <li key={`${item.code}-${item.className}-${index}`}>{item.name} · {item.className}</li>)}</ul>
        </details>}
      </section>}
      <footer className="actions">
        <button type="button" className="secondary" disabled={loading} onClick={onClose}>Batal</button>
        <button type="submit" className="primary" disabled={loading || !file || !sourceId}>
          {loading ? 'Membaca file…' : preview ? 'Simpan rencana' : 'Tinjau impor'}
        </button>
      </footer>
    </form>
  </Dialog>
}

export function ExportPlanDialog({ plan, onDownload, onClose }: {
  plan: Plan
  onDownload: Plans['downloadPlan']
  onClose: () => void
}) {
  const [error, setError] = useState('')
  return <Dialog title="Ekspor rencana" onClose={onClose}>
    <div className="plan-file-fields">
      <div><strong>{plan.name}</strong><p>{plan.data?.choosed.length ?? 0} kelas terjadwal · Format .krs</p></div>
      <ErrorText message={error} />
    </div>
    <footer className="actions">
      <button type="button" className="secondary" onClick={onClose}>Tutup</button>
      <button type="button" className="primary" onClick={() => {
        try {
          onDownload(plan)
          onClose()
        } catch (problem) {
          setError((problem as Error).message)
        }
      }}>Unduh .krs</button>
    </footer>
  </Dialog>
}
