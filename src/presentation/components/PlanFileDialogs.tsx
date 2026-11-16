import { useState } from 'react'
import type { Plan } from '../../business/types/plan.types'
import { Dialog, ErrorText } from '../components'

export function ImportPlanDialog({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  return <Dialog title="Impor rencana" onClose={onClose}>
    <div className="plan-file-fields">
      <label>Pilih satu file .krs
        <input type="file" accept=".krs" onChange={(event) => {
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
      <ErrorText message={error} />
      {file && <p role="status">File dipilih: <strong>{file.name}</strong></p>}
      <p id="plan-import-status">Penyimpanan rencana dari file masih dalam pengembangan.</p>
    </div>
    <footer className="actions">
      <button type="button" className="secondary" onClick={onClose}>Tutup</button>
      <button type="button" className="primary" disabled aria-describedby="plan-import-status">Impor rencana</button>
    </footer>
  </Dialog>
}

export function ExportPlanDialog({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  return <Dialog title="Ekspor rencana" onClose={onClose}>
    <div className="plan-file-fields">
      <div><strong>{plan.name}</strong><p>{plan.data?.choosed.length ?? 0} kelas terjadwal · Format .krs</p></div>
      <p id="plan-export-status">Unduhan file rencana masih dalam pengembangan.</p>
    </div>
    <footer className="actions">
      <button type="button" className="secondary" onClick={onClose}>Tutup</button>
      <button type="button" className="primary" disabled aria-describedby="plan-export-status">Unduh .krs</button>
    </footer>
  </Dialog>
}
