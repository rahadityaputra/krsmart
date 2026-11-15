import type { Schedule } from "./scedule.types";

export interface DataSource {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  schedules: Schedule[];
}
