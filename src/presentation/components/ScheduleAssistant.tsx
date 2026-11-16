import { useState } from 'react'
import { Dialog, ErrorText } from '../components'

export function ScheduleAssistant({ onGenerate, onClose, replacesSchedule }: {
  onGenerate: (prompt: string) => Promise<{ reasoning?: string }>
  onClose: () => void
  replacesSchedule: boolean
}) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const result = await onGenerate(prompt.trim())
      setMessage(result.reasoning ?? 'Jadwal berhasil dibuat.')
    } catch (problem) {
      setError((problem as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return <Dialog title="Asisten jadwal" wide onClose={() => { if (!loading) onClose() }}>
    <form onSubmit={(event) => {
      event.preventDefault()
      if (!loading && prompt.trim()) void generate()
    }}>
      <label>Preferensi jadwal<textarea required rows={5} value={prompt} disabled={loading}
        placeholder="Contoh: sisakan hari Jumat kosong." onChange={(event) => { setPrompt(event.target.value); }} /></label>
      {replacesSchedule && <p>Jadwal yang berhasil dibuat akan menggantikan kelas terpilih.</p>}
      {message && <p role="status" className="notice">{message}</p>}
      <ErrorText message={error} />
      <footer className="actions">
        <button type="button" className="secondary" disabled={loading} onClick={onClose}>Tutup</button>
        <button className="primary" disabled={loading || !prompt.trim()}>{loading ? 'Menyusun jadwal…' : 'Buat jadwal'}</button>
      </footer>
    </form>
  </Dialog>
}
