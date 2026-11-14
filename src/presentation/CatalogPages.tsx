import { useState } from 'react'
import { CatalogTable, Dialog, ErrorText } from './components'
import type { Workspace } from './hooks/useWorkspace'

export function CatalogPage({ workspace }: { workspace: Workspace }) {
  const [selected, setSelected] = useState('')
  const [editor, setEditor] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [name, setName] = useState('')
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const source = workspace.source(selected || workspace.sources[0]?.id || '')
  const courses = preview ? workspace.preview(raw) : []
  function open() {
    setName('')
    setRaw('')
    setPreview(false)
    setError('')
    setEditor(true)
  }
  return <>
    <header className="page-heading"><div><h1>Data Jadwal</h1><p>Kelola sumber jadwal dosen untuk rencana KRS.</p></div><button className="primary" onClick={open}>＋ Tambah sumber data</button></header>
    {source ? <section className="paper source-panel">
      <div className="section-heading">
        <label>Sumber data<select value={source.id} onChange={(event) => { setSelected(event.target.value); setQuery('') }}>{workspace.sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="button-row"><small>Edit sumber · segera hadir</small><button className="quiet danger-text" onClick={() => { setError(''); setRemoving(true) }}>Hapus</button></div>
      </div>
      <div className="section-heading"><p>{source.subjectCount} kelas · {new Set(source.subjects.map((course) => course.code)).size} mata kuliah</p>
        <label><span className="sr-only">Cari dalam jadwal dosen</span><input type="search" value={query} placeholder="Cari mata kuliah…" onChange={(event) => setQuery(event.target.value)} /></label>
      </div>
      <CatalogTable courses={source.subjects.filter((course) => `${course.name} ${course.code} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))} />
      {query && !source.subjects.some((course) => `${course.name} ${course.code} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())) && <p className="empty">Pencarian tidak menemukan kelas.</p>}
    </section> : <div className="paper empty"><strong>Belum ada sumber data.</strong><p>Tambahkan file teks atau tempel jadwal dari web kampus.</p><button className="secondary" onClick={open}>Tambah jadwal dosen</button></div>}
    {editor && <Dialog title="Tambah sumber data" wide onClose={() => setEditor(false)}>
      <form onSubmit={(event) => {
        event.preventDefault()
        try {
          if (!preview || !courses.length) throw new Error('Tinjau jadwal yang valid sebelum menyimpan.')
          const saved = workspace.saveSource(name, raw)
          setSelected(saved.id); setQuery(''); setEditor(false)
        } catch (problem) { setError((problem as Error).message) }
      }}>
        <label>Nama sumber data<input required maxLength={100} value={name} placeholder="Contoh: Informatika Semester 5" onChange={(event) => setName(event.target.value)} /></label>
        <label>File jadwal kampus (.txt)<input type="file" accept=".txt,text/plain" onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) return
          try { if (file.size > 2_000_000) throw new Error('Ukuran file maksimum 2 MB.'); setRaw(await file.text()); setPreview(false); setError('') } catch (problem) { setError((problem as Error).message) }
        }} /></label>
        <label>Teks jadwal<textarea rows={5} value={raw} placeholder="Tempel baris jadwal dari web kampus." onChange={(event) => { setRaw(event.target.value); setPreview(false) }} /></label>
        <div className="button-row">
          <button type="button" className="secondary" onClick={() => { setPreview(true); setError(workspace.preview(raw).length ? '' : 'Format jadwal belum terbaca. Periksa kolom dan jam pada teks.') }}>Tinjau jadwal</button>
        </div>
        {courses.length > 0 && <><p className="meta">{courses.length} kelas terbaca</p><CatalogTable courses={courses} /></>}
        <ErrorText message={error} />
        <footer className="actions"><button type="button" className="secondary" onClick={() => setEditor(false)}>Batal</button><button className="primary">Simpan sumber data</button></footer>
      </form>
    </Dialog>}
    {removing && source && <Dialog title="Hapus sumber data?" onClose={() => setRemoving(false)}>
      <p>Sumber <strong>{source.name}</strong> akan dihapus dari browser ini.</p><ErrorText message={error} />
      <footer className="actions"><button className="secondary" onClick={() => setRemoving(false)}>Batal</button>
        <button className="danger" onClick={() => { try { workspace.deleteSource(source.id); setSelected(''); setRemoving(false) } catch (problem) { setError((problem as Error).message) } }}>Hapus sumber</button></footer>
    </Dialog>}
  </>
}

export function TransferPage() {
  return <>
    <header className="page-heading"><div><h1>Impor / Ekspor</h1><p>File rencana KRS dan jadwal dosen.</p></div></header>
    <section className="paper transfer-import">
      <h2>File berbagi .krs</h2><p>Impor dan ekspor rencana KRS serta katalog jadwal dosen segera hadir.</p>
      <a href="#/data">Impor teks jadwal kampus di Data Jadwal</a>
    </section>
  </>
}
