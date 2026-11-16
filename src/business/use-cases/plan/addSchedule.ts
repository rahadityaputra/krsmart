import {
  addSubjectToPlan,
  getPlanById,
} from "../../../data/repository/planRepository";
import { getSubjectsOfDataSource } from "../../../data/repository/dataSourceRepository";
import { checkScheduleConflict } from "../checkScheduleConflict";
import type { Plan, PlanData, UnavailableCourse } from "../../types/plan.types";
import type { Schedule } from "../../types/scedule.types";
import type { ConflictResult } from "../checkScheduleConflict";

export interface AddScheduleInput {
  planId: string;
  scheduleId: number;
}

export interface AddScheduleResult {
  success: boolean;
  plan?: Plan;
  conflict?: ConflictResult;
  error?: string;
}

const describe = (schedule: Schedule): string =>
  `${schedule.course.name} (${schedule.className})`;

export const calculatePlanData = (
  allSchedules: Schedule[],
  choosedIds: number[]
): PlanData => {
  const choosedSchedules = allSchedules.filter((s) => choosedIds.includes(s.id));
  const choosedCourseIds = new Set(choosedSchedules.map((s) => s.course.id));

  const available: number[] = [];
  const unavailable: UnavailableCourse[] = [];

  for (const schedule of allSchedules) {
    if (choosedIds.includes(schedule.id)) continue;

    const reasons: string[] = [];

    if (choosedCourseIds.has(schedule.course.id)) {
      reasons.push("Mata kuliah sudah dipilih pada jadwal lain");
    }

    const conflictResult = checkScheduleConflict(schedule, choosedSchedules);
    if (conflictResult.hasConflict) {
      for (const conflict of conflictResult.conflicts) {
        const target = describe(conflict.schedule);
        for (const reason of conflict.reasons) {
          if (reason === "time") reasons.push(`Bentrok waktu dengan ${target}`);
          else if (reason === "room") reasons.push(`Ruangan sama dengan ${target}`);
          else reasons.push(`Dosen bersamaan dengan ${target}`);
        }
      }
    }

    if (reasons.length > 0) {
      unavailable.push({ id: schedule.id, reason: reasons });
    } else {
      available.push(schedule.id);
    }
  }

  return { choosed: choosedIds, available, unavailable };
};

export const addSchedule = (input: AddScheduleInput): AddScheduleResult => {
  const { planId, scheduleId } = input;

  const plan = getPlanById(planId);
  if (!plan) {
    return { success: false, error: "Plan tidak ditemukan." };
  }

  const currentChoosed = plan.data?.choosed ?? [];
  if (currentChoosed.includes(scheduleId)) {
    return { success: false, error: "Jadwal sudah ada di plan ini." };
  }

  if (!plan.datasourceId) {
    return { success: false, error: "Plan belum terhubung ke data source." };
  }

  const allSchedules = getSubjectsOfDataSource(plan.datasourceId);
  const scheduleToAdd = allSchedules.find((s) => s.id === scheduleId);
  if (!scheduleToAdd) {
    return { success: false, error: "Jadwal tidak ditemukan di data source." };
  }

  const choosedSchedules = allSchedules.filter((s) => currentChoosed.includes(s.id));

  const sameCourse = choosedSchedules.find(
    (s) => s.course.id === scheduleToAdd.course.id
  );
  if (sameCourse) {
    return {
      success: false,
      error: `Mata kuliah ${scheduleToAdd.course.name} sudah dipilih pada jadwal ${sameCourse.className}.`,
    };
  }

  const conflictResult = checkScheduleConflict(scheduleToAdd, choosedSchedules);
  if (conflictResult.hasConflict) {
    return {
      success: false,
      conflict: conflictResult,
      error: "Jadwal bentrok dengan jadwal yang sudah dipilih.",
    };
  }

  const nextChoosed = [...currentChoosed, scheduleId];
  const updatedPlanData = calculatePlanData(allSchedules, nextChoosed);

  const updated = addSubjectToPlan(
    planId,
    scheduleId,
    scheduleToAdd.course.code,
    updatedPlanData
  );

  if (!updated) {
    return { success: false, error: "Gagal menyimpan perubahan plan." };
  }

  return { success: true, plan: updated };
};