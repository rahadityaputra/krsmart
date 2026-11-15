import { useEffect, useState } from "react";
import { Dialog, ErrorText } from "./presentation/components";
import { useWorkspace } from "./presentation/hooks/useWorkspace";
import { CatalogPage, TransferPage } from "./presentation/CatalogPages";
import { Planner } from "./presentation/Planner";
import "./App.css";

const tabs = [
  { href: "#/", name: "Beranda", symbol: "▦" },
  { href: "#/data", name: "Data Jadwal", symbol: "▤" },
  { href: "#/file", name: "Impor / Ekspor", symbol: "⇄" },
];

export default function App() {
  const workspace = useWorkspace();
  const [route, setRoute] = useState(() => location.hash || "#/");
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const update = () => {
      setRoute(location.hash || "#/");
      setMenu(false);
      setError("");
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const plan = workspace.plans.find((item) => route === `#/plan/${item.id}`);
  const active = plan ? "#/" : route;
  function create(name: string, source: string) {
    try {
      const next = workspace.createPlan(name, source);
      setCreating(false);
      setError("");
      location.hash = `/plan/${next.id}`;
    } catch (problem) {
      setError(String((problem as Error).message));
    }
  }
  const openCreate = () => {
    if (!workspace.sources.length) {
      location.hash = "/data";
      return;
    }
    setError("");
    setCreating(true);
  };

  return (
    <div className={`app ${collapsed ? "rail-small" : ""}`}>
      <aside className="rail">
        <div className="brand">
          <a href="#/" aria-label="KRSmart, beranda">
            <span className="brand-mark" aria-hidden="true">
              K
            </span>
            <strong>KRSmart</strong>
          </a>
          <button
            className="icon-button desktop-menu"
            aria-label="Ciutkan sidebar"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed(!collapsed)}
          >
            ☰
          </button>
          <button
            className="icon-button mobile-menu"
            aria-label="Menu navigasi"
            aria-controls="primary-nav"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            ☰
          </button>
        </div>
        <nav
          id="primary-nav"
          className={menu ? "nav-open" : ""}
          aria-label="Utama"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setMenu(false);
              document
                .querySelector<HTMLButtonElement>(".mobile-menu")
                ?.focus();
            }
          }}
        >
          {tabs.map((tab) => (
            <a
              key={tab.href}
              href={tab.href}
              aria-label={tab.name}
              aria-current={active === tab.href ? "page" : undefined}
              onClick={() => setMenu(false)}
            >
              <span className="nav-symbol" aria-hidden="true">
                {tab.symbol}
              </span>
              <span className="nav-label">{tab.name}</span>
            </a>
          ))}
        </nav>
        <p className="rail-foot">Data tersimpan di browser ini.</p>
      </aside>
      <main>
        {plan ? (
          <Planner key={plan.id} plan={plan} workspace={workspace} />
        ) : route === "#/data" ? (
          <CatalogPage workspace={workspace} />
        ) : route === "#/file" ? (
          <TransferPage />
        ) : route === "#/" ? (
          <>
            <header className="page-heading">
              <div>
                <h1>Rencana KRS</h1>
                <p>Susun jadwal kuliah dan siapkan rencana cadangan.</p>
              </div>
              <button className="primary" onClick={openCreate}>
                <span aria-hidden="true">＋</span>{" "}
                {workspace.sources.length
                  ? "Tambah rencana"
                  : "Tambah sumber data"}
              </button>
            </header>
            <section className="plans-section" aria-labelledby="plans-title">
              <div className="section-heading">
                <h2 id="plans-title">
                  Rencana tersimpan{" "}
                  <span className="count">{workspace.plans.length}</span>
                </h2>
                <label className="search">
                  <span className="sr-only">Cari rencana</span>
                  <input
                    type="search"
                    placeholder="Cari rencana…"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>
              <div className="paper">
                {workspace.plans
                  .filter((item) =>
                    item.name
                      .toLowerCase()
                      .includes(query.trim().toLowerCase()),
                  )
                  .map((item) => (
                    <div className="plan-row" key={item.id}>
                      <div>
                        <a className="plan-link" href={`#/plan/${item.id}`}>
                          {item.name}
                        </a>
                        <small>
                          {workspace.sources.find(
                            (source) => source.id === item.datasourceId,
                          )?.name ?? "Sumber belum tersedia"}{" "}
                          · {item.data?.choosed.length ?? 0} kelas dipilih
                        </small>
                      </div>
                      <button
                        className="quiet danger-text"
                        onClick={() => {
                          setError("");
                          setDeleting(item.id);
                        }}
                      >
                        Hapus<span className="sr-only"> {item.name}</span>
                      </button>
                    </div>
                  ))}
                {!workspace.plans.length && (
                  <div className="empty">
                    <strong>Belum ada rencana.</strong>
                    <p>
                      {workspace.sources.length
                        ? "Pilih sumber jadwal untuk membuat rencana pertama."
                        : "Tambahkan jadwal kampus di Data Jadwal untuk mulai membuat rencana."}
                    </p>
                  </div>
                )}
                {workspace.plans.length > 0 &&
                  !workspace.plans.some((item) =>
                    item.name
                      .toLowerCase()
                      .includes(query.trim().toLowerCase()),
                  ) && (
                    <div className="empty">
                      Tidak ada rencana yang cocok.{" "}
                      <button className="quiet" onClick={() => setQuery("")}>
                        Hapus pencarian
                      </button>
                    </div>
                  )}
              </div>
            </section>
          </>
        ) : (
          <div className="empty">
            <h1>Halaman tidak ditemukan</h1>
            <a href="#/">Kembali ke beranda</a>
          </div>
        )}
      </main>
      {creating && (
        <Dialog title="Tambah rencana" onClose={() => setCreating(false)}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              create(String(form.get("name")), String(form.get("source")));
            }}
          >
            <label>
              Nama rencana
              <input
                name="name"
                required
                maxLength={80}
                placeholder="Contoh: KRS Semester 5"
              />
            </label>
            <label>
              Sumber data
              <select
                name="source"
                required
                defaultValue={workspace.sources[0]?.id ?? ""}
              >
                {workspace.sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </label>
            <ErrorText message={error} />
            <footer className="actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setCreating(false)}
              >
                Batal
              </button>
              <button className="primary">Buat rencana</button>
            </footer>
          </form>
        </Dialog>
      )}
      {deleting && (
        <Dialog title="Hapus rencana?" onClose={() => setDeleting("")}>
          <p>
            Rencana{" "}
            <strong>
              {workspace.plans.find((item) => item.id === deleting)?.name}
            </strong>{" "}
            akan dihapus dari browser ini.
          </p>
          <ErrorText message={error} />
          <footer className="actions">
            <button className="secondary" onClick={() => setDeleting("")}>
              Batal
            </button>
            <button
              className="danger"
              onClick={() => {
                try {
                  workspace.deletePlan(deleting);
                  setDeleting("");
                } catch (problem) {
                  setError((problem as Error).message);
                }
              }}
            >
              Hapus rencana
            </button>
          </footer>
        </Dialog>
      )}
    </div>
  );
}
