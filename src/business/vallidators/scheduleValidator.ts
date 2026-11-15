import type { GeneratedScheduleItem } from "../interfaces/ScheduleGenerator";
import type { Schedule } from "../types/scedule.types";
import { checkScheduleConflict } from "../use-cases/checkScheduleConflict";

export type ValidationIssueType =
  | "empty"
  | "unknown-schedule"
  | "duplicate-course"
  | "time-conflict";

export interface ValidationIssue {
  type: ValidationIssueType;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  schedules: Schedule[]; // jadwal hasil AI yang lolos, sudah berupa Schedule lengkap
  issues: ValidationIssue[];
}

export const validateGeneratedSchedule = (
  generated: GeneratedScheduleItem[],
  available: Schedule[],
): ValidationResult => {
  if (generated.length === 0) {
    return {
      valid: false,
      schedules: [],
      issues: [
        { type: "empty", message: "AI tidak menghasilkan jadwal apa pun." },
      ],
    };
  }

  const availableById = new Map(
    available.map((schedule) => [schedule.id, schedule]),
  );

  const issues: ValidationIssue[] = [];
  const accepted: Schedule[] = [];

  for (const item of generated) {
    const schedule = availableById.get(item.id);

    if (!schedule) {
      issues.push({
        type: "unknown-schedule",
        message: `Jadwal dengan id ${item.id} tidak ada di daftar jadwal.`,
      });
      continue;
    }

    if (accepted.some((picked) => picked.course.id === schedule.course.id)) {
      issues.push({
        type: "duplicate-course",
        message: `${schedule.course.name} dipilih lebih dari satu kelas.`,
      });
      continue;
    }

    const { hasConflict } = checkScheduleConflict(schedule, accepted);
    if (hasConflict) {
      issues.push({
        type: "time-conflict",
        message: `${schedule.course.name} (${schedule.className}) bentrok dengan jadwal lain.`,
      });
      continue;
    }

    accepted.push(schedule);
  }

  return { valid: issues.length === 0, schedules: accepted, issues };
};
