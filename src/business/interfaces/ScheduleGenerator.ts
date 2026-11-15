import type { Schedule } from "../types/scedule.types";

export interface GenerateScheduleRequest {
  prompt: string;
  schedules: Schedule[];
}

export interface GeneratedScheduleItem {
  id: number;
}

export interface GeneratedSchedule {
  schedules: GeneratedScheduleItem[];
  reasoning?: string;
}

export type ScheduleGeneratorResult =
  | { ok: true; data: GeneratedSchedule }
  | { ok: false; error: string };

export interface ScheduleGenerator {
  generate: (
    request: GenerateScheduleRequest,
  ) => Promise<ScheduleGeneratorResult>;
}
