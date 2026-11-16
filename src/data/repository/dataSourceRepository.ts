import { getItem, setItem, removeItem } from "../storage/localStorage";
import { parseSubjects } from "../../business/use-cases/parser";
import type { DataSource } from "../../business/types/datasource.types";

export interface NewDataSource {
  name: string;
  raw: string;
}

export type DataSourceChanges = Partial<NewDataSource>;

const DATA_SOURCES_KEY = "schedule:data-sources";

const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const loadDataSources = (): DataSource[] =>
  getItem<DataSource[]>(DATA_SOURCES_KEY, []);

const saveDataSources = (dataSources: DataSource[]): boolean =>
  setItem(DATA_SOURCES_KEY, dataSources);

export const getAllDataSources = (): DataSource[] => loadDataSources();

export const getDataSourceById = (id: string): DataSource | null =>
  loadDataSources().find((dataSource) => dataSource.id === id) ?? null;

export const getSubjectsOfDataSource = (id: string): DataSource["schedules"] =>
  getDataSourceById(id)?.schedules ?? [];

export const addDataSource = (input: NewDataSource): DataSource | null => {
  const schedules = parseSubjects(input.raw);
  if (schedules.length === 0) return null;

  const now = Date.now();
  const dataSource: DataSource = {
    id: generateId(),
    name: input.name.trim(),
    schedules,
    createdAt: now,
    updatedAt: now,
  };

  return saveDataSources([...loadDataSources(), dataSource])
    ? dataSource
    : null;
};

export const updateDataSource = (
  id: string,
  changes: DataSourceChanges,
): DataSource | null => {
  const dataSources = loadDataSources();
  const target = dataSources.find((dataSource) => dataSource.id === id);
  if (!target) return null;

  const newSchedules =
    changes.raw !== undefined ? parseSubjects(changes.raw) : null;
  if (newSchedules && newSchedules.length === 0) return null;

  const updated: DataSource = {
    ...target,
    ...(changes.name !== undefined && { name: changes.name.trim() }),
    ...(newSchedules && { schedules: newSchedules }),
    updatedAt: Date.now(),
  };

  const saved = saveDataSources(
    dataSources.map((dataSource) =>
      dataSource.id === id ? updated : dataSource,
    ),
  );

  return saved ? updated : null;
};

export const removeDataSource = (id: string): boolean => {
  const dataSources = loadDataSources();
  const remaining = dataSources.filter((dataSource) => dataSource.id !== id);
  if (remaining.length === dataSources.length) return false;

  return saveDataSources(remaining);
};

export const clearDataSources = (): boolean => removeItem(DATA_SOURCES_KEY);
