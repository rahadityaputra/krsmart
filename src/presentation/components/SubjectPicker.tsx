import { useState } from 'react'
import type { Course } from '../../business/types/course.types'


export function SubjectPicker({ courses, codes, onChange, locked = [] }: {
  courses: Course[]
  codes: string[]
  onChange: (codes: string[]) => void
  locked?: string[]
}) {
  const [query, setQuery] = useState('')
  const subjects = [...new Map(courses.map((course) => [course.code, course])).values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'id'))
  const visible = subjects.filter(({ name, code }) =>
    `${name} ${code}`.toLowerCase().includes(query.trim().toLowerCase()))

  return <fieldset>
    <legend>Pilih mata kuliah</legend>
    <p>{codes.length} mata kuliah · {subjects.filter((course) => codes.includes(course.code)).reduce((total, course) => total + course.credits, 0)} SKS</p>
    <label>Cari mata kuliah<input type="search" value={query} placeholder="Nama atau kode mata kuliah"
      onChange={(event) => { setQuery(event.target.value); }} /></label>
    <div className="subject-list">
      {visible.map((course) => <label className="subject-row" key={course.code}>
        <input type="checkbox" checked={codes.includes(course.code)} disabled={locked.includes(course.code)}
          onChange={(event) => { onChange(event.target.checked ? [...codes, course.code] : codes.filter((code) => code !== course.code)); }} />
        <span>{course.name}</span><small>{course.credits} SKS</small>
      </label>)}
    </div>
    {!visible.length && <p>Tidak ada mata kuliah yang cocok.</p>}
  </fieldset>
}
