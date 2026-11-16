import { useState } from 'react'
import { CatalogTable, Dialog, ErrorText } from '../components'
import type { DataSources } from '../hooks/useDataSources'

export function ImportScheduleDialog({ dataSources, onClose, onSaved }: {
  dataSources: DataSources
  onClose: () => void
  onSaved: (id: string) => void
}) {
  const [name, setName] = useState('')
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')
  const courses = preview ? dataSources.preview(raw) : []

  return <Dialog title="Impor jadwal kampus" size={courses.length > 0 ? 'table' : 'wide'} onClose={onClose}>
      <form onSubmit={(event) => {
        event.preventDefault()
        try {
          if (!courses.length) throw new Error('Tinjau jadwal yang valid sebelum menyimpan.')
          const saved = dataSources.saveSource(name, raw)
          onSaved(saved.id)
        } catch (problem) { setError((problem as Error).message) }
      }}>
        <label>Nama sumber data<input required maxLength={100} value={name} placeholder="Contoh: Informatika Semester 5" onChange={(event) => { setName(event.target.value); }} /></label>
        <fieldset className="source-fields">
        <legend>Masukkan jadwal kampus</legend>
        <p>Unggah file .txt atau tempel teks jadwal, lalu tinjau hasilnya sebelum disimpan.</p>
        <label>File jadwal kampus (.txt)<input type="file" accept=".txt,text/plain" onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          try { if (file.size > 2_000_000) throw new Error('Ukuran file maksimum 2 MB.'); setRaw(await file.text()); setPreview(false); setError('') } catch (problem) { setError((problem as Error).message) }
        }} /></label>
        <label>Teks jadwal<textarea rows={5} value={raw} placeholder="Tempel baris jadwal dari web kampus." onChange={(event) => { setRaw(event.target.value); setPreview(false) }} /></label>
        <div className="button-row">
          <button type="button" className="secondary" disabled={!raw.trim()} onClick={() => { setPreview(true); setError(dataSources.preview(raw).length ? '' : 'Format jadwal belum terbaca. Periksa kolom dan jam pada teks.') }}>Tinjau jadwal</button>
        </div>
        {courses.length > 0 && <><p className="meta">{courses.length} kelas terbaca</p><CatalogTable courses={courses} /></>}
        </fieldset>
        <ErrorText message={error} />
        <footer className="actions"><button type="button" className="secondary" onClick={onClose}>Batal</button><button className="primary" disabled={!name.trim() || !courses.length}>Simpan sumber data</button></footer>
      </form>
    </Dialog>
}
