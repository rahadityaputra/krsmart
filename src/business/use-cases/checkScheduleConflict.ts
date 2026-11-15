import type { Schedule } from "../types/scedule.types";

export type ConflictReason = "time" | "room" | "lecturer";

export interface ScheduleConflict {
  schedule: Schedule;
  reasons: ConflictReason[];
  sharedLecturers: string[];
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ScheduleConflict[];
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const isTimeOverlap = (a: Schedule, b: Schedule): boolean =>
  a.day === b.day &&
  toMinutes(a.intervalTime.start) < toMinutes(b.intervalTime.end) &&
  toMinutes(b.intervalTime.start) < toMinutes(a.intervalTime.end);

const normalize = (text: string): string => text.trim().toLowerCase();

const isSameRoom = (a: Schedule, b: Schedule): boolean =>
  normalize(a.classRoom) === normalize(b.classRoom);

const getSharedLecturers = (a: Schedule, b: Schedule): string[] =>
  a.lecturers.filter((lecturer) => b.lecturers.includes(lecturer));

const buildConflict = (schedule: Schedule, other: Schedule): ScheduleConflict => {
  const sharedLecturers = getSharedLecturers(schedule, other);

  const reasons: ConflictReason[] = [
    "time",
    ...(isSameRoom(schedule, other) ? (["room"] as const) : []),
    ...(sharedLecturers.length > 0 ? (["lecturer"] as const) : []),
  ];

  return { schedule: other, reasons, sharedLecturers };
};

export const checkScheduleConflict = (
  schedule: Schedule,
  others: Schedule[]
): ConflictResult => {
  const conflicts = others
    .filter((other) => other.id !== schedule.id)
    .filter((other) => isTimeOverlap(schedule, other))
    .map((other) => buildConflict(schedule, other));

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
};