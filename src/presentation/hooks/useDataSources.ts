import { useReducer } from 'react'
import { getDataSource, getDataSources } from '../../business/use-cases/datasource/getDataSource'
import { getPlans } from '../../business/use-cases/plan/getPlan'
import { deleteDataSource } from '../../business/use-cases/datasource/deleteDataSource'
import { parseSubjects } from '../../business/use-cases/parser'
import { createDataSource } from '../../business/use-cases/datasource/createDataSource'
export function readSource(id: string) {
  const source = getDataSource(id);
  if (!source) return null;
  // Katalog yang tersimpan sebelum perubahan format dapat belum memiliki schedules.
  return { ...source, schedules: Array.isArray(source.schedules) ? source.schedules : [] };
}


export function useDataSources() {
  const [, refresh] = useReducer((revision: number) => revision + 1, 0);
  function change<T>(action: () => T) {
    const result = action();
    refresh();
    return result;
  }
  return {
    sources: getDataSources(),
    source: readSource,
    preview: parseSubjects,
    saveSource: (name: string, raw: string) =>
      change(() => {
        const result = createDataSource({ name, raw });

        if (!result.dataSource) throw new Error(result.error);
        return result.dataSource;
      }),
    deleteSource: (id: string) => {
      change(() => {
        if (getPlans().some((plan) => plan.datasourceId === id)) {
          throw new Error("Sumber ini masih dipakai oleh rencana KRS.");
        }
        const result = deleteDataSource(id);
        if (!result.success) throw new Error(result.error);
      });
    },
  }
}

export type DataSources = ReturnType<typeof useDataSources>
