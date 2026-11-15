import { useRef, useState } from 'react'

const destinations = [
  { href: '#/', name: 'Beranda', symbol: '▦' },
  { href: '#/data', name: 'Data Jadwal', symbol: '▤' },
  { href: '#/compare', name: 'Bandingkan Jadwal', symbol: '≡' },
  { href: '#/file', name: 'Impor / Ekspor', symbol: '⇄' },
]

export function Sidebar({ active, collapsed, onToggle }: {
  active: string
  collapsed: boolean
  onToggle: () => void
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)

  return <aside className="rail">
    <div className="brand">
      <a href="#/" aria-label="KRSmart, beranda"><span className="brand-mark" aria-hidden="true">K</span><strong>KRSmart</strong></a>
      <button className="icon-button desktop-menu" aria-label={collapsed ? 'Lebarkan sidebar' : 'Ciutkan sidebar'}
        aria-controls="primary-nav" aria-expanded={!collapsed} onClick={onToggle}>☰</button>
      <button ref={menuButton} className="icon-button mobile-menu" aria-label="Menu navigasi"
        aria-controls="primary-nav" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>☰</button>
    </div>
    <nav id="primary-nav" className={mobileOpen ? 'nav-open' : ''} aria-label="Utama" onKeyDown={(event) => {
      if (event.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
        menuButton.current?.focus()
      }
    }}>
      {destinations.map(({ href, name, symbol }) => <a key={href} href={href} aria-label={name}
        aria-current={active === href ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
        <span className="nav-symbol" aria-hidden="true">{symbol}</span><span className="nav-label">{name}</span>
      </a>)}
    </nav>
    <p className="rail-foot">Data tersimpan di browser ini.</p>
  </aside>
}
