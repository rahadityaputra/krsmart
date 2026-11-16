import { useState } from 'react'
import { CatalogTable, Dialog, ErrorText } from './components'
import type { DataSources } from './hooks/useDataSources'

export function CatalogPage({ dataSources }: { dataSources: DataSources }) {
  const [selected, setSelected] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [name, setName] = useState('')
  const [raw, setRaw] = useState('')
  const [preview, setPreview] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const source = dataSources.source(selected || dataSources.sources[0]?.id || '')
  const courses = preview ? dataSources.preview(raw) : []
  function open() {
    setName('')
    setRaw('')
    setPreview(false)
    setError('')
    setAdding(true)
  }
  return <>
    <header className="page-heading"><div><h1>Data Jadwal</h1><p>Impor jadwal dosen dari web kampus. Pilih sumber data untuk melihat mata kuliah, kelas, dan jamnya.</p></div><button className="primary" onClick={open}>＋ Tambah sumber data</button></header>
    {source ? <section className="paper source-panel">
      <div className="section-heading">
        <label>Sumber data<select value={source.id} onChange={(event) => { setSelected(event.target.value); setQuery('') }}>{dataSources.sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <button className="quiet danger-text" onClick={() => { setError(''); setRemoving(true) }}>Hapus sumber</button>
      </div>
      <div className="section-heading"><p>{source.schedules.length} kelas · {new Set(source.schedules.map((course) => course.course.code)).size} mata kuliah</p>
        <label>Cari di sumber ini<input type="search" value={query} placeholder="Mata kuliah, kode, atau dosen" onChange={(event) => { setQuery(event.target.value); }} /></label>
      </div>
      {source.schedules.length > 0
        ? <CatalogTable courses={source.schedules.filter((course) => `${course.course.name} ${course.course.code} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))} />
        : <p className="notice">Daftar kelas sumber ini tidak tersedia. Impor ulang teks jadwal sebagai sumber baru.</p>}
      {query && source.schedules.length > 0 && !source.schedules.some((course) => `${course.course.name} ${course.course.code} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())) && <p className="empty">Pencarian tidak menemukan kelas.</p>}
    </section> : <div className="paper empty"><strong>Belum ada sumber data.</strong><p>Tambahkan file teks atau tempel jadwal dari web kampus.</p></div>}
    {adding && <Dialog title="Tambah sumber data" wide onClose={() => { setAdding(false); }}>
      <form onSubmit={(event) => {
        event.preventDefault()
        try {
          if (!courses.length) throw new Error('Tinjau jadwal yang valid sebelum menyimpan.')
          const saved = dataSources.saveSource(name, raw)
          setSelected(saved.id); setQuery(''); setAdding(false)
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
        <footer className="actions"><button type="button" className="secondary" onClick={() => { setAdding(false); }}>Batal</button><button className="primary" disabled={!name.trim() || !courses.length}>Simpan sumber data</button></footer>
      </form>
    </Dialog>}
    {removing && source && <Dialog title="Hapus sumber data?" onClose={() => { setRemoving(false); }}>
      <p>Sumber <strong>{source.name}</strong> akan dihapus dari browser ini.</p><ErrorText message={error} />
      <footer className="actions"><button className="secondary" onClick={() => { setRemoving(false); }}>Batal</button>
        <button className="danger" onClick={() => { try { dataSources.deleteSource(source.id); setSelected(''); setRemoving(false) } catch (problem) { setError((problem as Error).message) } }}>Hapus sumber</button></footer>
    </Dialog>}
  </>
}

export function TransferPage() {
  return <>
    <header className="page-heading"><div><h1>Impor / Ekspor</h1><p>Tempat bertukar file rencana KRS dan jadwal dosen.</p></div></header>
    <section className="paper transfer-import">
      <h2>File berbagi .krs</h2><p>Impor dan ekspor rencana KRS serta katalog jadwal dosen segera hadir.</p>
      <a href="#/data">Impor teks jadwal kampus di Data Jadwal</a>
    </section>
  </>
}
