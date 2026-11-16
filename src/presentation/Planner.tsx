import { useState } from 'react'
import type { Schedule } from '../business/types/scedule.types'
import type { Plan } from '../business/types/plan.types'
import { Calendar, ErrorText } from './components'
import { credits, days, time } from './components/schedule-utils'
import type { Workspace } from './hooks/useWorkspace'
import { SubjectPicker } from './components/SubjectPicker'
import { ScheduleAssistant } from './components/ScheduleAssistant'

const classTabs = [
  { id: 'selected', label: 'Kelas terpilih' },
  { id: 'available', label: 'Pilih kelas' },
  { id: 'blocked', label: 'Kelas bentrok' },
] as const

type GroupBy = 'none' | 'lecturer' | 'subject' | 'day'

function groupClasses(courses: Schedule[], groupBy: GroupBy) {
  if (groupBy === 'none') return [{ key: '', title: '', courses }]

  const groups = new Map<string, { key: string; title: string; courses: Schedule[] }>()
  for (const course of courses) {
    const names = [...new Set(course.lecturers.map((name) => name.trim()).filter(Boolean))]
    const labels = groupBy === 'lecturer'
      ? (names.length ? names : ['Dosen belum tercantum']).map((name) => [name, name])
      : groupBy === 'subject'
        ? [[course.course.code, `${course.course.name} · ${course.course.code}`]]
        : [[course.day, course.day]]

    for (const [key, title] of labels) {
      const group = groups.get(key) ?? { key, title, courses: [] }
      group.courses.push(course)
      groups.set(key, group)
    }
  }

  const dayOrder = new Map(days.map((day, index) => [day, index]))
  return [...groups.values()].sort((a, b) => {
    if (groupBy === 'day') {
      return (dayOrder.get(a.key) ?? days.length) - (dayOrder.get(b.key) ?? days.length)
    }
    return a.title.localeCompare(b.title, 'id', { numeric: true })
  })
}

export function Planner({ plan, workspace }: {
  plan: Plan
  workspace: Workspace
}) {
  const source = workspace.source(plan.datasourceId ?? '')
  const courses = source?.schedules ?? []
  const [editing, setEditing] = useState(!plan.choosedCourses?.length && !plan.data?.choosed.length)
  const codes = [...new Set([
    ...(plan.choosedCourses ?? []),
    ...courses.filter((course) => plan.data?.choosed.includes(course.id)).map((course) => course.course.code),
  ])]
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState('')
  const [error, setError] = useState('')
  const [ai, setAi] = useState(false)
  const [classTab, setClassTab] = useState<(typeof classTabs)[number]['id']>('available')
  const [groupBy, setGroupBy] = useState<GroupBy>('none')
  const selected = courses.filter((course) => plan.data?.choosed.includes(course.id))
  const choices = courses.filter((course) => codes.includes(course.course.code))
  const availability = workspace.availability(choices, selected.map((course) => course.id))
  const matches = (course: Schedule) => `${course.course.name} ${course.course.code} ${course.className} ${course.day} ${course.lecturers.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())
  const ready = choices.filter((course) => availability.available.includes(course.id) && matches(course))
  const blocked = choices.filter((course) => availability.unavailable.some((option) => option.id === course.id && option.reason.some((reason) => reason.startsWith('Bentrok'))) && !selected.some((item) => item.course.code === course.course.code) && matches(course))
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
  function pick(course: Schedule, remove = false) {
    act(() => {
      workspace.pick(plan.id, course.id, remove)
      if (remove) workspace.updatePlanCourses(plan.id, codes)
    })
  }
  if (!source) return <div className="empty paper"><h1>{plan.name}</h1><p>Sumber jadwal untuk rencana ini tidak tersedia.</p><a href="#/">Kembali ke rencana KRS</a></div>
  if (!courses.length) return <div className="empty paper"><h1>{plan.name}</h1><p>Daftar kelas sumber ini tidak tersedia. Impor ulang jadwal dan buat rencana dari sumber baru.</p><a href="#/data">Buka Data Jadwal</a></div>

  return <div className="planner">
    <a className="back" href="#/">‹ Rencana KRS</a>
    <header className="page-heading"><div><h1>{plan.name}</h1><p>Sumber jadwal: {source.name}</p><p>Pilih kelas yang tersedia di bawah kalender. Kelas yang dipilih langsung masuk ke jadwal.</p></div>
      <div className="button-row">
        <button className="secondary" onClick={() => act(() => {
          const next = workspace.duplicatePlan(plan.id)
          location.hash = `/plan/${next.id}`
        })}>Duplikasi</button>
      </div>
    </header>
    <ErrorText message={error} />
    {editing ? <section className="paper select-subjects">
      <div className="section-heading">
        <button className="primary" disabled={!codes.length} onClick={() => act(() => {
          setQuery(''); setEditing(false); setClassTab('available')
        })}>Lanjut pilih kelas</button></div>
      <SubjectPicker courses={courses.map((schedule) => schedule.course)} codes={codes}
        onChange={(next) => act(() => workspace.updatePlanCourses(plan.id, next))}
        locked={selected.map((course) => course.course.code)} />
    </section> : <>
      <div className="planner-toolbar paper">
        <div><strong>{credits(selected)} SKS</strong><span>{selected.length} / {codes.length} mata kuliah terjadwal</span></div>
        <label className="limit">Batas SKS<input type="number" min="1" max="99" value={limit} placeholder="Opsional" onChange={(event) => setLimit(event.target.value)} /></label>
        <div className="button-row"><button className="secondary" onClick={() => { setQuery(''); setEditing(true) }}>Ubah mata kuliah</button>
          <button className="primary" onClick={() => setAi(true)}>Susun jadwal dengan AI</button></div>
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
              <div className="class-filters">
                <label className="class-search">Cari kelas<input type="search" value={query} placeholder="Mata kuliah, dosen, atau hari" onChange={(event) => setQuery(event.target.value)} /></label>
                <label>Kelompokkan berdasarkan<select value={groupBy} onChange={(event) => setGroupBy(event.target.value as GroupBy)}>
                  <option value="none">Tanpa pengelompokan</option>
                  <option value="lecturer">Dosen</option>
                  <option value="subject">Mata kuliah</option>
                  <option value="day">Hari</option>
                </select></label>
              </div>
              {!tabCourses.length && <p className="empty">{query.trim() ? 'Tidak ada kelas yang cocok dengan pencarian.' : emptyMessage[id]}</p>}
              {tabCourses.length > 0 && groupClasses(tabCourses, groupBy).map((group) => {
              const cards = <div className={id === 'available' || groupBy !== 'none' ? 'class-options-grid' : undefined}>
              {group.courses.map((course) => <div className="class-option" key={course.id}>
                <div><strong>{course.course.name}</strong><small>{course.className} · {course.course.credits} SKS</small></div>
                <div><span>{course.day} {time(course)}</span><small>{course.classRoom}</small></div>
                <div className="class-lecturers">{course.lecturers.map((name) => <small key={name}>{name}</small>)}</div>
                {id === 'blocked'
                  ? <small className="danger-text class-reason">{availability.unavailable.find((entry) => entry.id === course.id)?.reason.join(' · ')}</small>
                  : <button className={id === 'selected' ? 'quiet danger-text' : 'primary'} onClick={() => pick(course, id === 'selected')}>
                    {id === 'selected' ? 'Batal pilih' : 'Pilih kelas'}<span className="sr-only"> {course.course.name} {course.className}</span>
                  </button>}
              </div>)}
              </div>
              return groupBy === 'none' ? <div key={group.key}>{cards}</div> : <details className="class-group" key={`${groupBy}-${group.key}`}>
                <summary><span>{group.title}</span><span className="count">{group.courses.length} kelas</span></summary>
                <div className="class-group-content">{cards}</div>
              </details>
              })}
            </>}
          </div>)}
        </section>
    </>}
    {ai && <ScheduleAssistant onClose={() => setAi(false)} replacesSchedule={selected.length > 0}
      onGenerate={(prompt) => workspace.generatePlanWithAI(plan.id, prompt)} />}
  </div>
}
