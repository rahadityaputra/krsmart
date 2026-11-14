import type { Schedule } from "../types/scedule.types";
import type { Course } from "../types/course.types";

export type ConflictReason = "time" | "room" | "lecturer";

export interface ScheduleConflict {
  subject: Course;               
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

const isSameRoom = (a: Course, b: Course): boolean =>
  normalize(a.classRoom) === normalize(b.classRoom);

const getSharedLecturers = (a: Course, b: Course): string[] =>
  a.lecturers.filter((lecturer) => b.lecturers.includes(lecturer));

const buildConflict = (subject: Course, other: Course): ScheduleConflict => {
  const sharedLecturers = getSharedLecturers(subject, other);

  const reasons: ConflictReason[] = [
    "time",
    ...(isSameRoom(subject, other) ? (["room"] as const) : []),
    ...(sharedLecturers.length > 0 ? (["lecturer"] as const) : []),
  ];

  return { subject: other, reasons, sharedLecturers };
};

export const checkScheduleConflict = (
  subject: Course,
  others: Course[]
): ConflictResult => {
  const conflicts = others
    .filter((other) => other.id !== subject.id)
    .filter((other) => isTimeOverlap(subject.schedule, other.schedule))
    .map((other) => buildConflict(subject, other));

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
};