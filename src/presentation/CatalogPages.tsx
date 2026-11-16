import { useState } from 'react'
import { CatalogTable, Dialog, ErrorText } from './components'
import { ImportScheduleDialog } from './components/ImportScheduleDialog'
import { DeleteButton } from './components/DeleteButton'
import type { DataSources } from './hooks/useDataSources'

export function CatalogPage({ dataSources }: { dataSources: DataSources }) {
  const [selected, setSelected] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const source = dataSources.source(selected || dataSources.sources[0]?.id || '')
  return <>
    <header className="page-heading"><div><h1>Data Jadwal</h1><p>Impor jadwal dosen dari web kampus. Pilih sumber data untuk melihat mata kuliah, kelas, dan jamnya.</p></div><button className="primary" onClick={() => { setAdding(true) }}>＋ Tambah sumber data</button></header>
    {source ? <section className="paper source-panel">
      <div className="section-heading">
        <label>Sumber data<select value={source.id} onChange={(event) => { setSelected(event.target.value); setQuery('') }}>{dataSources.sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <DeleteButton label={`Hapus sumber ${source.name}`} onClick={() => { setError(''); setRemoving(true) }} />
      </div>
      <div className="section-heading"><p>{source.schedules.length} kelas · {new Set(source.schedules.map((course) => course.course.code)).size} mata kuliah</p>
        <label>Cari di sumber ini<input type="search" value={query} placeholder="Mata kuliah, kode, atau dosen" onChange={(event) => { setQuery(event.target.value); }} /></label>
      </div>
      {source.schedules.length > 0
        ? <CatalogTable courses={source.schedules.filter((course) => `${course.course.name} ${course.course.code} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))} />
        : <p className="notice">Daftar kelas sumber ini tidak tersedia. Impor ulang teks jadwal sebagai sumber baru.</p>}
      {query && source.schedules.length > 0 && !source.schedules.some((course) => `${course.course.name} ${course.course.code} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())) && <p className="empty">Pencarian tidak menemukan kelas.</p>}
    </section> : <div className="paper empty"><strong>Belum ada sumber data.</strong><p>Tambahkan file teks atau tempel jadwal dari web kampus.</p></div>}
    {adding && <ImportScheduleDialog dataSources={dataSources} onClose={() => { setAdding(false) }}
      onSaved={(id) => { setSelected(id); setQuery(''); setAdding(false) }} />}
    {removing && source && <Dialog title="Hapus sumber data?" onClose={() => { setRemoving(false); }}>
      <p>Sumber <strong>{source.name}</strong> akan dihapus dari browser ini.</p><ErrorText message={error} />
      <footer className="actions"><button className="secondary" onClick={() => { setRemoving(false); }}>Batal</button>
        <button className="danger" onClick={() => { try { dataSources.deleteSource(source.id); setSelected(''); setRemoving(false) } catch (problem) { setError((problem as Error).message) } }}>Hapus sumber</button></footer>
    </Dialog>}
  </>
}
