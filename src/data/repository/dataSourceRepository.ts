// dataSourceRepository.ts
import { getItem, setItem, removeItem } from "../storage/localStorage";
import { parseSubjects } from "../../business/use-cases/parser";
import type { Course } from "../../business/types/course.types";

export interface DataSourceMeta {
  id: string;
  name: string;
  origin: "bima-upn";
  subjectCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface DataSource extends DataSourceMeta {
  subjects: Course[];
}

export interface NewDataSource {
  name: string;
  raw: string; // teks mentah hasil copy dari Bima UPN
}

export type DataSourceChanges = Partial<NewDataSource>;

const META_KEY = "schedule:data-sources";
const ACTIVE_KEY = "schedule:active-data-source";
const subjectsKey = (id: string): string => `schedule:data-source:${id}:subjects`;

const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const loadMetas = (): DataSourceMeta[] => getItem<DataSourceMeta[]>(META_KEY, []);

const saveMetas = (metas: DataSourceMeta[]): boolean => setItem(META_KEY, metas);

// ---------- Read ----------

export const getAllDataSources = (): DataSourceMeta[] => loadMetas();

export const getDataSourceMeta = (id: string): DataSourceMeta | null =>
  loadMetas().find((meta) => meta.id === id) ?? null;

export const getSubjectsOfDataSource = (id: string): Course[] =>
  getItem<Course[]>(subjectsKey(id), []);

export const getDataSourceById = (id: string): DataSource | null => {
  const meta = getDataSourceMeta(id);
  return meta ? { ...meta, subjects: getSubjectsOfDataSource(id) } : null;
};

// ---------- Active data source ----------

export const getActiveDataSourceId = (): string | null =>
  getItem<string | null>(ACTIVE_KEY, null);

export const setActiveDataSourceId = (id: string): boolean =>
  getDataSourceMeta(id) ? setItem(ACTIVE_KEY, id) : false;

export const getActiveDataSource = (): DataSource | null => {
  const activeId = getActiveDataSourceId();
  return activeId ? getDataSourceById(activeId) : null;
};

// ---------- Create ----------

export const addDataSource = (input: NewDataSource): DataSource | null => {
  const subjects = parseSubjects(input.raw);
  if (subjects.length === 0) return null; // format tidak dikenali / kosong

  const now = Date.now();
  const meta: DataSourceMeta = {
    id: generateId(),
    name: input.name.trim(),
    origin: "bima-upn",
    subjectCount: subjects.length,
    createdAt: now,
    updatedAt: now,
  };

  if (!setItem(subjectsKey(meta.id), subjects)) return null;

  if (!saveMetas([...loadMetas(), meta])) {
    removeItem(subjectsKey(meta.id)); // rollback
    return null;
  }

  // Data source pertama otomatis jadi aktif
  if (getActiveDataSourceId() === null) setActiveDataSourceId(meta.id);

  return { ...meta, subjects };
};

// ---------- Update ----------

// name: ganti nama saja. raw: impor ulang (parse ulang) isi data source
export const updateDataSource = (
  id: string,
  changes: DataSourceChanges
): DataSource | null => {
  const metas = loadMetas();
  const target = metas.find((meta) => meta.id === id);
  if (!target) return null;

  const newSubjects = changes.raw !== undefined ? parseSubjects(changes.raw) : null;
  if (newSubjects && newSubjects.length === 0) return null;

  if (newSubjects && !setItem(subjectsKey(id), newSubjects)) return null;

  const updated: DataSourceMeta = {
    ...target,
    ...(changes.name !== undefined && { name: changes.name.trim() }),
    ...(newSubjects && { subjectCount: newSubjects.length }),
    updatedAt: Date.now(),
  };

  const saved = saveMetas(metas.map((meta) => (meta.id === id ? updated : meta)));
  if (!saved) return null;

  return { ...updated, subjects: newSubjects ?? getSubjectsOfDataSource(id) };
};

// ---------- Delete ----------

export const removeDataSource = (id: string): boolean => {
  const metas = loadMetas();
  const remaining = metas.filter((meta) => meta.id !== id);
  if (remaining.length === metas.length) return false; // id tidak ditemukan

  if (!saveMetas(remaining)) return false;
  removeItem(subjectsKey(id));

  // Kalau yang dihapus sedang aktif, pindah ke data source pertama yang tersisa
  if (getActiveDataSourceId() === id) {
    remaining.length > 0 ? setItem(ACTIVE_KEY, remaining[0].id) : removeItem(ACTIVE_KEY);
  }
  return true;
};

export const clearDataSources = (): boolean => {
  loadMetas().forEach((meta) => removeItem(subjectsKey(meta.id)));
  removeItem(ACTIVE_KEY);
  return removeItem(META_KEY);
};