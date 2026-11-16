import { useReducer } from 'react'
import { getPlans } from '../../business/use-cases/plan/getPlan'
import { deletePlan } from '../../business/use-cases/plan/deletePlan'
import { duplicatePlan } from '../../business/use-cases/plan/duplicatePlan'
import { addSchedule, calculatePlanData } from '../../business/use-cases/plan/addSchedule'
import { createPlan } from '../../business/use-cases/plan/createPlan'
import { removeSchedule } from '../../business/use-cases/plan/removeSchedule'
import { updatePlan } from '../../data/repository/planRepository'
import { generatePlanWithAI } from '../../container'
import { readSource } from './useDataSources'


export function usePlans() {
  const [, refresh] = useReducer((revision: number) => revision + 1, 0);
  function change<T>(action: () => T) {
    const result = action();
    refresh();
    return result;
  }
  return {
    plans: getPlans(),
    availability: calculatePlanData,
    createPlan: (name: string, datasourceId: string, courseCodes: string[] = []) =>
      change(() => {
        if (!readSource(datasourceId)?.schedules.length)
          throw new Error("Pilih sumber data jadwal.");
        const result = createPlan({ name, datasourceId, courseCodes });
        if (!result.plan) throw new Error(result.error);
        return result.plan;
      }),
    updatePlanCourses: (planId: string, courseCodes: string[]) =>
      change(() => {
        const plan = updatePlan(planId, { choosedCourses: courseCodes });
        if (!plan) throw new Error("Plan tidak ditemukan.");
        return plan;
      }),
    generatePlanWithAI: async (planId: string, prompt: string) => {
      const plan = getPlans().find((item) => item.id === planId);
      if (!plan?.datasourceId) throw new Error("Plan belum terhubung ke sumber data.");

      const sourceSchedules = readSource(plan.datasourceId)?.schedules ?? [];
      const courseCodes = plan.choosedCourses ?? [];
      const schedules = sourceSchedules.filter((schedule) =>
        courseCodes.includes(schedule.course.code),
      );
      const result = await generatePlanWithAI({ prompt, schedules });
      if (!result.success) {
        const detail = result.issues?.map((issue) => issue.message).join(" ");
        throw new Error(detail ? `${result.error} ${detail}` : result.error);
      }

      const latestPlan = getPlans().find((item) => item.id === planId);
      if (!latestPlan || latestPlan.updatedAt !== plan.updatedAt) {
        throw new Error("Rencana berubah selama AI bekerja. Buat jadwal ulang.");
      }
      const currentIds = new Set(latestPlan.data?.choosed ?? []);
      const generatedIds = new Set(result.schedules.map((schedule) => schedule.id));
      try {
        for (const scheduleId of currentIds) {
          if (!generatedIds.has(scheduleId)) {
            const removed = removeSchedule({ planId, scheduleId });
            if (!removed.success) throw new Error(removed.error);
          }
        }
        for (const schedule of result.schedules) {
          if (!currentIds.has(schedule.id)) {
            const added = addSchedule({ planId, scheduleId: schedule.id });
            if (!added.success) throw new Error(added.error);
          }
        }
        if (!updatePlan(planId, { choosedCourses: courseCodes })) {
          throw new Error("Pilihan mata kuliah gagal disimpan.");
        }
        return result;
      } finally {
        refresh();
      }
    },
    duplicatePlan: (id: string) =>
      change(() => {
        const result = duplicatePlan(id);
        if (!result.plan) throw new Error(result.error);
        return result.plan;
      }),
    deletePlan: (id: string) => {
      change(() => {
        const result = deletePlan(id);
        if (!result.success) throw new Error(result.error);
      });
    },
    pick: (planId: string, scheduleId: number, remove = false) => {
      change(() => {
        const result = (remove ? removeSchedule : addSchedule)({
          planId,
          scheduleId,
        });
        if (!result.success) throw new Error(result.error);
      });
    },
  }
}

export type Plans = ReturnType<typeof usePlans>
