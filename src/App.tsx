import { useEffect, useState } from 'react'
import { CatalogPage, TransferPage } from './presentation/CatalogPages'
import { ComparisonsPage } from './presentation/ComparisonsPage'
import { HomePage } from './presentation/HomePage'
import { Planner } from './presentation/Planner'
import { Sidebar } from './presentation/components/Sidebar'
import { useWorkspace } from './presentation/hooks/useWorkspace'
import './App.css'

export default function App() {
  const workspace = useWorkspace()
  const [route, setRoute] = useState(() => location.hash || '#/')
  const [collapsed, setCollapsed] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const update = () => setRoute(location.hash || '#/')
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])

  function rememberSubjects(id: string, codes: string[]) {
    setDrafts((current) => ({ ...current, [id]: codes }))
  }

  const plan = workspace.plans.find((item) => route === `#/plan/${item.id}`)
  const comparison = route === '#/compare' || route.startsWith('#/compare/')
  let page
  if (plan) {
    page = <Planner key={plan.id} plan={plan} workspace={workspace} draftCodes={drafts[plan.id]}
      onDraftChange={(codes) => rememberSubjects(plan.id, codes)} />
  } else if (comparison) {
    page = <ComparisonsPage key={route} workspace={workspace}
      viewId={route === '#/compare' ? undefined : route.slice('#/compare/'.length)} />
  } else if (route === '#/data') {
    page = <CatalogPage workspace={workspace} />
  } else if (route === '#/file') {
    page = <TransferPage />
  } else if (route === '#/') {
    page = <HomePage workspace={workspace} onCreate={(id, codes) => {
      rememberSubjects(id, codes)
      location.hash = `/plan/${id}`
    }} />
  } else {
    page = <div className="empty"><h1>Halaman tidak ditemukan</h1><a href="#/">Kembali ke beranda</a></div>
  }

  return <div className={`app ${collapsed ? 'rail-small' : ''}`}>
    <Sidebar key={route} active={plan ? '#/' : comparison ? '#/compare' : route}
      collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
    <main>{page}</main>
  </div>
}
