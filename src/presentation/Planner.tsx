import { useState } from 'react'
import type { Course } from '../business/types/course.types'
import type { Plan } from '../business/types/plan.types'
import { Calendar, Dialog, ErrorText, credits, time } from './components'
import type { Workspace } from './hooks/useWorkspace'

const classTabs = [
  { id: 'selected', label: 'Kelas terpilih' },
  { id: 'available', label: 'Pilih kelas' },
  { id: 'blocked', label: 'Kelas bentrok' },
] as const

export function Planner({ plan, workspace }: { plan: Plan; workspace: Workspace }) {
  const source = workspace.source(plan.datasourceId ?? '')
  const courses = source?.subjects ?? []
  const [editing, setEditing] = useState(!plan.data?.choosed.length)
  const [codes, setCodes] = useState(() => [...new Set(courses.filter((course) => plan.data?.choosed.includes(course.id)).map((course) => course.code))])
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState('')
  const [error, setError] = useState('')
  const [ai, setAi] = useState(false)
  const [classTab, setClassTab] = useState<(typeof classTabs)[number]['id']>('available')
  const selected = courses.filter((course) => plan.data?.choosed.includes(course.id))
  const subjects = [...new Map(courses.map((course) => [course.code, course])).values()].sort((a, b) => a.name.localeCompare(b.name, 'id'))
  const choices = courses.filter((course) => codes.includes(course.code))
  const availability = workspace.availability(choices, selected.map((course) => course.id))
  const matches = (course: Course) => `${course.name} ${course.code} ${course.className} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
  const ready = choices.filter((course) => availability.available.includes(course.id) && matches(course))
  const blocked = choices.filter((course) => availability.unavailable.some((option) => option.id === course.id && option.reason.some((reason) => reason.startsWith('Bentrok'))) && !selected.some((item) => item.code === course.code) && matches(course))
  const classCounts = { selected: selected.filter(matches).length, available: ready.length, blocked: blocked.length }
  const tabCourses = classTab === 'selected' ? selected.filter(matches) : classTab === 'available' ? ready : blocked
  const emptyMessage = {
    selected: 'Belum ada kelas pada rencana ini.',
    available: 'Tidak ada kelas tambahan yang bisa dipilih.',
    blocked: 'Belum ada bentrok pada pilihan ini.',
  }
  function act(action: () => void) {
    setError('')
    try { action() } catch (problem) { setError((problem as Error).message) }
  }
  function pick(course: Course, remove = false) {
    act(() => workspace.pick(plan.id, course.id, remove))
  }
  if (!source) return <div className="empty paper"><h1>{plan.name}</h1><p>Sumber jadwal untuk rencana ini tidak tersedia.</p><a href="#/">Kembali ke rencana KRS</a></div>

  return <div className="planner">
    <a className="back" href="#/">‹ Rencana KRS</a>
    <header className="page-heading"><div><h1>{plan.name}</h1><p>{source.name}</p></div>
      <div className="button-row">
        <button className="secondary" onClick={() => act(() => {
          const next = workspace.duplicatePlan(plan.id)
          location.hash = `/plan/${next.id}`
        })}>Duplikasi</button>
      </div>
    </header>
    <ErrorText message={error} />
    {editing ? <section className="paper select-subjects">
      <div className="section-heading"><div><h2>Pilih mata kuliah</h2><p>{codes.length} mata kuliah dipilih · {credits(subjects.filter((course) => codes.includes(course.code)))} SKS</p></div>
        <button className="primary" disabled={!codes.length} onClick={() => act(() => {
          setQuery(''); setEditing(false); setClassTab('available')
        })}>Lanjut pilih kelas</button></div>
      <label><span className="sr-only">Cari mata kuliah</span><input type="search" value={query} placeholder="Cari nama atau kode mata kuliah…" onChange={(event) => setQuery(event.target.value)} /></label>
      <div className="subject-list">{subjects.filter(matches).map((course) => <label className="subject-row" key={course.code}>
        <input type="checkbox" checked={codes.includes(course.code)} disabled={selected.some((item) => item.code === course.code)}
          onChange={(event) => setCodes(event.target.checked ? [...codes, course.code] : codes.filter((code) => code !== course.code))} />
        <span>{course.name}</span><small>{course.credits} SKS</small>
      </label>)}</div>
      {!subjects.some(matches) && <p>Nama atau kode ini tidak ditemukan dalam katalog.</p>}
    </section> : <>
      <div className="planner-toolbar paper">
        <div><strong>{credits(selected)} SKS</strong><span>{selected.length} / {codes.length} mata kuliah terjadwal</span></div>
        <label className="limit">Batas SKS<input type="number" min="1" max="99" value={limit} placeholder="Opsional" onChange={(event) => setLimit(event.target.value)} /></label>
        <div className="button-row"><button className="secondary" onClick={() => { setQuery(''); setEditing(true) }}>Ubah mata kuliah</button>
          <button className="secondary" onClick={() => setAi(true)}>Asisten AI</button></div>
      </div>
      {limit && credits(selected) > Number(limit) && <p className="notice" role="status">Total melebihi batas {limit} SKS.</p>}
        <section className="calendar-panel" aria-labelledby="calendar-title">
          <div className="section-heading"><h2 id="calendar-title">Kalender mingguan</h2><small>Perubahan tersimpan otomatis</small></div>
          {!selected.length && <p className="notice">Pilih kelas untuk mengisi kalender.</p>}
          <Calendar courses={selected} onRemove={(course) => pick(course, true)} />
        </section>
        <section className="class-section" aria-label="Daftar kelas">
          <div className="class-tabs" role="tablist" aria-label="Status kelas">
            {classTabs.map(({ id, label }, index) => <button key={id} type="button" role="tab"
              id={`class-tab-${id}`} aria-controls={`class-panel-${id}`}
              aria-selected={classTab === id} tabIndex={classTab === id ? 0 : -1}
              onClick={() => setClassTab(id)}
              onKeyDown={(event) => {
                const last = classTabs.length - 1
                const next = { ArrowRight: (index + 1) % classTabs.length, ArrowLeft: (index + last) % classTabs.length, Home: 0, End: last }
                if (!Object.hasOwn(next, event.key)) return
                event.preventDefault()
                const tab = classTabs[next[event.key as keyof typeof next]]
                setClassTab(tab.id)
                document.getElementById(`class-tab-${tab.id}`)?.focus()
              }}>
              {label} <span className="count">{classCounts[id]}</span>
            </button>)}
          </div>
          {classTabs.map(({ id }) => <div key={id} className="class-panel paper" role="tabpanel"
            id={`class-panel-${id}`} aria-labelledby={`class-tab-${id}`} hidden={classTab !== id}>
            {classTab === id && <>
              <label className="class-search"><span className="sr-only">Cari kelas</span><input type="search" value={query} placeholder="Cari mata kuliah atau dosen…" onChange={(event) => setQuery(event.target.value)} /></label>
              {!tabCourses.length && <p className="empty">{query.trim() ? 'Tidak ada kelas yang cocok dengan pencarian.' : emptyMessage[id]}</p>}
              {tabCourses.map((course) => <div className="class-option" key={course.id}>
                <div><strong>{course.name}</strong><small>{course.className} · {course.credits} SKS</small></div>
                <div><span>{course.schedule.day} {time(course)}</span><small>{course.classRoom}</small></div>
                <div className="class-lecturers">{course.lecturers.map((name) => <small key={name}>{name}</small>)}</div>
                {id === 'blocked'
                  ? <small className="danger-text class-reason">{availability.unavailable.find((entry) => entry.id === course.id)?.reason.join(' · ')}</small>
                  : <button className={id === 'selected' ? 'quiet danger-text' : 'secondary'} onClick={() => pick(course, id === 'selected')}>
                    {id === 'selected' ? 'Batal pilih' : 'Pilih kelas'}<span className="sr-only"> {course.name} {course.className}</span>
                  </button>}
              </div>)}
            </>}
          </div>)}
        </section>
    </>}
    {ai && <Dialog title="Asisten jadwal" onClose={() => setAi(false)}>
      <p>Penjadwalan berdasarkan preferensi melalui Supabase segera hadir.</p>
      <footer className="actions"><button className="secondary" onClick={() => setAi(false)}>Tutup</button></footer>
    </Dialog>}
  </div>
}

