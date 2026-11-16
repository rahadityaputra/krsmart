import { useRef, useState } from 'react'

const destinations = [
  { href: '#/', name: 'Rencana', icon: 'plan' },
  { href: '#/data', name: 'Data Jadwal', icon: 'catalog' },
  { href: '#/compare', name: 'Bandingkan Jadwal', icon: 'compare' },
] as const

const iconPaths = {
  plan: 'M8 5H6a1 1 0 0 0-1 1v14h14V6a1 1 0 0 0-1-1h-2 M9 3h6v4H9z M9 13l2 2 4-4',
  catalog: 'M4 6h16v14H4z M8 4v4 M16 4v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2',
  compare: 'M3 5h8v14H3z M14 5h7v14h-7z M6 9h2 M6 13h2 M17 9h1 M17 15h1',
}

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
        aria-controls="primary-nav" aria-expanded={mobileOpen} onClick={() => { setMobileOpen(!mobileOpen); }}>☰</button>
    </div>
    <nav id="primary-nav" className={mobileOpen ? 'nav-open' : ''} aria-label="Utama" onKeyDown={(event) => {
      if (event.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
        menuButton.current?.focus()
      }
    }}>
      {destinations.map(({ href, name, icon }) => <a key={href} href={href} aria-label={name} className={`nav-${icon}`}
        aria-current={active === href ? 'page' : undefined} onClick={() => { setMobileOpen(false); }}>
        <span className="nav-symbol" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" focusable="false">
            <path d={iconPaths[icon]} />
          </svg>
        </span>
        <span className="nav-label">{name}</span>
      </a>)}
    </nav>
    <p className="rail-foot">Data tersimpan di browser ini.</p>
  </aside>
}
