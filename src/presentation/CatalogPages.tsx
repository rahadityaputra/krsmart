import { useMemo, useState } from "react";
import type { Schedule } from "../business/types/scedule.types";
import { CatalogTable, Dialog, ErrorText } from "./components";
import type { Workspace } from "./hooks/useWorkspace";

const MAX_FILE_SIZE = 2_000_000;

function messageOf(problem: unknown) {
  return problem instanceof Error ? problem.message : "Terjadi kesalahan.";
}

export function CatalogPage({ workspace }: { workspace: Workspace }) {
  const [selected, setSelected] = useState("");
  const [editor, setEditor] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [name, setName] = useState("");
  const [raw, setRaw] = useState("");
  const [previewed, setPreviewed] = useState<Schedule[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const source = workspace.source(selected || workspace.sources[0]?.id || "");
  const sourceSchedules = useMemo<Schedule[]>(
    () => source?.schedules ?? [],
    [source],
  );

  const keyword = query.trim().toLowerCase();
  const filtered = sourceSchedules.filter((schedule) =>
    `${schedule.course.name} ${schedule.course.code} ${schedule.lecturers.join(" ")}`
      .toLowerCase()
      .includes(keyword),
  );
  const courseCount = new Set(
    sourceSchedules.map((schedule) => schedule.course.code),
  ).size;

  function open() {
    setName("");
    setRaw("");
    setPreviewed(null);
    setError("");
    setEditor(true);
  }

  function review() {
    const result: Schedule[] = workspace.preview(raw);
    setPreviewed(result);
    setError(
      result.length
        ? ""
        : "Format jadwal belum terbaca. Periksa kolom dan jam pada teks.",
    );
  }

  async function readFile(file: File) {
    try {
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("Ukuran file maksimum 2 MB.");
      }
      setRaw(await file.text());
      setPreviewed(null);
      setError("");
    } catch (problem: unknown) {
      setError(messageOf(problem));
    }
  }

  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Data Jadwal</h1>
          <p>Kelola sumber jadwal dosen untuk rencana KRS.</p>
        </div>
        <button className="primary" onClick={open}>
          ＋ Tambah sumber data
        </button>
      </header>

      {source ? (
        <section className="paper source-panel">
          <div className="section-heading">
            <label>
              Sumber data
              <select
                value={source.id}
                onChange={(event) => {
                  setSelected(event.target.value);
                  setQuery("");
                }}
              >
                {workspace.sources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="button-row">
              <small>Edit sumber · segera hadir</small>
              <button
                className="quiet danger-text"
                onClick={() => {
                  setError("");
                  setRemoving(true);
                }}
              >
                Hapus
              </button>
            </div>
          </div>
          <div className="section-heading">
            <p>
              {sourceSchedules.length} kelas · {courseCount} mata kuliah
            </p>
            <label>
              <span className="sr-only">Cari dalam jadwal dosen</span>
              <input
                type="search"
                value={query}
                placeholder="Cari mata kuliah…"
                onChange={(event) => {
                  setQuery(event.target.value);
                }}
              />
            </label>
          </div>
          <CatalogTable schedules={filtered} />
          {query && !filtered.length && (
            <p className="empty">Pencarian tidak menemukan kelas.</p>
          )}
        </section>
      ) : (
        <div className="paper empty">
          <strong>Belum ada sumber data.</strong>
          <p>Tambahkan file teks atau tempel jadwal dari web kampus.</p>
          <button className="secondary" onClick={open}>
            Tambah jadwal dosen
          </button>
        </div>
      )}

      {editor && (
        <Dialog
          title="Tambah sumber data"
          wide
          onClose={() => {
            setEditor(false);
          }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              try {
                if (!previewed?.length) {
                  throw new Error(
                    "Tinjau jadwal yang valid sebelum menyimpan.",
                  );
                }
                const saved = workspace.saveSource(name, raw);
                setSelected(saved.id);
                setQuery("");
                setEditor(false);
              } catch (problem: unknown) {
                setError(messageOf(problem));
              }
            }}
          >
            <label>
              Nama sumber data
              <input
                required
                maxLength={100}
                value={name}
                placeholder="Contoh: Informatika Semester 5"
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            </label>
            <label>
              File jadwal kampus (.txt)
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void readFile(file);
                }}
              />
            </label>
            <label>
              Teks jadwal
              <textarea
                rows={5}
                value={raw}
                placeholder="Tempel baris jadwal dari web kampus."
                onChange={(event) => {
                  setRaw(event.target.value);
                  setPreviewed(null);
                }}
              />
            </label>
            <div className="button-row">
              <button type="button" className="secondary" onClick={review}>
                Tinjau jadwal
              </button>
            </div>
            {previewed && previewed.length > 0 && (
              <>
                <p className="meta">{previewed.length} kelas terbaca</p>
                <CatalogTable schedules={previewed} />
              </>
            )}
            <ErrorText message={error} />
            <footer className="actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditor(false);
                }}
              >
                Batal
              </button>
              <button className="primary">Simpan sumber data</button>
            </footer>
          </form>
        </Dialog>
      )}

      {removing && source && (
        <Dialog
          title="Hapus sumber data?"
          onClose={() => {
            setRemoving(false);
          }}
        >
          <p>
            Sumber <strong>{source.name}</strong> akan dihapus dari browser ini.
          </p>
          <ErrorText message={error} />
          <footer className="actions">
            <button
              className="secondary"
              onClick={() => {
                setRemoving(false);
              }}
            >
              Batal
            </button>
            <button
              className="danger"
              onClick={() => {
                try {
                  workspace.deleteSource(source.id);
                  setSelected("");
                  setRemoving(false);
                } catch (problem: unknown) {
                  setError(messageOf(problem));
                }
              }}
            >
              Hapus sumber
            </button>
          </footer>
        </Dialog>
      )}
    </>
  );
}

export function TransferPage() {
  return (
    <>
      <header className="page-heading">
        <div>
          <h1>Impor / Ekspor</h1>
          <p>File rencana KRS dan jadwal dosen.</p>
        </div>
      </header>
      <section className="paper transfer-import">
        <h2>File berbagi .krs</h2>
        <p>
          Impor dan ekspor rencana KRS serta katalog jadwal dosen segera hadir.
        </p>
        <a href="#/data">Impor teks jadwal kampus di Data Jadwal</a>
      </section>
    </>
  );
}