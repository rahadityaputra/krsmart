import { useEffect, useState } from 'react'
import { CatalogPage } from './presentation/CatalogPages'
import { ComparisonsPage } from './presentation/ComparisonsPage'
import { HomePage } from './presentation/HomePage'
import { Planner } from './presentation/Planner'
import { Sidebar } from './presentation/components/Sidebar'
import { usePlans } from './presentation/hooks/usePlans'
import { useDataSources } from './presentation/hooks/useDataSources'
import { useComparisons } from './presentation/hooks/useComparisons'
import './App.css'

export default function App() {
  const plansDomain = usePlans()
  const dataSources = useDataSources()
  const comparisons = useComparisons()
  const [route, setRoute] = useState(() => location.hash || '#/')
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const update = () => { setRoute(location.hash || '#/'); }
    window.addEventListener('hashchange', update)
    return () => { window.removeEventListener('hashchange', update); }
  }, [])

  const plan = plansDomain.plans.find((item) => route === `#/plan/${item.id}`)
  const comparison = route === '#/compare' || route.startsWith('#/compare/')
  let page
  if (plan) {
    page = <Planner key={plan.id} plan={plan} plansDomain={plansDomain} dataSources={dataSources} />
  } else if (comparison) {
    page = <ComparisonsPage key={route} plansDomain={plansDomain} dataSources={dataSources} comparisons={comparisons}
      viewId={route === '#/compare' ? undefined : route.slice('#/compare/'.length)} />
  } else if (route === '#/data') {
    page = <CatalogPage dataSources={dataSources} />
  } else if (route === '#/') {
    page = <HomePage plansDomain={plansDomain} dataSources={dataSources} onCreate={(id) => {
      location.hash = `/plan/${id}`
    }} />
  } else {
    page = <div className="empty"><h1>Halaman tidak ditemukan</h1><a href="#/">Kembali ke beranda</a></div>
  }

  return <div className={`app ${collapsed ? 'rail-small' : ''}`}>
    <Sidebar key={route} active={plan ? '#/' : comparison ? '#/compare' : route}
      collapsed={collapsed} onToggle={() => { setCollapsed(!collapsed); }} />
    <main>{page}</main>
  </div>
}
