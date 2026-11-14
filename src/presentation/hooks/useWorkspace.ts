import { useReducer } from 'react'
import { addDataSource } from '../../business/use-cases/datasource/addDataSource'
import { getDataSource, getDataSources } from '../../business/use-cases/datasource/getDataSource'
import { addPlan } from '../../business/use-cases/plan/addPlan'
import { getPlans } from '../../business/use-cases/plan/getPlan'
import { deletePlan } from '../../business/use-cases/plan/deletePlan'
import { duplicatePlan } from '../../business/use-cases/plan/duplicatePlan'
import { addCourse, calculatePlanData } from '../../business/use-cases/plan/addCourse'
import { removeCourse } from '../../business/use-cases/plan/removeCourse'
import { deleteDataSource } from '../../business/use-cases/datasource/deleteDataSource'
import { parseSubjects } from '../../business/use-cases/parser'

export function useWorkspace() {
  const [, refresh] = useReducer((revision: number) => revision + 1, 0)
  function change<T>(action: () => T) {
    const result = action()
    refresh()
    return result
  }
  return {
    plans: getPlans(),
    sources: getDataSources(),
    source: getDataSource,
    preview: parseSubjects,
    availability: calculatePlanData,
    saveSource: (name: string, raw: string) => change(() => {
      const result = addDataSource({ name, raw })
      if (!result.dataSource) throw new Error(result.error)
      return result.dataSource
    }),
    deleteSource: (id: string) => change(() => {
      if (getPlans().some((plan) => plan.datasourceId === id)) {
        throw new Error('Sumber ini masih dipakai oleh rencana KRS.')
      }
      const result = deleteDataSource(id)
      if (!result.success) throw new Error(result.error)
    }),
    createPlan: (name: string, datasourceId: string) => change(() => {
      if (!getDataSource(datasourceId)) throw new Error('Pilih sumber data jadwal.')
      const result = addPlan({ name, datasourceId })
      if (!result.plan) throw new Error(result.error)
      return result.plan
    }),
    duplicatePlan: (id: string) => change(() => {
      const result = duplicatePlan(id)
      if (!result.plan) throw new Error(result.error)
      return result.plan
    }),
    deletePlan: (id: string) => change(() => {
      const result = deletePlan(id)
      if (!result.success) throw new Error(result.error)
    }),
    pick: (planId: string, courseId: number, remove = false) => change(() => {
      const result = (remove ? removeCourse : addCourse)({ planId, courseId })
      if (!result.success) throw new Error(result.error)
    }),
  }
}

export type Workspace = ReturnType<typeof useWorkspace>
