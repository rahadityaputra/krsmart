import { useMemo, useState } from "react";
import type { Course } from "../business/types/course.types";

import type { Plan } from "../business/types/plan.types";
import { Calendar, Dialog, ErrorText } from "./components";
import type { Workspace } from "./hooks/useWorkspace";
import { SubjectPicker } from "./components/SubjectPicker";
import type { Schedule } from "../business/types/scedule.types";

const classTabs = [
  { id: "selected", label: "Jadwal terpilih" },
  { id: "available", label: "Pilih jadwal" },
  { id: "blocked", label: "Jadwal bentrok" },
] as const;

type ClassTab = (typeof classTabs)[number]["id"];

const emptyMessage: Record<ClassTab, string> = {
  selected: "Belum ada jadwal pada rencana ini.",
  available: "Tidak ada jadwal tambahan yang bisa dipilih.",
  blocked: "Belum ada bentrok pada pilihan ini.",
};

const totalCredits = (items: Schedule[]) =>
  items.reduce((sum, item) => sum + item.course.credits, 0);

const timeRange = (item: Schedule) =>
  `${item.intervalTime.start}–${item.intervalTime.end}`;

export function Planner({
  plan,
  workspace,
  draftCodes,
  onDraftChange,
}: {
  plan: Plan;
  workspace: Workspace;
  draftCodes?: string[];
  onDraftChange: (codes: string[]) => void;
}) {
  const source = workspace.source(plan.datasourceId ?? "");
  const schedules = useMemo<Schedule[]>(
    () => source?.schedules ?? [],
    [source],
  );

  // Course unik dari seluruh schedule (satu course bisa punya banyak kelas)
  const courses = useMemo<Course[]>(() => {
    const byId = new Map<number, Course>();
    for (const schedule of schedules) {
      if (!byId.has(schedule.course.id)) {
        byId.set(schedule.course.id, schedule.course);
      }
    }
    return [...byId.values()];
  }, [schedules]);

  const chosenIds = plan.data?.choosed ?? [];
  const selected = schedules.filter((item) => chosenIds.includes(item.id));
  const selectedCodes = new Set(selected.map((item) => item.course.code));

  // Kode course yang dipilih user = draft/plan + course dari kelas yang sudah dipilih
  const codes = [
    ...new Set([
      ...(draftCodes ?? plan.choosedCourses ?? []),
      ...selectedCodes,
    ]),
  ];

  const [editing, setEditing] = useState(
    !draftCodes?.length && !plan.choosedCourses?.length && !chosenIds.length,
  );
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");
  const [ai, setAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReasoning, setAiReasoning] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [classTab, setClassTab] = useState<ClassTab>("available");

  // Semua kelas (schedule) dari course yang dipilih
  const choices = schedules.filter((item) => codes.includes(item.course.code));
  const availability = workspace.availability(
    choices,
    selected.map((item) => item.id),
  );

  const matches = (item: Schedule) =>
    `${item.course.name} ${item.course.code} ${item.className} ${item.lecturers.join(" ")}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());

  const ready = choices.filter(
    (item) =>
      availability.available.includes(item.id) &&
      !selectedCodes.has(item.course.code) &&
      matches(item),
  );
  const blocked = choices.filter(
    (item) =>
      availability.unavailable.some(
        (option) =>
          option.id === item.id &&
          option.reason.some((reason) => reason.startsWith("Bentrok")),
      ) &&
      !selectedCodes.has(item.course.code) &&
      matches(item),
  );
  const selectedMatches = selected.filter(matches);

  const classCounts: Record<ClassTab, number> = {
    selected: selectedMatches.length,
    available: ready.length,
    blocked: blocked.length,
  };
  const tabItems =
    classTab === "selected"
      ? selectedMatches
      : classTab === "available"
        ? ready
        : blocked;

  function act(action: () => void) {
    setError("");
    try {
      action();
    } catch (problem) {
      setError((problem as Error).message);
    }
  }

  function pick(item: Schedule, remove = false) {
    act(() => {
      workspace.pick(plan.id, item.id, remove);
    });
  }

  if (!source) {
    return (
      <div className="empty paper">
        <h1>{plan.name}</h1>
        <p>Sumber jadwal untuk rencana ini tidak tersedia.</p>
        <a href="#/">Kembali ke rencana KRS</a>
      </div>
    );
  }

  return (
    <div className="planner">
      <a className="back" href="#/">
        ‹ Rencana KRS
      </a>
      <header className="page-heading">
        <div>
          <h1>{plan.name}</h1>
          <p>{source.name}</p>
        </div>
        <div className="button-row">
          <button
            className="secondary"
            onClick={() => {
              act(() => {
                const next = workspace.duplicatePlan(plan.id);
                location.hash = `#/plan/${encodeURIComponent(next.id)}`;
              });
            }}
          >
            Duplikasi
          </button>
        </div>
      </header>
      <ErrorText message={error} />

      {editing ? (
        <section className="paper select-subjects">
          <div className="section-heading">
            <button
              className="primary"
              disabled={!codes.length}
              onClick={() => {
                setQuery("");
                setEditing(false);
                setClassTab("available");
              }}
            >
              Lanjut pilih jadwal
            </button>
          </div>
          <SubjectPicker
            courses={courses}
            codes={codes}
            onChange={onDraftChange}
            locked={[...selectedCodes]}
          />
        </section>
      ) : (
        <>
          <div className="planner-toolbar paper">
            <div>
              <strong>{totalCredits(selected)} SKS</strong>
              <span>
                {selectedCodes.size} / {codes.length} mata kuliah terjadwal
              </span>
            </div>
            <label className="limit">
              Batas SKS
              <input
                type="number"
                min="1"
                max="99"
                value={limit}
                placeholder="Opsional"
                onChange={(event) => {
                  setLimit(event.target.value);
                }}
              />
            </label>
            <div className="button-row">
              <button
                className="secondary"
                onClick={() => {
                  setQuery("");
                  setEditing(true);
                }}
              >
                Ubah mata kuliah
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setAi(true);
                }}
              >
                Asisten AI
              </button>
            </div>
          </div>

          {limit && totalCredits(selected) > Number(limit) && (
            <p className="notice" role="status">
              Total melebihi batas {limit} SKS.
            </p>
          )}

          <section className="calendar-panel" aria-labelledby="calendar-title">
            <div className="section-heading">
              <h2 id="calendar-title">Kalender mingguan</h2>
              <small>Perubahan tersimpan otomatis</small>
            </div>
            {!selected.length && (
              <p className="notice">Pilih jadwal untuk mengisi kalender.</p>
            )}
            <Calendar
              schedules={selected}
              onRemove={(item) => {
                pick(item, true);
              }}
            />
          </section>

          <section className="class-section" aria-label="Daftar jadwal">
            <div
              className="class-tabs"
              role="tablist"
              aria-label="Status jadwal"
            >
              {classTabs.map(({ id, label }, index) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  id={`class-tab-${id}`}
                  aria-controls={`class-panel-${id}`}
                  aria-selected={classTab === id}
                  tabIndex={classTab === id ? 0 : -1}
                  onClick={() => {
                    setClassTab(id);
                  }}
                  onKeyDown={(event) => {
                    const last = classTabs.length - 1;
                    const next = {
                      ArrowRight: (index + 1) % classTabs.length,
                      ArrowLeft: (index + last) % classTabs.length,
                      Home: 0,
                      End: last,
                    };
                    if (!Object.hasOwn(next, event.key)) return;
                    event.preventDefault();
                    const tab = classTabs[next[event.key as keyof typeof next]];
                    setClassTab(tab.id);
                    document.getElementById(`class-tab-${tab.id}`)?.focus();
                  }}
                >
                  {label} <span className="count">{classCounts[id]}</span>
                </button>
              ))}
            </div>

            {classTabs.map(({ id }) => (
              <div
                key={id}
                className="class-panel paper"
                role="tabpanel"
                id={`class-panel-${id}`}
                aria-labelledby={`class-tab-${id}`}
                hidden={classTab !== id}
              >
                {classTab === id && (
                  <>
                    <label className="class-search">
                      <span className="sr-only">Cari jadwal</span>
                      <input
                        type="search"
                        value={query}
                        placeholder="Cari mata kuliah atau dosen…"
                        onChange={(event) => {
                          setQuery(event.target.value);
                        }}
                      />
                    </label>
                    {!tabItems.length && (
                      <p className="empty">
                        {query.trim()
                          ? "Tidak ada jadwal yang cocok dengan pencarian."
                          : emptyMessage[id]}
                      </p>
                    )}
                    <div
                      className={
                        id === "available" ? "class-options-grid" : undefined
                      }
                    >
                      {tabItems.map((item) => (
                        <div className="class-option" key={item.id}>
                          <div>
                            <strong>{item.course.name}</strong>
                            <small>
                              {item.className} · {item.course.credits} SKS
                            </small>
                          </div>
                          <div>
                            <span>
                              {item.day} {timeRange(item)}
                            </span>
                            <small>{item.classRoom}</small>
                          </div>
                          <div className="class-lecturers">
                            {item.lecturers.map((name) => (
                              <small key={name}>{name}</small>
                            ))}
                          </div>
                          {id === "blocked" ? (
                            <small className="danger-text class-reason">
                              {availability.unavailable
                                .find((entry) => entry.id === item.id)
                                ?.reason.join(" · ")}
                            </small>
                          ) : (
                            <button
                              className={
                                id === "selected"
                                  ? "quiet danger-text"
                                  : "secondary"
                              }
                              onClick={() => {
                                pick(item, id === "selected");
                              }}
                            >
                              {id === "selected"
                                ? "Batal pilih"
                                : "Pilih jadwal"}
                              <span className="sr-only">
                                {" "}
                                {item.course.name} {item.className}
                              </span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      {ai && (
        <Dialog
          title="Asisten jadwal"
          wide
          onClose={() => {
            if (!aiLoading) setAi(false);
          }}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              setAiReasoning("");
              setAiLoading(true);
              try {
                const result = await workspace.generatePlanWithAI(
                  plan.id,
                  aiPrompt,
                );
                setAiReasoning(result.reasoning ?? "Jadwal berhasil dibuat.");
              } catch (problem) {
                setError((problem as Error).message);
              } finally {
                setAiLoading(false);
              }
            }}
          >
            <label>
              Preferensi jadwal
              <textarea
                required
                rows={5}
                value={aiPrompt}
                placeholder="Contoh: pilih jadwal tanpa kuliah pagi dan sisakan hari Jumat kosong."
                onChange={(event) => {
                  setAiPrompt(event.target.value);
                }}
                disabled={aiLoading}
              />
            </label>
            {aiReasoning && <p className="notice">{aiReasoning}</p>}
            <ErrorText message={error} />
            <footer className="actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setAi(false);
                }}
                disabled={aiLoading}
              >
                Tutup
              </button>
              <button className="primary" disabled={aiLoading}>
                {aiLoading ? "Menyusun jadwal…" : "Buat jadwal"}
              </button>
            </footer>
          </form>
        </Dialog>
      )}
    </div>
  );
}
