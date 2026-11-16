import type { Schedule } from "../../business/types/scedule.types";

export const days = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

const dayLabels: Record<string, string> = {
  Senin: "Monday",
  Selasa: "Tuesday",
  Rabu: "Wednesday",
  Kamis: "Thursday",
  Jumat: "Friday",
  Sabtu: "Saturday",
  Minggu: "Sunday",
};

export const dayLabel = (day: string) => dayLabels[day] ?? day;
export const hours = (schedule: Schedule) => schedule.intervalTime;
export const time = (schedule: Schedule) =>
  `${hours(schedule).start}–${hours(schedule).end}`;
export const credits = (schedules: Schedule[]) =>
  schedules.reduce((sum, schedule) => sum + schedule.course.credits, 0);
export const minutes = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
};
