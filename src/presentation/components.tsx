import { useRef } from 'react'
import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { Course } from '../business/types/course.types'

export const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
export const hours = (course: Course) => course.schedule.intervalTime
export const time = (course: Course) => `${hours(course).start}–${hours(course).end}`
export const credits = (courses: Course[]) => courses.reduce((sum, course) => sum + course.credits, 0)
export const minutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

export function Dialog({ title, children, onClose, wide = false }: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const opener = useRef<HTMLElement | null>(null)
  return <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className={`dialog-content ${wide ? 'dialog-wide' : ''}`} aria-describedby={undefined}
        onOpenAutoFocus={() => {
          if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          opener.current?.focus()
        }}>
        <header className="dialog-header"><DialogPrimitive.Title>{title}</DialogPrimitive.Title><DialogPrimitive.Close className="icon-button" aria-label="Tutup">×</DialogPrimitive.Close></header>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
}

export function CatalogTable({ courses }: { courses: Course[] }) {
  return <div className="table-scroll" tabIndex={0} aria-label="Tabel jadwal dosen">
    <table><thead><tr>{['Prodi', 'Kode Mata Kuliah', 'Nama Mata Kuliah', 'Kelas', 'SKS', 'Jumlah Mahasiswa', 'Jadwal', 'Ruang', 'Dosen'].map((label) => <th key={label}>{label}</th>)}</tr></thead>
      <tbody>{courses.map((course) => <tr key={course.id}>
        <td>{course.studyProgram}</td><td>{course.code}</td><td>{course.name}</td><td>{course.className}</td>
        <td>{course.credits}</td><td>{course.numberOfStudent}</td><td>{course.schedule.day} {time(course)}</td>
        <td>{course.classRoom}</td><td>{course.lecturers.map((name) => <div key={name}>{name}</div>)}</td>
      </tr>)}</tbody>
    </table>
  </div>
}

export function Calendar({ courses, onRemove }: { courses: Course[]; onRemove?: (course: Course) => void }) {
  const activeDays = courses.some((course) => course.schedule.day === 'Minggu') ? days : days.slice(0, 6)
  const first = Math.min(7, ...courses.map((course) => Math.floor(minutes(hours(course).start) / 60)))
  const last = Math.max(18, ...courses.map((course) => Math.ceil(minutes(hours(course).end) / 60)))
  const ticks = Array.from({ length: last - first }, (_, index) => first + index)
  const gapList = activeDays.flatMap((day) => {
    const ordered = courses.filter((course) => course.schedule.day === day)
      .sort((a, b) => minutes(hours(a).start) - minutes(hours(b).start))
    return ordered.slice(1).map((course, i) => {
      const gap = minutes(hours(course).start) - minutes(hours(ordered[i]).end)
      return `${day} ${hours(ordered[i]).end}–${hours(course).start} · ${gap} menit`
    })
  })
  return <>
    <div className="calendar-scroll" tabIndex={0} aria-label="Kalender mingguan, gulir untuk melihat semua hari">
      <div className="calendar" style={{ gridTemplateColumns: `58px repeat(${activeDays.length}, minmax(106px, 1fr))` }}>
        <div className="calendar-label time-label">Jam</div>
        {activeDays.map((day) => <div key={day} className="calendar-label">{day}</div>)}
        <div className="time-axis">{ticks.map((hour) => <div key={hour}>{String(hour).padStart(2, '0')}:00</div>)}</div>
        {activeDays.map((day) => <div className="calendar-day" key={day} style={{ height: ticks.length * 46 }}>
          {courses.filter((course) => course.schedule.day === day).map((course) => <article key={course.id}
            className={`calendar-card tone-${Number(course.code.slice(-2)) % 3}`}
            style={{
              top: (minutes(hours(course).start) - first * 60) * 46 / 60,
              height: (minutes(hours(course).end) - minutes(hours(course).start)) * 46 / 60 - 2,
            }}>
            {onRemove && <button type="button" className="remove-card" onClick={() => onRemove(course)} aria-label={`Batal pilih ${course.name} ${course.className}`}>×</button>}
            <strong title={course.name}>{course.name}</strong>
            <span>{time(course)} · {course.credits} SKS</span>
            <small title={course.lecturers.join(', ')}>{course.lecturers.join(', ') || course.classRoom}</small>
          </article>)}
        </div>)}
      </div>
    </div>
    {gapList.length > 0 && <details className="gaps"><summary>Jeda antarkelas</summary><ul>{gapList.map((gap) => <li key={gap}>{gap}</li>)}</ul></details>}
  </>
}

export function ErrorText({ message }: { message: string }) {
  return message ? <p role="alert" className="error">{message}</p> : null
}

